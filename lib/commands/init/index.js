const path = require('path');
const R = require('ramda');

const SmapiClient = require('@src/clients/smapi-client');
const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const HostedSkillController = require('@src/controllers/hosted-skill-controller');
const CliWarn = require('@src/exceptions/cli-warn');
const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');

const helper = require('./helper');
const ui = require('./ui');

class InitCommand extends AbstractCommand {
    name() {
        return 'init';
    }

    description() {
        return 'setup a new or existing Alexa skill project';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['hosted-skill-id', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }

        const rootPath = process.cwd();
        if (!cmd.hostedSkillId) {
            initNonHostedSkill(rootPath, cmd, profile, (nhsErr) => {
                cb(nhsErr);
            });
        } else {
            initAlexaHostedSkill(rootPath, cmd, profile, (ahsErr) => {
                cb(ahsErr);
            });
        }
    }
}

function initAlexaHostedSkill(rootPath, cmd, profile, cb) {
    const smapiClient = new SmapiClient({ profile, doDebug: cmd.debug });
    const hostedSkillController = new HostedSkillController({ profile, doDebug: cmd.debug });
    _getSkillName(smapiClient, cmd.hostedSkillId, (nameErr, skillName) => {
        if (nameErr) {
            Messenger.getInstance().error(nameErr);
            return cb(nameErr);
        }
        _confirmProjectFolderName(skillName, (confirmErr, folderName) => {
            if (confirmErr) {
                Messenger.getInstance().error(confirmErr);
                return cb(confirmErr);
            }
            const projectPath = path.join(rootPath, folderName);
            hostedSkillController.clone(cmd.hostedSkillId, skillName, projectPath, (cloneErr) => {
                if (cloneErr) {
                    Messenger.getInstance().error(cloneErr);
                    return cb(cloneErr);
                }
                const templateUrl = CONSTANTS.HOSTED_SKILL.GIT_HOOKS_TEMPLATES.PRE_PUSH.URL;
                const filePath = path.join(folderName, '.git', 'hooks', 'pre-push');
                hostedSkillController.downloadGitHooksTemplate(templateUrl, filePath, (hooksErr) => {
                    if (hooksErr) {
                        Messenger.getInstance().error(hooksErr);
                        return cb(hooksErr);
                    }
                    Messenger.getInstance().info(`\n${skillName} successfully initialized.\n`);
                    cb();
                });
            });
        });
    });
}

function initNonHostedSkill(rootPath, cmd, profile, cb) {
    helper.preInitCheck(rootPath, profile, (preCheckErr) => {
        if (preCheckErr) {
            if (preCheckErr instanceof CliWarn) {
                Messenger.getInstance().warn(preCheckErr.message);
            } else {
                Messenger.getInstance().error(preCheckErr);
            }
            return cb(preCheckErr);
        }
        _collectAskResources((inputErr, userInput) => {
            if (inputErr) {
                Messenger.getInstance().error(inputErr);
                return cb(inputErr);
            }
            helper.previewAndWriteAskResources(rootPath, userInput, profile, (previewErr) => {
                if (previewErr) {
                    if (previewErr instanceof CliWarn) {
                        Messenger.getInstance().warn(previewErr.message);
                    } else {
                        Messenger.getInstance().error(previewErr);
                    }
                    return cb(previewErr);
                }
                helper.bootstrapSkillInfra(rootPath, profile, cmd.debug, (postErr) => {
                    if (postErr) {
                        Messenger.getInstance().error(postErr);
                        return cb(postErr);
                    }
                    Messenger.getInstance().info('\nSuccess! Run "ask deploy" to deploy your skill.');
                    cb();
                });
            });
        });
    });
}

/**
 * List of QAs to collect users' ask-resources configurations
 * @param {Function} callback (err, userInput)
 *                   userInput { skillId, skillMeta, skillCode, skillInfra } each resource object has the same structure as ask-resources config
 */
function _collectAskResources(callback) {
    helper.getSkillIdUserInput((skillIdErr, skillId) => {
        if (skillIdErr) {
            return callback(skillIdErr);
        }
        helper.getSkillMetadataUserInput((metaErr, skillMeta) => {
            if (metaErr) {
                return callback(metaErr);
            }
            helper.getSkillCodeUserInput((codeErr, skillCode) => {
                if (codeErr) {
                    return callback(codeErr);
                }
                if (!skillCode) {
                    // return to skip skillInfra setting if skill code is not provided
                    return callback(null, { skillId, skillMeta });
                }
                helper.getSkillInfraUserInput((infraErr, skillInfra) => {
                    if (infraErr) {
                        return callback(infraErr);
                    }
                    callback(null, { skillId, skillMeta, skillCode, skillInfra });
                });
            });
        });
    });
}

/**
 * To get skill name by calling skill's getManifest api
 * @param {Object} smapiClient SMAPI client to make request
 * @param {string} skillId The skill ID
 * @param {callback} callback { error, response }
 */
function _getSkillName(smapiClient, skillId, callback) {
    _getSkillManifest(smapiClient, skillId, (manifestErr, manifest) => {
        if (manifestErr) {
            return callback(manifestErr);
        }
        const locales = R.view(R.lensPath(['manifest', 'publishingInformation', 'locales']), manifest);
        if (!locales) {
            return callback('No skill name found.');
        }
        const name = locales['en-US'] ? locales['en-US'].name : Object.keys(locales)[0].name;
        callback(null, name);
    });
}

/**
 * To call getManifest api and return skill manifest
 * @param {Object} smapiClient SMAPI client to make request
 * @param {string} skillId The skill ID
 * @param {callback} callback { error, response }
 */
function _getSkillManifest(smapiClient, skillId, callback) {
    smapiClient.skill.manifest.getManifest(skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, res) => {
        if (err) {
            return callback(err);
        }
        if (res.statusCode >= 300) {
            const error = jsonView.toString(res.body);
            return callback(error);
        }
        callback(null, res.body);
    });
}

/**
 * To confirm the project folder name with users,
 * the default folder name is generated from the skillName
 * @param {string} skillName The skill name
 * @param {string} callback callback { error, response }
 */
function _confirmProjectFolderName(skillName, callback) {
    const suggestedProjectName = stringUtils.filterNonAlphanumeric(skillName);
    ui.getProjectFolderName(suggestedProjectName, (getFolderNameErr, folderName) => {
        if (getFolderNameErr) {
            return callback(getFolderNameErr);
        }
        callback(null, folderName);
    });
}

module.exports = InitCommand;
module.exports.createCommand = new InitCommand(optionModel).createCommand();
