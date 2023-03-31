import R from "ramda";
import {AbstractCommand} from "../../abstract-command";
import optionModel from "../../option-model.json";
import CONSTANTS from "../../../utils/constants";
import profileHelper from "../../../utils/profile-helper";
import Messenger from "../../../view/messenger";
import helper from "./helper";
import ui from "./ui";
import {OptionModel} from "../../option-validator";

export default class AddLocalesCommand extends AbstractCommand {
  name() {
    return "add-locales";
  }

  description() {
    return "add new locale(s) from existing locale or from the template";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    let profile: string;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
      helper.initiateModels(profile);
    } catch (err) {
      Messenger.getInstance().error(err);
      throw err;
    }
    return new Promise((resolve, reject) => {
      ui.selectLocales(R.keys(CONSTANTS.ALEXA.LANGUAGES), (selectErr: any, selectedLocales: string[]) => {
        if (selectErr) {
          Messenger.getInstance().error(selectErr);
          return reject(selectErr);
        }
        helper.addLocales(selectedLocales, profile, cmd.debug, (addErr: any, iModelSourceByLocales: any) => {
          if (addErr) {
            Messenger.getInstance().error(addErr);
            return reject(addErr);
          }
          ui.displayAddLocalesResult(selectedLocales, iModelSourceByLocales, profile);
          resolve();
        });
      });
    });
  }
}

export const createCommand = new AddLocalesCommand(optionModel as OptionModel).createCommand();
