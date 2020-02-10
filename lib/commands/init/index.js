const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const Messenger = require('@src/view/messenger');

const helper = require('./helper');

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
        return ['profile', 'debug'];
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
        helper.preInitCheck(rootPath, profile, (preCheckErr) => {
            if (preCheckErr) {
                Messenger.getInstance().error(preCheckErr);
                return cb(preCheckErr);
            }
            _collectAskResources((inputErr, userInput) => {
                if (inputErr) {
                    Messenger.getInstance().error(inputErr);
                    return cb(inputErr);
                }
                helper.previewAndWriteAskResources(rootPath, userInput, profile, (previewErr) => {
                    if (previewErr) {
                        Messenger.getInstance().error(previewErr);
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

module.exports = InitCommand;
module.exports.createCommand = new InitCommand(optionModel).createCommand();
