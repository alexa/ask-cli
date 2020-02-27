const fs = require('fs');

const SmapiClient = require('@src/clients/smapi-client');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const CONSTANTS = require('@src/utils/constants');
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
            cloneFlow.cloneProjectFromGit(projectPath, skillName, this.profile, this.doDebug);
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
                        Messenger.getInstance().info(`\nSkill schema and interactionModels for ${skillName} created at\n\t./skill-package`);
                        callback();
                    });
                } else {
                    Messenger.getInstance().info(`\nSkill schema and interactionModels for ${skillName} created at\n\t./skill-package`);
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
};
