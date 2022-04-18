const path = require('path');
const SmapiClient = require('@src/clients/smapi-client');
const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const AuthorizationController = require('@src/controllers/authorization-controller');
const ResourcesConfig = require('@src/model/resources-config');
const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const jsonView = require('@src/view/json-view');
const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');
const CliError = require('@src/exceptions/cli-error');
const helper = require('./helper');

class RunCommand extends AbstractCommand {
    name() {
        return 'run';
    }

    description() {
        return 'Starts a local instance of your project as the skill endpoint.'
            + ' Automatically re-routes development requests and responses between the Alexa service and your local instance.';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['debug-port', 'wait-for-attach', 'watch', 'region', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        const debugPort = cmd.debugPort || CONSTANTS.RUN.DEFAULT_DEBUG_PORT;
        const skillCodeRegion = cmd.region || CONSTANTS.ALEXA.REGION.NA;
        const runRegion = cmd.region || CONSTANTS.ALEXA.REGION.NA;
        const watch = cmd.watch || false;
        let skillId, profile;

        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
            skillId = ResourcesConfig.getInstance().getSkillId(profile);
            if (!stringUtils.isNonBlankString(skillId)) {
                throw new CliError(`Failed to obtain skill-id for the given profile - ${profile}`
                    + '. Please deploy you skill project first.');
            }
        } catch (error) {
            Messenger.getInstance().error(error);
            cb(error);
        }

        this._getAccessTokenForProfile(profile, cmd.debug, (tokenErr, token) => {
            if (tokenErr) {
                Messenger.getInstance().error(tokenErr);
                return cb(tokenErr);
            }
            this._getSkillRunFlow(skillId, profile, skillCodeRegion, cmd.waitForAttach, watch, cmd.debug, debugPort, token,
                runRegion, (err, runFlowInstance) => {
                    if (err) {
                        Messenger.getInstance().error(err);
                        return cb(err);
                    }
                    Messenger.getInstance()
                        .info('\n*****Once the session is successfully started, '
                            + 'you can use `ask dialog` to make simulation requests to your local skill code*****\n');
                    if (cmd.waitForAttach) {
                        Messenger.getInstance()
                            .info(`\n*****Debugging session will wait until inspector is attached at port - ${debugPort}*****\n`);
                    }
                    runFlowInstance.execCommand();
                });
        });
    }

    _getAccessTokenForProfile(profile, debug, callback) {
        const authorizationController = new AuthorizationController({
            auth_client_type: 'LWA',
            doDebug: debug
        });
        authorizationController.tokenRefreshAndRead(profile, (tokenErr, token) => {
            if (tokenErr) {
                return callback(tokenErr);
            }
            callback(null, token);
        });
    }

    _getHostedSkillRuntime(smapiClient, skillId, callback) {
        smapiClient.skill.alexaHosted.getAlexaHostedSkillMetadata(skillId, (err, response) => {
            if (err) {
                return callback(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                return callback(error);
            }
            try {
                if (!response.body) {
                    throw new CliError('Received an empty response body from getAlexaHostedSkillMetadata');
                }
                const { runtime } = response.body.alexaHosted;
                if (!stringUtils.isNonBlankString(runtime)) {
                    throw new CliError(`Unable to determine runtime of the hosted skill - ${skillId}`);
                }
                callback(null, helper.getNormalisedRuntime(runtime));
            } catch (error) {
                return callback(error);
            }
        });
    }

    _getSkillRunFlow(skillId, profile, skillCodeRegion, waitForAttach, watch, debug, debugPort, token, runRegion, callback) {
        let skillFlowInstance;
        if (this._filterAlexaHostedSkill(profile)) {
            const smapiClient = new SmapiClient({
                profile,
                doDebug: debug
            });
            this._getHostedSkillRuntime(smapiClient, skillId, (err, runtime) => {
                if (err) {
                    return callback(err);
                }
                try {
                    skillFlowInstance = helper.getSkillFlowInstance(runtime, helper.getHostedSkillInvocationInfo(runtime),
                        waitForAttach, debugPort, token, skillId, runRegion, watch);
                } catch (error) {
                    return callback(error);
                }
                callback(null, skillFlowInstance);
            });
        } else {
            try {
                const skillCodeFolderName = helper.getSkillCodeFolderName(profile, skillCodeRegion);
                Messenger.getInstance().info(`Skill code folder name select for the run session: ${skillCodeFolderName}`);
                const userConfig = ResourcesConfig.getInstance().getSkillInfraUserConfig(profile);
                if (!userConfig) {
                    return callback(new CliError('Failed to obtain userConfig from project '
                        + `resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`));
                }
                const { runtime, handler } = userConfig;
                if (!runtime) {
                    throw new CliError(
                        `Failed to obtain runtime from userConfig in project resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`,
                    );
                }
                const normalisedRuntime = helper.getNormalisedRuntime(runtime);
                skillFlowInstance = helper.getSkillFlowInstance(normalisedRuntime,
                    helper.getNonHostedSkillInvocationInfo(normalisedRuntime, handler, skillCodeFolderName),
                    waitForAttach, debugPort, token, skillId, runRegion, watch);
            } catch (err) {
                return callback(err);
            }
            callback(null, skillFlowInstance);
        }
    }

    _filterAlexaHostedSkill(profile) {
        return (ResourcesConfig.getInstance().getSkillInfraType(profile) === CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME);
    }
}

module.exports = RunCommand;
module.exports.createCommand = new RunCommand(optionModel).createCommand();
