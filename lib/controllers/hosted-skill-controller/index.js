const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const SmapiClient = require('@src/clients/smapi-client');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const CONSTANTS = require('@src/utils/constants');
const DynamicConfig = require('@src/utils/dynamic-config');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');

const cloneFlow = require('./clone-flow');
const helper = require('./helper.js');

module.exports = class HostedSkillController {
    constructor(configuration) {
        const { profile, doDebug } = configuration;
        this.profile = profile;
        this.doDebug = doDebug;
        this.smapiClient = new SmapiClient({ profile, doDebug });
        this.skillMetaController = new SkillMetadataController({ profile, doDebug });
    }

    /**
     * To create an Alexa hosted skill
     * @param {JSON} hostedSkillPayload the JSON representation of the skill, and provides Alexa with all of the metadata required
     * @param {callback} callback { error, response }
     */
    createSkill(hostedSkillPayload, callback) {
        this.smapiClient.skill.alexaHosted.createHostedSkill(hostedSkillPayload, (createErr, createRes) => {
            if (createErr) {
                return callback(createErr);
            }
            if (createRes.statusCode >= 300) {
                return callback(jsonView.toString(createRes.body));
            }
            const { skillId } = createRes.body;
            helper.pollingSkillStatus(this.smapiClient, skillId, (pollErr, pollRes) => {
                if (pollErr) {
                    return callback(pollErr);
                }
                helper.handleSkillStatus(pollRes, skillId, (handleErr) => {
                    callback(handleErr, skillId);
                });
            });
        });
    }

    /**
     * To clone an Alexa hosted skill from git repository to local project directory
     * @param {string} skillId The skill id
     * @param {string} skillName The skill name
     * @param {string} projectPath The skill project folder path
     * @param {callback} callback { error, response }
     */
    clone(skillId, skillName, projectPath, callback) {
        if (fs.existsSync(projectPath)) {
            return callback(`${projectPath} directory already exists.`);
        }
        // 0. get hosted skill info
        this.getHostedSkillMetadata(skillId, (metadataErr, metadata) => {
            if (metadataErr) {
                return callback(metadataErr);
            }
            // 1. generate project
            cloneFlow.generateProject(projectPath, skillId, skillName, metadata, this.profile);
            // 2. clone project, set up git
            cloneFlow.cloneProjectFromGit(projectPath, skillId, skillName, this.profile, metadata.repository.url, this.doDebug);
            // 3. check skill-package content
            cloneFlow.doSkillPackageExist(skillName, projectPath, skillId, (checkErr, doExist) => {
                if (checkErr) {
                    return callback(checkErr);
                }
                if (!doExist) {
                    this.skillMetaController.getSkillPackage(projectPath, skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (exportErr) => {
                        if (exportErr) {
                            return callback(exportErr);
                        }
                        Messenger.getInstance().info(`\nSkill schema and interactionModels for ${skillName} created at\n\t./skill-package\n`);
                        callback();
                    });
                } else {
                    Messenger.getInstance().info(`\nSkill schema and interactionModels for ${skillName} created at\n\t./skill-package\n`);
                    callback();
                }
            });
        });
    }

    /**
     * To fetch Alexa hosted skill metadata
     * @param {string} skillId The skill id
     * @param {callback} callback { error, response }
     */
    getHostedSkillMetadata(skillId, callback) {
        this.smapiClient.skill.alexaHosted.getAlexaHostedSkillMetadata(skillId, (err, response) => {
            if (err) {
                return callback(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                return callback(error);
            }
            callback(null, response.body.alexaHosted);
        });
    }

    /**
     * To check if current user is allowed to invoke HostedSkill functions
     * @param {string} vendorId The vendor ID
     * @param {string} permissionType The permission enum type
     * @param {callback} callback { error, response }
     */
    getHostedSkillPermission(vendorId, permissionType, callback) {
        this.smapiClient.skill.alexaHosted.getHostedSkillPermission(vendorId, permissionType, (err, response) => {
            if (err) {
                return callback(err);
            }
            if (response.statusCode >= 300) {
                return callback(jsonView.toString(response.body));
            }
            callback(null, response.body);
        });
    }

    /**
     * To check skill status by keeping submitting the request
     * until the resources' status are all SUCCEEDED or heat the max retry time
     * @param {Object} smapiClient SMAPI client to make request
     * @param {string} skillId The skill id
     * @param {callback} callback { error, response }
     */
    checkSkillStatus(skillId, callback) {
        helper.pollingSkillStatus(this.smapiClient, skillId, (pollErr, pollRes) => {
            if (pollErr) {
                return callback(pollErr);
            }
            helper.handleSkillStatus(pollRes, skillId, (handleErr) => {
                if (handleErr) {
                    return callback(handleErr);
                }
                callback(null, skillId);
            });
        });
    }

    /**
     * To delete an Alexa hosted skill
     * @param {string} skillId The skill ID
     * @param {callback} callback { error, response }
     */
    deleteSkill(skillId, callback) {
        this.smapiClient.skill.deleteSkill(skillId, (err) => {
            if (err) {
                return callback(err);
            }
            callback();
        });
    }

    /**
     * To update ASK system-wide scripts and download the pre-push hook to the skill project git folder
     * @param {String} folderName the project folder name
     * @param {callback} callback { error, response }
     */
    downloadAskScripts(folderName, callback) {
        const askFolderPath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER);
        fs.ensureDirSync(askFolderPath);
        this.updateAskSystemScripts((err) => {
            if (err) {
                return callback(err);
            }
            this.updateSkillPrePushScript(folderName, (prePushErr) => callback(prePushErr || null));
        });
    }

    /**
     * To update all ASK system-wide scripts from S3
     * @param {callback} callback { error, response }
     */
    updateAskSystemScripts(callback) {
        const askFolderPath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER);
        fs.ensureDirSync(askFolderPath);
        helper.downloadAuthInfoScript((authInfoErr) => {
            if (authInfoErr) {
                return callback(authInfoErr);
            }
            helper.downloadAskPrePushScript((prePushErr) => {
                if (prePushErr) {
                    return callback(prePushErr);
                }
                helper.downloadGitCredentialHelperScript((credentialErr) => callback(credentialErr || null));
            });
        });
    }

    /**
     * To update pre-push scripts in the skill project from S3
     * @param {String} folderName the project folder name
     * @param {callback} callback { error, response }
     */
    updateSkillPrePushScript(folderName, callback) {
        const prePushUrl = DynamicConfig.s3Scripts.prePush;
        const filePath = path.join(folderName,
            CONSTANTS.HOSTED_SKILL.HIDDEN_GIT_FOLDER.NAME,
            CONSTANTS.HOSTED_SKILL.HIDDEN_GIT_FOLDER.HOOKS.NAME,
            CONSTANTS.HOSTED_SKILL.HIDDEN_GIT_FOLDER.HOOKS.PRE_PUSH);
        helper.downloadScriptFromS3(prePushUrl, filePath, (downloadErr) => callback(downloadErr || null));
    }
};
