const path = require('path');

const SmapiClient = require('@src/clients/smapi-client');
const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const CliError = require('@src/exceptions/cli-error');
const DialogReplayFile = require('@src/model/dialog-replay-file');
const ResourcesConfig = require('@src/model/resources-config');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');
const stringUtils = require('@src/utils/string-utils');

const InteractiveMode = require('./interactive-mode');
const ReplayMode = require('./replay-mode');

const helper = require('./helper');

class DialogCommand extends AbstractCommand {
    name() {
        return 'dialog';
    }

    description() {
        return 'simulate your skill via an interactive dialog with Alexa';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['skill-id', 'locale', 'stage', 'replay', 'save-skill-io', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let dialogMode;
        this._getDialogConfig(cmd, (err, config) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            dialogMode = this._dialogModeFactory(config);
            const spinner = new SpinnerView();
            spinner.start('Checking if skill is ready to simulate...');
            helper.validateDialogArgs(dialogMode, (dialogArgsValidationError) => {
                if (dialogArgsValidationError) {
                    spinner.terminate(SpinnerView.TERMINATE_STYLE.FAIL, 'Failed to validate command options');
                    Messenger.getInstance().error(dialogArgsValidationError);
                    return cb(dialogArgsValidationError);
                }
                spinner.terminate();
                dialogMode.start((controllerError) => {
                    if (controllerError) {
                        Messenger.getInstance().error(controllerError);
                        return cb(controllerError);
                    }
                    cb();
                });
            });
        });
    }

    /**
     * Function processes dialog arguments and returns a consolidated object.
     * @param {Object} cmd encapsulates arguments provided to the dialog command.
     * @return { skillId, locale, stage, profile, debug, replayFile, smapiClient, userInputs <for replay mode> }
     */
    _getDialogConfig(cmd, callback) {
        const debug = Boolean(cmd.debug);
        let { skillId, locale, stage, profile } = cmd;
        const { saveSkillIo } = cmd;
        profile = profileHelper.runtimeProfile(profile);
        stage = stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        let firstLocaleFromManifest;
        let userInputs;
        const smapiClient = new SmapiClient({ profile, doDebug: debug });
        if (cmd.replay) {
            const dialogReplayConfig = new DialogReplayFile(cmd.replay);
            skillId = dialogReplayConfig.getSkillId();
            if (!stringUtils.isNonBlankString(skillId)) {
                return process.nextTick(callback(new CliError('Replay file must contain skillId')));
            }
            locale = dialogReplayConfig.getLocale();
            if (!stringUtils.isNonBlankString(locale)) {
                return process.nextTick(callback(new CliError('Replay file must contain locale')));
            }
            try {
                userInputs = this._validateUserInputs(dialogReplayConfig.getUserInput());
            } catch (err) {
                return callback(err);
            }
        } else {
            if (!stringUtils.isNonBlankString(skillId)) {
                try {
                    new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
                    skillId = ResourcesConfig.getInstance().getSkillId(profile);
                } catch (err) {
                    return process.nextTick(callback(new CliError('Failed to read project resource file. '
                    + 'Please run the command within a ask-cli project.')));
                }
                if (!stringUtils.isNonBlankString(skillId)) {
                    return process.nextTick(callback(new CliError('Failed to obtain skill-id from project '
                    + `resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`)));
                }
            }
        }
        smapiClient.skill.manifest.getManifest(skillId, stage, (err, res) => {
            if (err) {
                return callback(err);
            }
            if (res.statusCode >= 300) {
                const error = jsonView.toString(res.body);
                return callback(error);
            }
            [firstLocaleFromManifest] = Object.keys(res.body.manifest.publishingInformation.locales);
            if (!locale && !process.env.ASK_DEFAULT_DEVICE_LOCALE && firstLocaleFromManifest) {
                Messenger.getInstance().info(`Defaulting locale to the first value from the skill manifest: ${firstLocaleFromManifest}`);
            }
            locale = locale || process.env.ASK_DEFAULT_DEVICE_LOCALE || firstLocaleFromManifest;
            callback(null, { skillId, locale, stage, profile, debug, replay: cmd.replay, saveSkillIo, smapiClient, userInputs });
        });
    }

    _dialogModeFactory(config) {
        if (config.replay) {
            return new ReplayMode(config);
        }
        return new InteractiveMode(config);
    }

    _validateUserInputs(userInputs) {
        const validatedInputs = [];
        userInputs.forEach((input) => {
            const trimmedInput = input.trim();
            if (!stringUtils.isNonBlankString(trimmedInput)) {
                throw new CliError("Replay file's userInput cannot contain empty string.");
            }
            validatedInputs.push(trimmedInput);
        });
        return validatedInputs;
    }
}

module.exports = DialogCommand;
module.exports.createCommand = new DialogCommand(optionModel).createCommand();
