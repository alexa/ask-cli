const path = require('path');

const { AbstractCommand } = require('@src/commands/abstract-command');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');
const helper = require('./helper');

class DeployCommand extends AbstractCommand {
    name() {
        return 'deploy';
    }

    description() {
        return 'deploy the skill project';
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
            // initiate ResourcesConfig model
            new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
            // initiate Manifest model
            const skillPackageSrc = ResourcesConfig.getInstance().getSkillMetaSrc(profile);
            if (!stringUtils.isNonBlankString(skillPackageSrc)) {
                throw new Error('Skill package src is not found in ask-resources.json.');
            }
            const manifestPath = path.join(skillPackageSrc, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST);
            new Manifest(manifestPath);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }

        deployResources(profile, cmd.debug, (deployErr) => {
            // Write updates back to resources file
            if (deployErr) {
                Messenger.getInstance().error(deployErr);
                return cb(deployErr);
            }

            ResourcesConfig.getInstance().write();
            Manifest.getInstance().write();

            // Post deploy logic
            // call smapiClient to enable skill
            helper.enableSkill(profile, cmd.debug, (enableError) => {
                if (enableError) {
                    Messenger.getInstance().error(enableError);
                    return cb(enableError);
                }
                cb();
            });
        });
    }
}

/**
 * The deploy function used to deploy all skill related resources
 * This steps includes the deploy of skillMeta, skillCode and skillInfra using the deployDelegate plugin
 * @param {String} profile The profile name
 * @param {Boolean} doDebug The flag of debug or not
 * @param {Function} callback
 */
function deployResources(profile, doDebug, callback) {
    // Skill Metadata
    Messenger.getInstance().info('==================== Deploy Skill Metadata ====================');
    const skillMetaSpinner = new SpinnerView();
    skillMetaSpinner.start('Uploading the entire skill package (it may take few minutes to build the skill metadata)...');
    helper.deploySkillMetadata(profile, doDebug, (metaErr) => {
        skillMetaSpinner.terminate();
        if (metaErr && metaErr !== 'The hash of current skill package folder does not change compared to the last deploy hash result, '
            + 'CLI will skip the deploy of skill package.') {
            return callback(metaErr);
        }
        if (metaErr) {
            // this case is the warning message of the same hash skip, deploy will continue
            Messenger.getInstance().warn(metaErr);
        } else {
            ResourcesConfig.getInstance().write();
            Messenger.getInstance().info('Skill package deployed successfully.');
        }
        Messenger.getInstance().info(`Skill ID: ${ResourcesConfig.getInstance().getSkillId(profile)}`);

        // Skill Code
        Messenger.getInstance().info('\n==================== Build Skill Code ====================');
        helper.buildSkillCode(profile, doDebug, (buildErr, uniqueCodeList) => {
            if (buildErr) {
                return callback(buildErr);
            }
            Messenger.getInstance().info('Skill code built successfully.');
            uniqueCodeList.forEach((codeProperty) => {
                const buildFilePath = codeProperty.build.file;
                Messenger.getInstance().info(`Code for region ${codeProperty.regionsList.join('+')} built to ${buildFilePath} successfully \
with build flow ${codeProperty.buildFlow}.`);
            });

            // Skill Infrastructure
            const infraType = ResourcesConfig.getInstance().getSkillInfraType(profile);
            if (!stringUtils.isNonBlankString(infraType)) {
                return callback();
            }
            Messenger.getInstance().info('\n==================== Deploy Skill Infrastructure ====================');
            helper.deploySkillInfrastructure(profile, doDebug, (infraErr) => {
                if (infraErr) {
                    return callback(infraErr);
                }
                Messenger.getInstance().info(`Skill infrastructures deployed successfully through ${infraType}.`);
                callback();
            });
        });
    });
}

module.exports = DeployCommand;
module.exports.createCommand = new DeployCommand(optionModel).createCommand();
