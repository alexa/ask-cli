import fs from "fs-extra";
import jsonfile from "jsonfile";
import os from "os";
import path from "path";
import {AbstractCommand} from "../abstract-command";
import optionModel from "../option-model.json";
import AppConfig from "../../model/app-config";
import CONSTANTS from "../../utils/constants";
import stringUtils from "../../utils/string-utils";
import Messenger from "../../view/messenger";
import helper from "./helper";
import messages from "./messages";
import ui from "./ui";
import {OptionModel} from "../option-validator";

export default class ConfigureCommand extends AbstractCommand {
  name() {
    return "configure";
  }

  description() {
    return "helps to configure the credentials that ask-cli uses to authenticate the user to Amazon developer services";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["no-browser", "profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    Messenger.getInstance().info(messages.ASK_CLI_CONFIGURATION_MESSAGE);
    try {
      const askProfileConfig = _ensureAppConfigInitiated(cmd);
      const askProfile = await _initiateAskProfileSetup(askProfileConfig);

      const appConfig = AppConfig.getInstance();
      Messenger.getInstance().info(messages.CONFIGURE_SETUP_SUCCESS_MESSAGE);
      Messenger.getInstance().info(`ASK Profile: ${askProfile}`);
      Messenger.getInstance().info(`AWS Profile: ${appConfig.getAwsProfile(askProfile)}`);
      Messenger.getInstance().info(`Vendor ID: ${appConfig.getVendorId(askProfile)}`);
      AppConfig.dispose();
    } catch (error) {
      Messenger.getInstance().error(error);
      throw error;
    }
  }
}

/**
 * Initiates ASK profile setup.
 * @param {Object} askProfileConfig
 * @param {Function} callback
 * @private
 */
async function _initiateAskProfileSetup(askProfileConfig: Record<string, any>): Promise<string> {
  if (askProfileConfig.isFirstTimeProfileCreation || askProfileConfig.askProfile) {
    const profile = (askProfileConfig.askProfile || CONSTANTS.ASK_DEFAULT_PROFILE_NAME).trim();
    if (!stringUtils.validateSyntax("PROFILE_NAME", profile)) {
      throw messages.PROFILE_NAME_VALIDATION_ERROR;
    }
    return new Promise((resolve, reject) => {
      helper.initiateAskProfileSetup({...askProfileConfig, askProfile: profile}, (err: any, askProfile: string) => {
        if (err) {
          return reject(err);
        }
        resolve(askProfile);
      });
    });
  }
  return new Promise((resolve, reject) => {
    ui.createOrUpdateProfile(AppConfig.getInstance().getProfilesList(), (error: any, profile: string) => {
      if (error) {
        return reject(error);
      }
      helper.initiateAskProfileSetup({...askProfileConfig, askProfile: profile}, (err: any, askProfile: string) => {
        if (err) {
          return reject(err);
        }
        resolve(askProfile);
      });
    });
  });
}

/**
 * Ensures AppConfig is initiated properly before proceeding to further steps.
 * @param {Object} cmd commander object.
 * @private
 */
function _ensureAppConfigInitiated(cmd: Record<string, any>) {
  const askFolderPath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER);
  const configFilePath = path.join(askFolderPath, CONSTANTS.FILE_PATH.ASK.PROFILE_FILE);
  if (!fs.existsSync(configFilePath)) {
    fs.ensureDirSync(askFolderPath);
    jsonfile.writeFileSync(
      configFilePath,
      {profiles: {}},
      {spaces: CONSTANTS.CONFIGURATION.JSON_DISPLAY_INDENT, mode: CONSTANTS.FILE_PERMISSION.USER_READ_WRITE},
    );
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
function _buildAskConfig(cmd: Record<string, any>, askFolderPath: string, configFilePath: string) {
  return {
    askFolderPath,
    configFilePath,
    isFirstTimeProfileCreation: AppConfig.getInstance().getProfilesList().length < 1,
    askProfile: cmd.profile,
    needBrowser: cmd.browser,
    doDebug: cmd.debug,
  };
}

export const createCommand = new ConfigureCommand(optionModel as OptionModel).createCommand();
