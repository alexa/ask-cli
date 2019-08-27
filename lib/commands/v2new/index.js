const path = require('path');

const { AbstractCommand } = require('@src/commands/abstract-command');
const Manifest = require('@src/model/manifest');
const ResourcesConfig = require('@src/model/resources-config');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');

const helper = require('./helper');

class NewCommand extends AbstractCommand {
    name() {
        return 'new';
    }

    description() {
        return 'create a new skill project from Alexa skill templates';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['templateUrl', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }

        // 1.download skill project templates
        downloadSkillTemplate(cmd, (projectErr, userInput) => {
            if (projectErr) {
                Messenger.getInstance().error(projectErr);
                return cb(projectErr);
            }
            if (!userInput) {
                return cb();
            }
            try {
                // 2.load involving M(odel) component (ResourcesConfig & Manifest) from the downloaded skill project with 'default' profile
                helper.loadSkillProjectModel(userInput.projectFolderPath, 'default');
                // 3.remove git record and update skill name
                helper.updateSkillProjectWithUserSettings(userInput.skillName, userInput.projectFolderPath, profile);
            } catch (projErr) {
                Messenger.getInstance().error(projErr);
                return cb(projErr);
            }
            // 4.bootstrap the skill project with deploy delegate if needed
            initializeDeployDelegate(userInput.projectFolderPath, profile, cmd.debug, (deployDelegateErr, ddType) => {
                if (deployDelegateErr) {
                    Messenger.getInstance().error(deployDelegateErr);
                    return cb(deployDelegateErr);
                }
                Messenger.getInstance().info(ddType ? `Project initialized with deploy delegate "${ddType}" successfully.`
                    : 'Project initialized successfully.');
                ResourcesConfig.getInstance().write();
                Manifest.getInstance().write();
                cb();
            });
        });
    }
}

function downloadSkillTemplate(cmd, callback) {
    Messenger.getInstance().info('-------------- Skill Metadata & Code --------------');
    Messenger.getInstance().info('Please follow the wizard to start your Alexa skill project ->');
    if (!cmd.templateUrl) {
        helper.newWithOfficialTemplate(cmd.debug, (templateErr, userInput) => {
            if (templateErr) {
                return callback(templateErr);
            }
            if (!userInput) {
                return callback();
            }
            Messenger.getInstance().info(`Project for skill "${userInput.skillName}" is successfully created at ${userInput.projectFolderPath}\n`);
            callback(null, userInput);
        });
    } else {
        helper.newWithCustomTemplate(cmd.templateUrl, cmd.debug, (templateErr, userInput) => {
            if (templateErr) {
                return callback(templateErr);
            }
            if (!userInput) {
                return callback();
            }
            Messenger.getInstance().info(`Project for skill "${userInput.skillName}" is successfully created at ${userInput.projectFolderPath}\n`);
            callback(null, userInput);
        });
    }
}

function initializeDeployDelegate(projectFolderPath, profile, doDebug, callback) {
    Messenger.getInstance().info('-------------- Skill Infrastructure --------------');
    const infrastructurePath = path.join(projectFolderPath, 'infrastructure');
    helper.bootstrapProject(infrastructurePath, profile, doDebug, (bootstrapErr) => {
        if (bootstrapErr) {
            return callback(bootstrapErr);
        }
        const ddType = ResourcesConfig.getInstance().getSkillInfraType(profile);
        callback(undefined, ddType);
    });
}

module.exports = NewCommand;
module.exports.createCommand = new NewCommand(optionModel).createCommand();
