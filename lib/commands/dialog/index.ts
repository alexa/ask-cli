import * as path from "path";

import {isSmapiError, SmapiClientLateBound} from "../../clients/smapi-client";
import {AbstractCommand} from "../../commands/abstract-command";
import * as optionModel from "../../commands/option-model.json";
import CliError from "../../exceptions/cli-error";
import DialogReplayFile from "../../model/dialog-replay-file";
import ResourcesConfig from "../../model/resources-config";
import * as jsonView from "../../view/json-view";
import * as CONSTANTS from "../../utils/constants";
import * as profileHelper from "../../utils/profile-helper";
import Messenger from "../../view/messenger";
import SpinnerView from "../../view/spinner-view";
import * as stringUtils from "../../utils/string-utils";

import {InteractiveMode} from "./interactive-mode";
import {ReplayMode} from "./replay-mode";
import {validateDialogArgs} from "./helper";
import {OptionModel} from "../option-validator";

export class DialogCommand extends AbstractCommand {
  private messenger: Messenger;
  constructor(private smapiClient: SmapiClientLateBound, optionModel: OptionModel) {
    super(optionModel);
    this.messenger = Messenger.getInstance();
  }

  name() {
    return "dialog";
  }

  description() {
    return "simulate your skill via an interactive dialog with Alexa";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["skill-id", "locale", "stage", "replay", "save-skill-io", "profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    try {
      const dialogMode = await this._dialogModeFactory(cmd);
      const spinner = new SpinnerView();
      spinner.start("Checking if skill is ready to simulate...");

      try {
        await validateDialogArgs(dialogMode);
      } catch (err) {
        spinner.terminate(SpinnerView.TERMINATE_STYLE.FAIL, "Failed to validate command options");
        throw err;
      }

      spinner.terminate();
      await dialogMode.start();
    } catch (err) {
      this.messenger.error(err);
      throw err;
    }
  }

  /**
   * Function processes dialog arguments and returns a consolidated object.
   * @param {Object} cmd encapsulates arguments provided to the dialog command.
   * @return { skillId, locale, stage, profile, debug, replayFile, smapiClient, userInputs <for replay mode> }
   */
  async _getDialogConfig(cmd: Record<string, any>) {
    const {skillId: cmdSkillId, locale: cmdLocale, stage: cmdStage, profile: cmdProfile} = cmd;
    const {saveSkillIo, debug} = cmd;
    const profile = profileHelper.runtimeProfile(cmdProfile);
    const stage = cmdStage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
    const smapiClient = this.smapiClient.withConfiguration({
      profile,
      doDebug: !!cmd.debug,
    });

    const {skillId = cmdSkillId, locale = cmdLocale, userInputs} = this._resolvedArguments(cmd, profile);

    const manifestResult = await smapiClient.skill.manifest.getManifest(skillId, stage);
    if (isSmapiError(manifestResult)) {
      throw new Error(jsonView.toString(manifestResult.body));
    }
    const [firstLocaleFromManifest] = Object.keys(manifestResult.body.manifest?.publishingInformation?.locales || {});
    if (!locale && !process.env.ASK_DEFAULT_DEVICE_LOCALE && firstLocaleFromManifest) {
      this.messenger.info(`Defaulting locale to the first value from the skill manifest: ${firstLocaleFromManifest}`);
    }
    return {
      skillId,
      locale: locale || process.env.ASK_DEFAULT_DEVICE_LOCALE || firstLocaleFromManifest,
      stage,
      profile,
      debug,
      replay: cmd.replay,
      saveSkillIo,
      smapiClient,
      userInputs,
    };
  }

  _resolvedArguments(cmd: Record<string, any>, profile: string): {skillId?: string; locale?: string; userInputs?: string[]} {
    const {skillId: cmdSkillId} = cmd;
    if (cmd.replay) {
      const dialogReplayConfig = new DialogReplayFile(cmd.replay);
      const skillId = dialogReplayConfig.getSkillId();
      if (!stringUtils.isNonBlankString(skillId)) {
        throw new CliError("Replay file must contain skillId");
      }
      const locale = dialogReplayConfig.getLocale();
      if (!stringUtils.isNonBlankString(locale)) {
        throw new CliError("Replay file must contain locale");
      }

      return {userInputs: this._validateUserInputs(dialogReplayConfig.getUserInput()), skillId, locale};
    } else if (!stringUtils.isNonBlankString(cmdSkillId)) {
      const skillId = this._getSkillIdFromProfile(profile);

      return {skillId};
    }

    return {};
  }

  _getSkillIdFromProfile(profile: string) {
    let skillId;
    try {
      new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
      skillId = ResourcesConfig.getInstance().getSkillId(profile);
    } catch (err) {
      throw new CliError("Failed to read project resource file. " + "Please run the command within a ask-cli project.");
    }

    if (!stringUtils.isNonBlankString(skillId)) {
      const askStatesFilePath = path.join(process.cwd(), CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, CONSTANTS.FILE_PATH.ASK_STATES_JSON_CONFIG);
      throw new CliError(`Failed to obtain skill-id from project file ${askStatesFilePath}`);
    }

    return skillId;
  }

  async _dialogModeFactory(cmd: any): Promise<ReplayMode | InteractiveMode> {
    const config = await this._getDialogConfig(cmd);
    if (config.replay) {
      return new ReplayMode(config);
    } else {
      return new InteractiveMode(config);
    }
  }

  _validateUserInputs(userInputs: string[]) {
    return userInputs.map((input) => {
      const trimmedInput = input.trim();
      if (!stringUtils.isNonBlankString(trimmedInput)) {
        throw new CliError("Replay file's userInput cannot contain empty string.");
      }
      return trimmedInput;
    });
  }
}

export const createCommand = new DialogCommand(new SmapiClientLateBound(), optionModel as OptionModel).createCommand();
