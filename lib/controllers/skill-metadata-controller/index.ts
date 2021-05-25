import R from 'ramda';
import fs from 'fs-extra';
import path from 'path';

import { retry } from '@src/utils/retry-utility';
import ResourcesConfig from '@src/model/resources-config';
import SmapiClient from '@src/clients/smapi-client/index.js';
import httpClient from '@src/clients/http-client';
import Manifest from '@src/model/manifest';
import Messenger from '@src/view/messenger';
import jsonView from '@src/view/json-view';
import stringUtils from '@src/utils/string-utils';
import zipUtils from '@src/utils/zip-utils';
import hashUtils from '@src/utils/hash-utils';
import * as CONSTANTS from '@src/utils/constants';
import CLiError from '@src/exceptions/cli-error';
import CLiWarn from '@src/exceptions/cli-warn';

const getResourcesConfig = () => ResourcesConfig.getInstance() as ResourcesConfig;
const getManifest = () => Manifest.getInstance() as Manifest;

export interface ISkillMetadataController {
    profile: string;
    doDebug: boolean;
};

export default class SkillMetadataController {
    private profile: string;
    private doDebug: boolean;
    private smapiClient: SmapiClient;

    /**
     * Constructor for SkillMetadataController
     * @param {Object} configuration { profile, doDebug }
     */
    constructor(configuration: ISkillMetadataController) {
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
    deploySkillPackage(vendorId: string, ignoreHash: boolean, callback: Function) {
        // 1.get valid skillMetada src path
        const skillPackageSrc = getResourcesConfig().getSkillMetaSrc(this.profile);
        if (!stringUtils.isNonBlankString(skillPackageSrc)) {
            return callback('Skill package src is not found in ask-resources.json.');
        }
        if (!fs.existsSync(skillPackageSrc)) {
            return callback(`File ${skillPackageSrc} does not exist.`);
        }

        // 2.compare hashcode between current and previous status to decide if necessary to upload
        hashUtils.getHash(skillPackageSrc, (hashErr?: Error, currentHash?: any) => {
            if (hashErr) {
                return callback(hashErr);
            }
            const lastDeployHash = getResourcesConfig().getSkillMetaLastDeployHash(this.profile);
            if (!ignoreHash && stringUtils.isNonBlankString(lastDeployHash) && lastDeployHash === currentHash) {
                return callback('The hash of current skill package folder does not change compared to the last deploy hash result, '
                + 'CLI will skip the deploy of skill package.');
            }

            // 3.call smapiClient to create/upload skillPackage
            const skillId = getResourcesConfig().getSkillId(this.profile);
            this.putSkillPackage(skillId, (skillId ? null : vendorId) as string, (putErr?: Error, currentSkillId?: any) => {
                if (putErr) {
                    return callback(putErr);
                }
                getResourcesConfig().setSkillId(this.profile, currentSkillId);
                getResourcesConfig().setSkillMetaLastDeployHash(this.profile, currentHash);
                callback();
            });
        });
    }

    /**
     * Validates domain info
     */
    validateDomain() {
        const domainInfo = getManifest().getApis();
        if (!domainInfo || R.isEmpty(domainInfo)) {
            throw new CLiError('Skill information is not valid. Please make sure "apis" field in the skill.json is not empty.');
        }

        const domainList = R.keys(domainInfo);
        if (domainList.length !== 1) {
            throw new CLiWarn('Skill with multiple api domains cannot be enabled. Skip the enable process.');
        }
        const domain = domainList[0] as string;
        if (CONSTANTS.SKILL.DOMAIN.CAN_ENABLE_DOMAIN_LIST.indexOf(domain) === -1) {
            throw new CLiWarn(`Skill api domain "${domain}" cannot be enabled. Skip the enable process.`);
        }
    }

    /**
     * Function used to enable skill. It calls smapi getSkillEnablement function first to check if skill is already enabled,
     * if not, it will enable the skill by calling smapi enableSkill function.
     * @param {Function} callback (err, null)
     */
    enableSkill(callback: Function) {
        const skillId = getResourcesConfig().getSkillId(this.profile);
        if (!stringUtils.isNonBlankString(skillId)) {
            return callback(`[Fatal]: Failed to find the skillId for profile [${this.profile}],
 please make sure the skill metadata deployment has succeeded with result of a valid skillId.`);
        }

        this.smapiClient.skill.getSkillEnablement(skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err?: Error, response?: any) => {
            if (err) {
                return callback(err);
            }
            if (response.statusCode === CONSTANTS.HTTP_REQUEST.STATUS_CODE.NOT_FOUND) {
                this.smapiClient.skill.enableSkill(skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (enableErr?: Error, enableResponse?: any) => {
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
    putSkillPackage(skillId: string, vendorId: string, callback: Function) {
        // 1.zip and upload skill package
        const skillPackageSrc = getResourcesConfig().getSkillMetaSrc(this.profile);
        this.uploadSkillPackage(skillPackageSrc, (uploadErr?: Error, uploadResult?: any) => {
            if (uploadErr) {
                return callback(uploadErr);
            }
            // 2.import skill package with upload URL
            this._importPackage(skillId, vendorId, uploadResult.uploadUrl, (importErr?: Error, importResponse?: any) => {
                if (importErr) {
                    return callback(importErr);
                }
                const importId = path.basename(importResponse.headers.location);
                // 3.poll for the skill package import status
                this._pollImportStatus(importId, (pollErr?: Error, pollResponse?: any) => {
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
    getSkillPackage(rootFolder: string, skillId: string, stage: string, callback: Function) {
        // 1.request to export skill package
        this._exportPackage(skillId, stage, (exportErr?: Error, exportResponse?: any) => {
            if (exportErr) {
                return callback(exportErr);
            }
            const exportId = path.basename(R.view(R.lensPath(['headers', 'location']), exportResponse));

            // 2.poll for the skill package export status
            this._pollExportStatus(exportId, (pollErr?: Error, pollResponse?: any) => {
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
    uploadSkillPackage(skillPackageSrc: string, callback: Function) {
        // 1.create upload URL for CLI to upload
        this._createUploadUrl((createUploadErr?: Error, createUploadResult?: any) => {
            if (createUploadErr) {
                return callback(createUploadErr);
            }
            // 2.zip skill package
            const outputDir = path.join(process.cwd(), '.ask');
            zipUtils.createTempZip(skillPackageSrc, outputDir, (zipErr: any, zipFilePath: any) => {
                if (zipErr) {
                    return callback(zipErr);
                }
                // 3.upload zip file
                const uploadPayload = fs.readFileSync(zipFilePath);
                const operation = 'upload-skill-package';
                httpClient.putByUrl(createUploadResult.uploadUrl, uploadPayload, operation, this.doDebug, (uploadErr?: Error, uploadResponse?: any) => {
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
     * Read from the {skillPackage}/interactionModel/custom directory, check what locales the current project
     * is currently deploying to.
     * When we have the Model for entire skill-package, this method is better sitting there.
     *
     * @returns { [languageName]: iModelPath } where languageName is in the format of xx-YY
     */
    getInteractionModelLocales() {
        const skillPackagePath = path.join(process.cwd(), getResourcesConfig().getSkillMetaSrc(this.profile));
        const iModelFolderPath = path.join(skillPackagePath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.INTERACTION_MODEL, 'custom');
        const supportedLocaleFiles = fs.readdirSync(iModelFolderPath).filter((file) => {
            const fileExt = path.extname(file);
            const fileNameNoExt = path.basename(file, fileExt);
            return fileExt === '.json' && R.includes(fileNameNoExt, R.keys(CONSTANTS.ALEXA.LANGUAGES));
        });
        const result: any = {};
        supportedLocaleFiles.forEach((file) => {
            const fileNameNoExt = path.basename(file, path.extname(file));
            result[fileNameNoExt] = path.join(iModelFolderPath, file);
        });
        return result;
    }

    /**
     * Wrapper for smapi createUpload function
     * @param {Function} callback (err, { uploadUrl, expiresAt })
     */
    _createUploadUrl(callback: Function) {
        this.smapiClient.skillPackage.createUpload((createErr?: Error, createResponse?: any) => {
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
    _importPackage(skillId: string, vendorId: string, location: string, callback: Function) {
        this.smapiClient.skillPackage.importPackage(skillId, vendorId, location, (importErr?: Error, importResponse?: any) => {
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
    _exportPackage(skillId: string, stage: string, callback: Function) {
        this.smapiClient.skillPackage.exportPackage(skillId, stage, (exportErr?: Error, exportResponse?: any) => {
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
    _pollImportStatus(importId: string, callback: Function) {
        const retryConfig = {
            base: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.MIN_TIME_OUT,
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.MAX_RETRY
        };
        const retryCall = (loopCallback: Function) => {
            this.smapiClient.skillPackage.getImportStatus(importId, (pollErr?: Error, pollResponse?: any) => {
                if (pollErr) {
                    return loopCallback(pollErr);
                }
                if (pollResponse.statusCode >= 300) {
                    return loopCallback(jsonView.toString(pollResponse.body));
                }
                loopCallback(null, pollResponse);
            });
        };
        const shouldRetryCondition = (retryResponse: any) => retryResponse.body.status === CONSTANTS.SKILL.PACKAGE_STATUS.IN_PROGRESS;

        retry(retryConfig, retryCall, shouldRetryCondition, (err?: Error, res?: any) => callback(err, err ? null : res));
    }

    /**
     * Wrapper for polling smapi skill package export status.
     * @param {String} exportId
     * @param {Function} callback (err, lastExportStatus)
     */
    _pollExportStatus(exportId: string, callback: Function) {
        const retryConfig = {
            base: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.MIN_TIME_OUT,
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.MAX_RETRY
        };
        const retryCall = (loopCallback: Function) => {
            this.smapiClient.skillPackage.getExportStatus(exportId, (pollErr?: Error, pollResponse?: any) => {
                if (pollErr) {
                    return loopCallback(pollErr);
                }
                if (pollResponse.statusCode >= 300) {
                    return loopCallback(jsonView.toString(pollResponse.body));
                }
                loopCallback(null, pollResponse);
            });
        };
        const shouldRetryCondition = (retryResponse: any) => retryResponse.body.status === CONSTANTS.SKILL.PACKAGE_STATUS.IN_PROGRESS;
        retry(retryConfig, retryCall, shouldRetryCondition, (err?: Error, res?: any) => callback(err, err ? null : res));
    }
};
