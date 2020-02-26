const chalk = require('chalk');
const fs = require('fs-extra');
const R = require('ramda');
const path = require('path');

const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');
const responseParser = require('@src/controllers/dialog-controller/simulation-response-parser');
const SkillSimulationController = require('@src/controllers/skill-simulation-controller');

module.exports = class DialogController extends SkillSimulationController {
    /**
     * Constructor for DialogModeController.
     * @param {Object} configuration | config object includes information such as skillId, locale, profile, stage.
     */
    constructor(configuration) {
        super(configuration);
        this.newSession = true;
        this.utteranceCache = [];
    }

    /**
     * Evaluate individual utterance input by the User/replay_file.
     * @param {String} input Utterance by the user sent to Alexa.
     * @param {Object} replView Dialog command's repl view.
     * @param {Function} replCallback
     */
    evaluateUtterance(input, replView, replCallback) {
        replView.startProgressSpinner('Sending simulation request to Alexa...');

        this.startSkillSimulation(input.trim(), (startErr, startResponse) => {
            if (startErr) {
                replView.terminateProgressSpinner();
                Messenger.getInstance().error(startErr);
                replCallback();
            } else if (startResponse.statusCode >= 300) {
                replView.terminateProgressSpinner();
                Messenger.getInstance().error(R.view(R.lensPath(['body', 'error', 'message']), startResponse));
                replCallback();
            } else {
                replView.updateProgressSpinner('Waiting for the simulation response...');
                const simulationId = R.view(R.lensPath(['body', 'id']), startResponse);

                this.getSkillSimulationResult(simulationId, (getErr, getResponse) => {
                    replView.terminateProgressSpinner();
                    if (getErr) {
                        Messenger.getInstance().error(getErr);
                    } else {
                        if (responseParser.shouldEndSession(getResponse.body)) {
                            Messenger.getInstance().info('Session ended');
                            this.clearSession();
                        }
                        const captions = responseParser.getCaption(getResponse.body);
                        captions.forEach((caption) => {
                            Messenger.getInstance().info(chalk.yellow.bold('Alexa > ') + caption);
                        });
                    }
                    replCallback();
                });
            }
        });
    }

    /**
     * Registers special commands with the REPL server.
     * @param {Object} dialogReplView dialog command's repl view.
     * @param {Function} callback
     */
    setupSpecialCommands(dialogReplView, callback) {
        dialogReplView.registerRecordCommand((filePath) => {
            if (!stringUtils.isNonBlankString(filePath)) {
                return callback('A file name has not been specified');
            }
            const JSON_FILE_EXTENSION = '.json';
            if (path.extname(filePath).toLowerCase() !== JSON_FILE_EXTENSION) {
                return callback(`File should be of type '${JSON_FILE_EXTENSION}'`);
            }
            try {
                this.createReplayFile(filePath);
                Messenger.getInstance().info(`Created replay file at ${filePath}`);
            } catch (err) {
                return callback(err);
            }
        });
        dialogReplView.registerQuitCommand(() => {});
    }

    /**
     * Start skill simulation by calling SMAPI POST skill simulation endpoint.
     * @param {String} utterance text utterance to simulate against.
     * @param {Function} onSuccess callback to execute upon a successful request.
     * @param {Function} onError callback to execute upon a failed request.
     */
    startSkillSimulation(utterance, callback) {
        super.startSkillSimulation(
            utterance,
            this.newSession,
            (err, response) => {
                if (response) {
                    this.utteranceCache.push(utterance);
                }
                return callback(err, response);
            }
        );
    }

    /**
     * Poll for skill simulation results.
     * @param {String} simulationId simulation ID associated to the current simulation.
     * @param {Function} onSuccess callback to execute upon a successful request.
     * @param {Function} onError callback to execute upon a failed request.
     */
    getSkillSimulationResult(simulationId, callback) {
        super.getSkillSimulationResult(simulationId, (err, response) => {
            if (err) {
                return callback(err);
            }
            const errorMsg = responseParser.getErrorMessage(response.body);
            if (errorMsg) {
                return callback(errorMsg);
            }
            this.newSession = false;
            return callback(null, response);
        });
    }

    /**
     * Clears dialog session by resetting to a new session and clearing caches.
     */
    clearSession() {
        this.newSession = true;
        this.utteranceCache = [];
    }

    /**
     * Function to create replay file.
     * @param {String} filename name of file to save replay JSON.
     */
    createReplayFile(filename) {
        if (stringUtils.isNonBlankString(filename)) {
            const content = {
                skillId: this.skillId,
                locale: this.locale,
                type: 'text',
                userInput: this.utteranceCache
            };
            fs.outputJSONSync(filename, content);
        }
    }
};
