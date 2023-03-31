import path from "path";
import SmapiClient from "../../../clients/smapi-client";
import {AbstractCommand} from "../../abstract-command";
import optionModel from "../../option-model.json";
import ResourcesConfig from "../../../model/resources-config";
import CONSTANTS from "../../../utils/constants";
import profileHelper from "../../../utils/profile-helper";
import jsonView from "../../../view/json-view";
import Messenger from "../../../view/messenger";
import {OptionModel} from "../../option-validator";

export default class GitCredentialsHelperCommand extends AbstractCommand {
  name() {
    return "git-credentials-helper";
  }

  description() {
    return "gets git credentials for hosted skill repository";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["profile", "debug"];
  }

  async handle(cmd: Record<string, any>, remaining?: string[]): Promise<void> {
    if (remaining && !["get", "store", "erase"].includes(remaining[0])) {
      const NON_GET_OPERATION_ERR = `The ask-cli git credentials helper doesn't support operation "${remaining[0]}".`;
      Messenger.getInstance().error(NON_GET_OPERATION_ERR);
      throw NON_GET_OPERATION_ERR;
    }
    if (remaining && (remaining[0] === "store" || remaining[0] === "erase")) {
      // TODO: add "erase" enhancement to clean through the entire providerchain: oskeychain, sys, local
      return;
    }

    let profile;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
      new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
    } catch (err) {
      Messenger.getInstance().error(err);
      throw err;
    }

    const skillId = ResourcesConfig.getInstance().getSkillId(profile);

    const smapiClient = new SmapiClient({
      profile,
      doDebug: cmd.debug,
    });

    return new Promise((resolve, reject) => {
      smapiClient.skill.alexaHosted.getAlexaHostedSkillMetadata(skillId, (metadataErr: any, metaDataResponse: any) => {
        let error = this._checkError(metadataErr, metaDataResponse);
        if (error) {
          reject(error);
        }
        const {repository} = metaDataResponse.body.alexaHosted;
        smapiClient.skill.alexaHosted.getGitCredentials(skillId, repository.url, (err: any, response: any) => {
          error = this._checkError(err, response);
          if (error) {
            reject(error);
          }
          const {repositoryCredentials} = response.body;
          const output = `username=${repositoryCredentials.username}\npassword=${repositoryCredentials.password}`;
          Messenger.getInstance().info(output);
          resolve();
        });
      });
    });
  }

  _checkError(err: any, response: any) {
    if (err) {
      Messenger.getInstance().error(err);
      return err;
    }
    if (response.statusCode >= 300) {
      const error = jsonView.toString(response.body);
      Messenger.getInstance().error(error);
      return error;
    }
  }
}

export const createCommand = new GitCredentialsHelperCommand(optionModel as OptionModel).createCommand();
