const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const os = require('os');
const path = require('path');

const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const AppConfig = require('@src/model/app-config');
const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');

const helper = require('./helper');
const messages = require('./messages');
const ui = require('./ui');

class ConfigureCommand extends AbstractCommand {
    name() {
        return 'configure';
    }

    description() {
        return 'helps to configure the credentials that ask-cli uses to authenticate the user to Amazon developer services';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['no-browser', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        Messenger.getInstance().info(messages.ASK_CLI_CONFIGURATION_MESSAGE);
        let askProfileConfig;
        try {
            askProfileConfig = _ensureAppConfigInitiated(cmd);
        } catch (appConfigError) {
            Messenger.getInstance().error(appConfigError);
            return cb(appConfigError);
        }

        _initiateAskProfileSetup(askProfileConfig, (setupError, askProfile) => {
            if (setupError) {
                Messenger.getInstance().error(setupError);
                return cb(setupError);
            }
            const appConfig = AppConfig.getInstance();
            Messenger.getInstance().info(messages.CONFIGURE_SETUP_SUCCESS_MESSAGE);
            Messenger.getInstance().info(`ASK Profile: ${askProfile}`);
            Messenger.getInstance().info(`AWS Profile: ${appConfig.getAwsProfile(askProfile)}`);
            Messenger.getInstance().info(`Vendor ID: ${appConfig.getVendorId(askProfile)}`);
            AppConfig.dispose();
            cb();
        });
    }
}

/**
 * Initiates ASK profile setup.
 * @param {Object} askProfileConfig
 * @param {Function} callback
 * @private
 */
function _initiateAskProfileSetup(askProfileConfig, callback) {
    if (askProfileConfig.isFirstTimeProfileCreation || askProfileConfig.askProfile) {
        const profile = (askProfileConfig.askProfile || CONSTANTS.ASK_DEFAULT_PROFILE_NAME).trim();
        if (!stringUtils.validateSyntax('PROFILE_NAME', profile)) {
            return callback(messages.PROFILE_NAME_VALIDATION_ERROR);
        }
        askProfileConfig.askProfile = profile;
        return helper.initiateAskProfileSetup(askProfileConfig, (err, askProfile) => callback(err, askProfile));
    }
    ui.createOrUpdateProfile(AppConfig.getInstance().getProfilesList(), (error, profile) => {
        if (error) {
            return callback(error);
        }
        askProfileConfig.askProfile = profile;
        helper.initiateAskProfileSetup(askProfileConfig, (err, askProfile) => callback(err, askProfile));
    });
}

/**
 * Ensures AppConfig is initiated properly before proceeding to further steps.
 * @param {Object} cmd commander object.
 * @private
 */
function _ensureAppConfigInitiated(cmd) {
    const askFolderPath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER);
    const configFilePath = path.join(askFolderPath, CONSTANTS.FILE_PATH.ASK.PROFILE_FILE);
    if (!fs.existsSync(configFilePath)) {
        fs.ensureDirSync(askFolderPath);
        jsonfile.writeFileSync(configFilePath, { profiles: {} }, { spaces: CONSTANTS.CONFIGURATION.JSON_DISPLAY_INDENT,
            mode: CONSTANTS.FILE_PERMISSION.USER_READ_WRITE });
    }
    new AppConfig(configFilePath);
    return _buildAskConfig(cmd, askFolderPath, configFilePath);
}

/**
 * Build configuration from input CLI arguments.
 * @param {Object} cmd commander object.
 * @param {String} askFolderPath ask folder path.
 * @param {String} configFilePath cli_config file path.
 * @private
 */
function _buildAskConfig(cmd, askFolderPath, configFilePath) {
    return {
        askFolderPath,
        configFilePath,
        isFirstTimeProfileCreation: AppConfig.getInstance().getProfilesList().length < 1,
        askProfile: cmd.profile,
        needBrowser: cmd.browser,
        doDebug: cmd.debug
    };
}

module.exports = ConfigureCommand;
module.exports.createCommand = new ConfigureCommand(optionModel).createCommand();
