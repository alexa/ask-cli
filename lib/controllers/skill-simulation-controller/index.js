const R = require('ramda');
const DialogSaveSkillIoFile = require('@src/model/dialog-save-skill-io-file');
const SmapiClient = require('@src/clients/smapi-client');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const Retry = require('@src/utils/retry-utility');

module.exports = class SkillSimulationController {
    /**
     * Constructor for SkillSimulationController
     * @param {Object} configuration { profile, doDebug }
     * @throws {Error} if configuration is invalid for dialog.
     */
    constructor(configuration) {
        if (configuration === undefined) {
            throw 'Cannot have an undefined configuration.';
        }
        const { skillId, locale, stage, profile, saveSkillIo, debug, smapiClient } = configuration;
        this.profile = profile;
        this.doDebug = debug;
        this.smapiClient = smapiClient || new SmapiClient({ profile: this.profile, doDebug: this.doDebug });
        this.skillId = skillId;
        this.locale = locale;
        this.stage = stage;
        this.skillIOInstance = new DialogSaveSkillIoFile(saveSkillIo);
    }

    /**
     * Start skill simulation by calling SMAPI POST skill simulation
     * @param {String} utterance text utterance to simulate against.
     * @param {Boolean} newSession Boolean to specify to FORCE_NEW_SESSION
     * @param {Function} callback callback to execute upon a response.
     */
    startSkillSimulation(utterance, newSession, callback) {
        this.skillIOInstance.startInvocation({ utterance, newSession });
        this.smapiClient.skill.test.simulateSkill(this.skillId, this.stage, utterance, newSession, this.locale, (err, res) => {
            if (err) {
                return callback(err);
            }
            if (res.statusCode >= 300) {
                return callback(jsonView.toString(res.body));
            }
            callback(err, res);
        });
    }

    /**
     * Poll for skill simulation results.
     * @todo Implement timeout.
     * @param {String} simulationId simulation ID associated to the current simulation.
     * @param {Function} callback  function to execute upon a response.
     */
    getSkillSimulationResult(simulationId, callback) {
        const retryConfig = {
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.MAX_RETRY,
            base: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.MIN_TIME_OUT
        };
        const retryCall = (loopCallback) => {
            this.smapiClient.skill.test.getSimulation(this.skillId, simulationId, this.stage, (pollErr, pollResponse) => {
                if (pollErr) {
                    return loopCallback(pollErr);
                }
                if (pollResponse.statusCode >= 300) {
                    return loopCallback(jsonView.toString(pollResponse.body));
                }
                loopCallback(null, pollResponse);
            });
        };
        const shouldRetryCondition = (retryResponse) => {
            const status = R.view(R.lensPath(['body', 'status']), retryResponse);
            return !status || status === CONSTANTS.SKILL.SIMULATION_STATUS.IN_PROGRESS;
        };
        Retry.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => {
            if (err) {
                return callback(err);
            }
            this.skillIOInstance.endInvocation({ body: res.body });
            if (!res.body.status) {
                return callback(`Failed to get status for simulation id: ${simulationId}.`
                    + 'Please run again using --debug for more details.');
            }
            return callback(null, res);
        });
    }
};
