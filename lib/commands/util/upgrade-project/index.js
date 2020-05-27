const GitClient = require('@src/clients/git-client');
const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

const helper = require('./helper');
const hostedSkillHelper = require('./hosted-skill-helper');

class UpgradeProjectCommand extends AbstractCommand {
    name() {
        return 'upgrade-project';
    }

    description() {
        return 'upgrade the v1 ask-cli skill project to v2 structure';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile, upgradeInfo;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            const { v1Config, isDeployed } = helper.loadV1ProjConfig(process.cwd(), profile);
            // 0.upgrade if project is un-deployed v1 template
            if (!isDeployed) {
                helper.attemptUpgradeUndeployedProject(process.cwd(), v1Config, profile);
                Messenger.getInstance().info('Template project migration finished.');
                return cb();
            }
            // 1.extract upgrade-necessary information and confirm project is upgrade-able
            upgradeInfo = helper.extractUpgradeInformation(v1Config, profile);
        } catch (checkErr) {
            Messenger.getInstance().error(checkErr);
            return cb(checkErr);
        }
        // 2.preview new project structure
        helper.previewUpgrade(upgradeInfo, (previewErr, previewConfirm) => {
            if (previewErr) {
                Messenger.getInstance().error(previewErr);
                return cb(previewErr);
            }
            if (!previewConfirm) {
                Messenger.getInstance().info('Command upgrade-project aborted.');
                return cb();
            }
            // 3.create v2 project based on the upgrade info
            if (upgradeInfo.isHosted) {
                _createV2HostedSkillProject(upgradeInfo, profile, cmd.debug, (v2Err) => {
                    if (v2Err) {
                        Messenger.getInstance().error(v2Err);
                        return cb(v2Err);
                    }
                    Messenger.getInstance().info('Project migration finished.');
                    cb();
                });
            } else {
                _createV2NonHostedSkillProject(upgradeInfo, profile, cmd.debug, (v2Err) => {
                    if (v2Err) {
                        Messenger.getInstance().error(v2Err);
                        return cb(v2Err);
                    }
                    Messenger.getInstance().info('Project migration finished.');
                    cb();
                });
            }
        });
    }
}

function _createV2HostedSkillProject(upgradeInfo, profile, doDebug, callback) {
    const rootPath = process.cwd();
    const { skillId, gitRepoUrl } = upgradeInfo;
    const verbosityOptions = {
        showCommand: !!doDebug,
        showOutput: !!doDebug
    };
    const gitClient = new GitClient(rootPath, verbosityOptions);
    try {
        hostedSkillHelper.checkIfDevBranchClean(gitClient);
        // 1.move v1 skill project content into legacy folder
        helper.moveOldProjectToLegacyFolder(rootPath);
        // 2.instantiate MVC and ask-resource config
        hostedSkillHelper.createV2ProjectSkeletonAndLoadModel(rootPath, skillId, profile);
    } catch (initProjErr) {
        return callback(initProjErr);
    }
    // 3.import skill metadata
    hostedSkillHelper.downloadSkillPackage(rootPath, skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, profile, doDebug, (packageErr) => {
        if (packageErr) {
            return callback(packageErr);
        }
        // 4.copy Lambda code to skill code and update deploy state
        try {
            hostedSkillHelper.handleExistingLambdaCode(rootPath, gitRepoUrl, profile);
        } catch (codeErr) {
            return callback(codeErr);
        }
        // 5. config git setting
        hostedSkillHelper.postUpgradeGitSetup(profile, doDebug, gitClient, (gitErr) => {
            if (gitErr) {
                return callback(gitErr);
            }
            callback();
        });
    });
}

function _createV2NonHostedSkillProject(upgradeInfo, profile, doDebug, callback) {
    const rootPath = process.cwd();
    const { skillId, lambdaResources } = upgradeInfo;
    try {
        // 1.move v1 skill project content into legacy folder
        helper.moveOldProjectToLegacyFolder(rootPath);
        // 2.instantiate MVC and ask-resource config
        helper.createV2ProjectSkeletonAndLoadModel(rootPath, skillId, profile);
    } catch (initProjErr) {
        return callback(initProjErr);
    }

    // 3.import skill metadata from skillId
    helper.downloadSkillPackage(rootPath, skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, profile, doDebug, (packageErr) => {
        if (packageErr) {
            return callback(packageErr);
        }
        // 4.copy Lambda code to skill code
        try {
            helper.handleExistingLambdaCode(rootPath, lambdaResources, profile);
            callback();
        } catch (codeErr) {
            callback(codeErr);
        }
    });
}

module.exports = UpgradeProjectCommand;
module.exports.createCommand = new UpgradeProjectCommand(optionModel).createCommand();
