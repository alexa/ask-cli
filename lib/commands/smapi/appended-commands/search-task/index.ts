import R from "ramda";
import {AbstractCommand} from "../../../abstract-command";
import jsonView from "../../../../view/json-view";
import Messenger from "../../../../view/messenger";
import optionModel from "../../../option-model.json";
import profileHelper from "../../../../utils/profile-helper";
import SmapiClient from "../../../../clients/smapi-client";
import {OptionModel} from "../../../option-validator";

export default class SearchTaskCommand extends AbstractCommand {
  name() {
    return "search-task";
  }

  description() {
    return (
      "List the tasks summary information based on keywords or provider skillId. " +
      "If both keywords and provider skillId are not specified, will list all the tasks " +
      "summary information accessible by the skillId."
    );
  }

  requiredOptions() {
    return ["skill-id"];
  }

  optionalOptions() {
    return ["next-token", "max-results", "provider-skill-id", "keywords", "profile", "debug"];
  }

  static encodeSpaces(keywords: string) {
    return keywords ? keywords.replace(/\s/g, "%20") : keywords;
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    const {skillId, providerSkillId, maxResults, nextToken, profile, debug} = cmd;
    const keywords = SearchTaskCommand.encodeSpaces(cmd.keywords);
    const queryParams = R.reject(R.isNil, {maxResults, nextToken});

    const smapiClient = new SmapiClient({
      profile: profileHelper.runtimeProfile(profile),
      doDebug: debug,
    });

    return new Promise((resolve, reject) => {
      smapiClient.task.searchTask(skillId, keywords, providerSkillId, queryParams, (err: any, result: any) => {
        if (err || result.statusCode >= 400) {
          const error = err || jsonView.toString(result.body);
          Messenger.getInstance().error(error);
          reject(error);
        } else {
          const res = jsonView.toString(result.body);
          Messenger.getInstance().info(res);
          resolve(res);
        }
      });
    });
  }
}

export const createCommand = new SearchTaskCommand(optionModel as OptionModel).createCommand();
