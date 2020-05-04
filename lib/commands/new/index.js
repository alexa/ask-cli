const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const HostedSkillController = require('@src/controllers/hosted-skill-controller');
const Manifest = require('@src/model/manifest');
const ResourcesConfig = require('@src/model/resources-config');
const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const Messenger = require('@src/view/messenger');

const helper = require('./helper');
const hostedHelper = require('./hosted-skill-helper');
const wizardHelper = require('./wizard-helper');

const GIT_USAGE_HOSTED_SKILL_DOCUMENTATION = 'https://developer.amazon.com/en-US/docs/alexa/'
    + 'hosted-skills/build-a-skill-end-to-end-using-an-alexa-hosted-skill.html#askcli';

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
        return ['templateUrl', 'templateBranch', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile, vendorId;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            vendorId = profileHelper.resolveVendorId(profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        // 0. collect user input and then create a skill(hosted skill or non hosted skill)
        Messenger.getInstance().info('Please follow the wizard to start your Alexa skill project ->');
        wizardHelper.collectUserCreationProjectInfo(cmd, (initErr, userInput) => {
            if (initErr) {
                Messenger.getInstance().error(initErr);
                return cb(initErr);
            }
            if (!userInput) {
                return cb();
            }
            if (userInput.deploymentType === CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME) {
                createHostedSkill(cmd, profile, vendorId, userInput, (hostedErr) => {
                    if (hostedErr) {
                        Messenger.getInstance().error(hostedErr);
                        return cb(hostedErr);
                    }
                    cb();
                });
            } else {
                createNonHostedSkill(cmd, profile, cmd.debug, userInput, (nonHostedErr) => {
                    if (nonHostedErr) {
                        Messenger.getInstance().error(nonHostedErr);
                        return cb(nonHostedErr);
                    }
                    cb();
                });
            }
        });
    }
}

function createHostedSkill(cmd, profile, vendorId, userInput, callback) {
    const hostedSkillController = new HostedSkillController({ profile, doDebug: cmd.debug });
    hostedHelper.validateUserQualification(vendorId, hostedSkillController, (validateErr) => {
        if (validateErr) {
            return callback(validateErr);
        }
        hostedHelper.createHostedSkill(hostedSkillController, userInput, vendorId, (createErr, skillId) => {
            if (createErr) {
                return callback(createErr);
            }
            Messenger.getInstance().info(`Hosted skill provisioning finished. Skill-Id: ${skillId}`);
            Messenger.getInstance().info(`Please follow the instructions at ${GIT_USAGE_HOSTED_SKILL_DOCUMENTATION}`
                + ' to learn more about the usage of "git" for Hosted skill.');
            ResourcesConfig.getInstance().write();
            callback();
        });
    });
}

function createNonHostedSkill(cmd, profile, doDebug, userInput, callback) {
    // 1.download skill project templates
    helper.downloadTemplateFromGit(userInput, doDebug, (projectErr, projectFolderPath) => {
        if (projectErr) {
            return callback(projectErr);
        }
        Messenger.getInstance().info(`Project for skill "${userInput.skillName}" is successfully created at ${projectFolderPath}\n`);
        try {
            // 2.load involving M(Model) component (ResourcesConfig & Manifest) from the downloaded skill project with 'default' profile
            helper.loadSkillProjectModel(projectFolderPath, 'default');
            // 3.remove git record and update skill name
            helper.updateSkillProjectWithUserSettings(userInput.skillName, projectFolderPath, profile);
        } catch (projErr) {
            return callback(projErr);
        }
        // 4.bootstrap the skill project with deploy delegate if needed
        helper.initializeDeployDelegate(userInput.deploymentType, projectFolderPath, profile, cmd.debug, (deployDelegateErr, deployerType) => {
            if (deployDelegateErr) {
                return callback(deployDelegateErr);
            }
            Messenger.getInstance().info(deployerType ? `Project initialized with deploy delegate "${deployerType}" successfully.`
                : 'Project initialized successfully.');
            ResourcesConfig.getInstance().write();
            Manifest.getInstance().write();
            callback();
        });
    });
}

module.exports = NewCommand;
module.exports.createCommand = new NewCommand(optionModel).createCommand();
