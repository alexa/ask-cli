const R = require('ramda');
const fs = require('fs-extra');
const path = require('path');

const retryUtils = require('@src/utils/retry-utility');
const ResourcesConfig = require('@src/model/resources-config');
const SmapiClient = require('@src/clients/smapi-client/index.js');
const httpClient = require('@src/clients/http-client');
const Manifest = require('@src/model/manifest');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const stringUtils = require('@src/utils/string-utils');
const zipUtils = require('@src/utils/zip-utils');
const hashUtils = require('@src/utils/hash-utils');
const CONSTANTS = require('@src/utils/constants');
const CLiError = require('@src/exceptions/cli-error');
const CLiWarn = require('@src/exceptions/cli-warn');

module.exports = class SkillMetadataController {
    /**
     * Constructor for SkillMetadataController
     * @param {Object} configuration { profile, doDebug }
     */
    constructor(configuration) {
        const { profile, doDebug } = configuration;
        this.smapiClient = new SmapiClient({ profile, doDebug });
        this.profile = profile;
        this.doDebug = doDebug;
    }

    /**
     * Entry method for all the skill package deployment logic
     * @param {String} vendorId
     * @param {Function} callback (error)
     */
    deploySkillPackage(vendorId, ignoreHash, callback) {
        // 1.get valid skillMetada src path
        const skillPackageSrc = ResourcesConfig.getInstance().getSkillMetaSrc(this.profile);
        if (!stringUtils.isNonBlankString(skillPackageSrc)) {
            return callback('Skill package src is not found in ask-resources.json.');
        }
        if (!fs.existsSync(skillPackageSrc)) {
            return callback(`File ${skillPackageSrc} does not exist.`);
        }

        // 2.compare hashcode between current and previous status to decide if necessary to upload
        hashUtils.getHash(skillPackageSrc, (hashErr, currentHash) => {
            if (hashErr) {
                return callback(hashErr);
            }
            const lastDeployHash = ResourcesConfig.getInstance().getSkillMetaLastDeployHash(this.profile);
            if (!ignoreHash && stringUtils.isNonBlankString(lastDeployHash) && lastDeployHash === currentHash) {
                return callback('The hash of current skill package folder does not change compared to the last deploy hash result, '
                + 'CLI will skip the deploy of skill package.');
            }

            // 3.call smapiClient to create/upload skillPackage
            const skillId = ResourcesConfig.getInstance().getSkillId(this.profile);
            this.putSkillPackage(skillId, skillId ? null : vendorId, (putErr, currentSkillId) => {
                if (putErr) {
                    return callback(putErr);
                }
                ResourcesConfig.getInstance().setSkillId(this.profile, currentSkillId);
                ResourcesConfig.getInstance().setSkillMetaLastDeployHash(this.profile, currentHash);
                callback();
            });
        });
    }

    /**
     * Validates domain info
     */
    validateDomain() {
        const domainInfo = Manifest.getInstance().getApis();
        if (!domainInfo || R.isEmpty(domainInfo)) {
            throw new CLiError('Skill information is not valid. Please make sure "apis" field in the skill.json is not empty.');
        }

        const domainList = R.keys(domainInfo);
        if (domainList.length !== 1) {
            throw new CLiWarn('Skill with multiple api domains cannot be enabled. Skip the enable process.');
        }
        if (CONSTANTS.SKILL.DOMAIN.CAN_ENABLE_DOMAIN_LIST.indexOf(domainList[0]) === -1) {
            throw new CLiWarn(`Skill api domain "${domainList[0]}" cannot be enabled. Skip the enable process.`);
        }
    }

    /**
     * Function used to enable skill. It calls smapi getSkillEnablement function first to check if skill is already enabled,
     * if not, it will enable the skill by calling smapi enableSkill function.
     * @param {Function} callback (err, null)
     */
    enableSkill(callback) {
        const skillId = ResourcesConfig.getInstance().getSkillId(this.profile);
        if (!stringUtils.isNonBlankString(skillId)) {
            return callback(`[Fatal]: Failed to find the skillId for profile [${this.profile}],
 please make sure the skill metadata deployment has succeeded with result of a valid skillId.`);
        }

        this.smapiClient.skill.getSkillEnablement(skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, response) => {
            if (err) {
                return callback(err);
            }
            if (response.statusCode === CONSTANTS.HTTP_REQUEST.STATUS_CODE.NOT_FOUND) {
                this.smapiClient.skill.enableSkill(skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (enableErr, enableResponse) => {
                    if (enableErr) {
                        return callback(enableErr);
                    }
                    if (enableResponse.statusCode >= 300) {
                        return callback(jsonView.toString(enableResponse.body));
                    }
                    Messenger.getInstance().info('Skill is enabled successfully.');

                    callback();
                });
            } else if (response.statusCode >= 300) {
                callback(jsonView.toString(response.body));
            } else {
                Messenger.getInstance().info('Skill is already enabled, skip the enable process.');
                callback();
            }
        });
    }

    /**
     * Put skill package based on the input of skillId and vendorId:
     *   when vendorId is set but skillId is not, create skill package;
     *   when skillId is set but vendorId is not, update skill package.
     *
     * @param {String} skillId
     * @param {String} vendorId
     * @param {Function} callback (error, skillId)
     */
    putSkillPackage(skillId, vendorId, callback) {
        // 1.zip and upload skill package
        const skillPackageSrc = ResourcesConfig.getInstance().getSkillMetaSrc(this.profile);
        this.uploadSkillPackage(skillPackageSrc, (uploadErr, uploadResult) => {
            if (uploadErr) {
                return callback(uploadErr);
            }
            // 2.import skill package with upload URL
            this._importPackage(skillId, vendorId, uploadResult.uploadUrl, (importErr, importResponse) => {
                if (importErr) {
                    return callback(importErr);
                }
                const importId = path.basename(importResponse.headers.location);
                // 3.poll for the skill package import status
                this._pollImportStatus(importId, (pollErr, pollResponse) => {
                    if (pollErr) {
                        return callback(pollErr);
                    }
                    if (pollResponse.body.status !== CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED) {
                        callback(jsonView.toString(pollResponse.body));
                    } else {
                        callback(null, pollResponse.body.skill.skillId);
                    }
                });
            });
        });
    }

    /**
     * Download the skill package by exporting the skill package and then download it into the skill project
     * @param {String} rootFolder Folder path for the skill project root
     * @param {String} skillId
     * @param {String stage
     * @param {Function} callback
     */
    getSkillPackage(rootFolder, skillId, stage, callback) {
        // 1.request to export skill package
        this._exportPackage(skillId, stage, (exportErr, exportResponse) => {
            if (exportErr) {
                return callback(exportErr);
            }
            const exportId = path.basename(R.view(R.lensPath(['headers', 'location']), exportResponse));

            // 2.poll for the skill package export status
            this._pollExportStatus(exportId, (pollErr, pollResponse) => {
                if (pollErr) {
                    return callback(pollErr);
                }
                // TODO: check the error when statusCode is not 200 or check the body strucutre when status is not SUCCEEDED or check non skill case

                // 3.download skill package into local file system
                const skillPackageLocation = R.view(R.lensPath(['body', 'skill', 'location']), pollResponse);
                const targetPath = path.join(rootFolder, 'skill-package');
                zipUtils.unzipRemoteZipFile(skillPackageLocation, targetPath, false, (unzipErr) => {
                    callback(unzipErr);
                });
            });
        });
    }

    /**
     * Upload skill package by zipping, creating upload URL, and then upload
     * @param {String} skillPackageSrc
     * @param {Function} callback (err, { uploadUrl, expiresAt })
     */
    uploadSkillPackage(skillPackageSrc, callback) {
        // 1.create upload URL for CLI to upload
        this._createUploadUrl((createUploadErr, createUploadResult) => {
            if (createUploadErr) {
                return callback(createUploadErr);
            }
            // 2.zip skill package
            zipUtils.createTempZip(skillPackageSrc, (zipErr, zipFilePath) => {
                if (zipErr) {
                    return callback(zipErr);
                }
                // 3.upload zip file
                const uploadPayload = fs.readFileSync(zipFilePath);
                const operation = 'upload-skill-package';
                httpClient.putByUrl(createUploadResult.uploadUrl, uploadPayload, operation, this.doDebug, (uploadErr, uploadResponse) => {
                    fs.removeSync(zipFilePath);
                    if (uploadErr) {
                        return callback(uploadErr);
                    }
                    if (uploadResponse.statusCode >= 300) {
                        return callback('[Error]: Upload of skill package failed. Please try again with --debug to see more details.');
                    }
                    callback(null, createUploadResult);
                });
            });
        });
    }

    /**
     * Wrapper for smapi createUpload function
     * @param {Function} callback (err, { uploadUrl, expiresAt })
     */
    _createUploadUrl(callback) {
        this.smapiClient.skillPackage.createUpload((createErr, createResponse) => {
            if (createErr) {
                return callback(createErr);
            }
            if (createResponse.statusCode >= 300) {
                return callback(jsonView.toString(createResponse.body));
            }
            callback(null, {
                uploadUrl: createResponse.body.uploadUrl,
                expiresAt: createResponse.body.expiresAt
            });
        });
    }

    /**
     * Wrapper for smapi importPackage function. The response contains importId in its headers' location url.
     * @param {String} skillId
     * @param {String} vendorId
     * @param {String} location
     * @param {Function} callback (err, importResponse)
     */
    _importPackage(skillId, vendorId, location, callback) {
        this.smapiClient.skillPackage.importPackage(skillId, vendorId, location, (importErr, importResponse) => {
            if (importErr) {
                return callback(importErr);
            }
            if (importResponse.statusCode >= 300) {
                return callback(jsonView.toString(importResponse.body));
            }
            callback(null, importResponse);
        });
    }

    /**
     * Wrapper for smapi exportPackage function
     * @param {String} skillId
     * @param {String} stage
     * @param {Function} callback
     */
    _exportPackage(skillId, stage, callback) {
        this.smapiClient.skillPackage.exportPackage(skillId, stage, (exportErr, exportResponse) => {
            if (exportErr) {
                return callback(exportErr);
            }
            if (exportResponse.statusCode >= 300) {
                return callback(jsonView.toString(exportResponse.body));
            }
            callback(null, exportResponse);
        });
    }

    /**
     * Wrapper for polling smapi skill package import status.
     * @param {String} importId
     * @param {Function} callback (err, lastImportStatus)
     */
    _pollImportStatus(importId, callback) {
        const retryConfig = {
            base: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.MIN_TIME_OUT,
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.MAX_RETRY
        };
        const retryCall = (loopCallback) => {
            this.smapiClient.skillPackage.getImportStatus(importId, (pollErr, pollResponse) => {
                if (pollErr) {
                    return loopCallback(pollErr);
                }
                if (pollResponse.statusCode >= 300) {
                    return loopCallback(jsonView.toString(pollResponse.body));
                }
                loopCallback(null, pollResponse);
            });
        };
        const shouldRetryCondition = retryResponse => retryResponse.body.status === CONSTANTS.SKILL.PACKAGE_STATUS.IN_PROGRESS;
        retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
    }

    /**
     * Wrapper for polling smapi skill package export status.
     * @param {String} exportId
     * @param {Function} callback (err, lastExportStatus)
     */
    _pollExportStatus(exportId, callback) {
        const retryConfig = {
            base: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.MIN_TIME_OUT,
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.MAX_RETRY
        };
        const retryCall = (loopCallback) => {
            this.smapiClient.skillPackage.getExportStatus(exportId, (pollErr, pollResponse) => {
                if (pollErr) {
                    return loopCallback(pollErr);
                }
                if (pollResponse.statusCode >= 300) {
                    return loopCallback(jsonView.toString(pollResponse.body));
                }
                loopCallback(null, pollResponse);
            });
        };
        const shouldRetryCondition = retryResponse => retryResponse.body.status === CONSTANTS.SKILL.PACKAGE_STATUS.IN_PROGRESS;
        retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
    }
};
