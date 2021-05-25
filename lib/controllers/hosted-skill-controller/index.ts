import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import SmapiClient from '@src/clients/smapi-client';
import SkillMetadataController from '@src/controllers/skill-metadata-controller';
import * as CONSTANTS from '@src/utils/constants';
import DynamicConfig from '@src/utils/dynamic-config';
import jsonView from '@src/view/json-view';
import Messenger from '@src/view/messenger';

import cloneFlow from './clone-flow';
import helper from './helper';

export interface IHostedSkillController {
    profile: string;
    doDebug: boolean;
    smapiClient: SmapiClient;
    skillMetaController: SkillMetadataController;
};

export default class HostedSkillController {
    private profile: string;
    private doDebug: boolean;
    private smapiClient: any;
    private skillMetaController: SkillMetadataController;

    constructor(configuration: IHostedSkillController) {
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
    createSkill(hostedSkillPayload: any, callback: Function) {
        this.smapiClient.skill.alexaHosted.createHostedSkill(hostedSkillPayload, (createErr?: Error, createRes?:any) => {
            if (createErr) {
                return callback(createErr);
            }
            if (createRes.statusCode >= 300) {
                return callback(jsonView.toString(createRes.body));
            }
            const { skillId } = createRes.body;
            helper.pollingSkillStatus(this.smapiClient, skillId, (pollErr?: Error, pollRes?: any) => {
                if (pollErr) {
                    return callback(pollErr);
                }
                helper.handleSkillStatus(pollRes, skillId, (handleErr?: Error) => {
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
    clone(skillId: string, skillName: string, projectPath: string, callback: Function) {
        if (fs.existsSync(projectPath)) {
            return callback(`${projectPath} directory already exists.`);
        }
        // 0. get hosted skill info
        this.getHostedSkillMetadata(skillId, (metadataErr?: Error, metadata?: any) => {
            if (metadataErr) {
                return callback(metadataErr);
            }
            // 1. generate project
            cloneFlow.generateProject(projectPath, skillId, skillName, metadata, this.profile);
            // 2. clone project, set up git
            cloneFlow.cloneProjectFromGit(projectPath, skillId, skillName, this.profile, metadata.repository.url, this.doDebug);
            // 3. check skill-package content
            cloneFlow.doSkillPackageExist(skillName, projectPath, skillId, (checkErr?: Error, doExist?: any) => {
                if (checkErr) {
                    return callback(checkErr);
                }
                if (!doExist) {
                    this.skillMetaController.getSkillPackage(projectPath, skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (exportErr?: Error) => {
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
    getHostedSkillMetadata(skillId: string, callback: Function) {
        this.smapiClient.skill.alexaHosted.getAlexaHostedSkillMetadata(skillId, (err?: Error, response?: any) => {
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
    getHostedSkillPermission(vendorId: string, permissionType: string, callback: Function) {
        this.smapiClient.skill.alexaHosted.getHostedSkillPermission(vendorId, permissionType, (err?: Error, response?: any) => {
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
    checkSkillStatus(skillId: string, callback: Function) {
        helper.pollingSkillStatus(this.smapiClient, skillId, (pollErr?: Error, pollRes?: any) => {
            if (pollErr) {
                return callback(pollErr);
            }
            helper.handleSkillStatus(pollRes, skillId, (handleErr?: Error) => {
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
    deleteSkill(skillId: string, callback: Function) {
        this.smapiClient.skill.deleteSkill(skillId, (err?: Error) => {
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
    downloadAskScripts(folderName: string, callback: Function) {
        const askFolderPath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER);
        fs.ensureDirSync(askFolderPath);
        this.updateAskSystemScripts((err?: Error) => {
            if (err) {
                return callback(err);
            }
            this.updateSkillPrePushScript(folderName, (prePushErr: any) => callback(prePushErr || null));
        });
    }

    /**
     * To update all ASK system-wide scripts from S3
     * @param {callback} callback { error, response }
     */
    updateAskSystemScripts(callback: Function) {
        const askFolderPath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER);
        fs.ensureDirSync(askFolderPath);
        helper.downloadAuthInfoScript((authInfoErr?: Error) => {
            if (authInfoErr) {
                return callback(authInfoErr);
            }
            helper.downloadAskPrePushScript((prePushErr?: Error) => {
                if (prePushErr) {
                    return callback(prePushErr);
                }
                helper.downloadGitCredentialHelperScript((credentialErr?: Error) => callback(credentialErr || null));
            });
        });
    }

    /**
     * To update pre-push scripts in the skill project from S3
     * @param {String} folderName the project folder name
     * @param {callback} callback { error, response }
     */
    updateSkillPrePushScript(folderName: string, callback: Function) {
        const prePushUrl = DynamicConfig.s3Scripts.prePush;
        const filePath = path.join(folderName,
            CONSTANTS.HOSTED_SKILL.HIDDEN_GIT_FOLDER.NAME,
            CONSTANTS.HOSTED_SKILL.HIDDEN_GIT_FOLDER.HOOKS.NAME,
            CONSTANTS.HOSTED_SKILL.HIDDEN_GIT_FOLDER.HOOKS.PRE_PUSH);
        helper.downloadScriptFromS3(prePushUrl, filePath, (downloadErr?: Error) => callback(downloadErr || null));
    }
};
