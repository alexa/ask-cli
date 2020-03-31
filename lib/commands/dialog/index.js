const path = require('path');

const SmapiClient = require('@src/clients/smapi-client');
const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const CliError = require('@src/exceptions/cli-error');
const DialogReplayFile = require('@src/model/dialog-replay-file');
const ResourcesConfig = require('@src/model/resources-config');
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
        return ['skill-id', 'locale', 'stage', 'replay', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let dialogMode;
        try {
            dialogMode = this._dialogModeFactory(this._getDialogConfig(cmd));
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }

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
    }

    /**
     * Function processes dialog arguments and returns a consolidated object.
     * @param {Object} cmd encapsulates arguments provided to the dialog command.
     * @return { skillId, locale, stage, profile, debug, replayFile, smapiClient, userInputs <for replay mode> }
     */
    _getDialogConfig(cmd) {
        const debug = Boolean(cmd.debug);
        let { skillId, locale, stage, profile } = cmd;
        profile = profileHelper.runtimeProfile(profile);
        stage = stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        let userInputs;
        if (cmd.replay) {
            const dialogReplayConfig = new DialogReplayFile(cmd.replay);
            skillId = dialogReplayConfig.getSkillId();
            if (!stringUtils.isNonBlankString(skillId)) {
                throw 'Replay file must contain skillId';
            }
            locale = dialogReplayConfig.getLocale();
            if (!stringUtils.isNonBlankString(locale)) {
                throw 'Replay file must contain locale';
            }
            userInputs = this._validateUserInputs(dialogReplayConfig.getUserInput());
        } else {
            if (!stringUtils.isNonBlankString(skillId)) {
                try {
                    new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
                    skillId = ResourcesConfig.getInstance().getSkillId(profile);
                } catch (err) {
                    throw new CliError('Failed to read project resource file. Please run the command within a ask-cli project.');
                }
                if (!stringUtils.isNonBlankString(skillId)) {
                    throw `Failed to obtain skill-id from project resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`;
                }
            }
            locale = locale || process.env.ASK_DEFAULT_DEVICE_LOCALE;
            if (!stringUtils.isNonBlankString(locale)) {
                throw 'Locale has not been specified.';
            }
        }
        const smapiClient = new SmapiClient({ profile, doDebug: debug });
        return { skillId, locale, stage, profile, debug, replay: cmd.replay, smapiClient, userInputs };
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
                throw "Replay file's userInput cannot contain empty string.";
            }
            validatedInputs.push(trimmedInput);
        });
        return validatedInputs;
    }
}

module.exports = DialogCommand;
module.exports.createCommand = new DialogCommand(optionModel).createCommand();
