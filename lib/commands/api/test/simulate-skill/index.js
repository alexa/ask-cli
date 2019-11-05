const process = require('shelljs');
const fs = require('fs');
const CONSTANTS = require('@src/utils/constants');
const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const Retry = require('@src/utils/retry-utility');

class SimulateSkillCommand extends AbstractCommand {
    name() {
        return 'simulate-skill';
    }

    description() {
        return 'Simulates the specified skill. Before this command can be used, the skill must first be enabled.';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'force-new-session', 'profile', 'debug', 'file', 'text', 'quick', 'locale'];
    }

    _pollingSimulationResult(simulationId, skillId, stage, debug, callback) {
        const listenSpinner = new SpinnerView();
        listenSpinner.start('Waiting for the simulation response...');

        this._keepPollingSimulationResult(simulationId, skillId, stage, debug, (err, response) => {
            listenSpinner.terminate();
            callback(err, response);
        });
    }

    _keepPollingSimulationResult(simulationId, skillId, stage, debug, callback) {
        const retryConfig = {
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.MAX_RETRY,
            base: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.MIN_TIME_OUT
        };
        const retryCall = (loopCallback) => {
            this.smapiClient.skill.test.getSimulation(skillId, simulationId, stage, (pollErr, pollResponse) => {
                if (pollErr) {
                    return loopCallback(pollErr);
                }
                if (pollResponse.statusCode >= 300) {
                    return loopCallback(jsonView.toString(pollResponse.body));
                }
                loopCallback(null, pollResponse);
            });
        };

        const shouldRetryCondition = retryResponse => !retryResponse.status
            || retryResponse.status === CONSTANTS.SKILL.SIMULATION_STATUS.SUCCESS
            || retryResponse.status === CONSTANTS.SKILL.SIMULATION_STATUS.FAILURE;

        Retry.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => {
            if (err) {
                return callback(err);
            }
            if (!res.status) {
                return callback(`[Error]: Failed to get status for simulation id: ${simulationId}.`
                    + 'Please run again using --debug for more details.');
            }
            return callback(null, res);
        });
    }

    additionalOptionsValidations(cmd) {
        if (!cmd.file && !cmd.text) {
            throw new Error('Please input required parameter: file | text.');
        }
        if (cmd.file && cmd.text) {
            throw new Error('Both file and text parameters are specified. Please enter file | text.');
        }
        if (!cmd.locale && !process.env.ASK_DEFAULT_DEVICE_LOCALE) {
            throw new Error('Please specify device locale via command line parameter locale or environment variable - ASK_DEFAULT_DEVICE_LOCALE.');
        }
    }

    handle(cmd, cb) {
        const notWaitingExitMessage = 'Please use the ask get-simulation command to get the status of the simulation id.';
        let profile;
        try {
            this.additionalOptionsValidations(cmd);
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        const input = cmd.file ? fs.readFileSync(cmd.file, { encoding: 'utf-8' }) : cmd.text;
        const locale = cmd.locale || process.env.ASK_DEFAULT_DEVICE_LOCALE;
        smapiClient.skill.test.simulateSkill(cmd.skillId, stage, input, cmd.forceNewSession, locale, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                return cb(error);
            }
            Messenger.getInstance().info(jsonView.toString(response.body));
            if (response.body) {
                const simulationId = response.body.id;
                Messenger.getInstance().info(`Simulation created for simulation id: ${simulationId}.`);
                if (cmd.quick) {
                    Messenger.getInstance().info(notWaitingExitMessage);
                    return cb(null, notWaitingExitMessage);
                }
                this._pollingSimulationResult(simulationId, cmd.skillId, stage, cmd.debug, (pollError, pollResponse) => {
                    if (pollError) {
                        Messenger.getInstance().error(pollError);
                        return cb(pollError);
                    }
                    Messenger.getInstance().info(pollResponse);
                    return cb(null, pollResponse);
                });
            }
            return cb();
        });
    }
}

module.exports = {
    createCommand: new SimulateSkillCommand(optionModel).createCommand()
};
