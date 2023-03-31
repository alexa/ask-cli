import {AbstractCommand} from "../../../abstract-command";
import jsonView from "../../../../view/json-view";
import Messenger from "../../../../view/messenger";
import optionModel from "../../../option-model.json";
import profileHelper from "../../../../utils/profile-helper";
import SmapiClient from "../../../../clients/smapi-client";
import {OptionModel} from "../../../option-validator";

export default class GetTaskCommand extends AbstractCommand {
  name() {
    return "get-task";
  }

  description() {
    return "Get the task definition details specified by the taskName and version.";
  }

  requiredOptions() {
    return ["skill-id", "task-name", "task-version"];
  }

  optionalOptions() {
    return ["profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    const {skillId, taskName, taskVersion, profile, debug} = cmd;
    const smapiClient = new SmapiClient({
      profile: profileHelper.runtimeProfile(profile),
      doDebug: debug,
    });
    return new Promise((resolve, reject) => {
      smapiClient.task.getTask(skillId, taskName, taskVersion, (err: any, result: any) => {
        if (err || result.statusCode >= 400) {
          const error = err || jsonView.toString(result.body);
          Messenger.getInstance().error(error);
          reject(error);
        } else {
          const res = jsonView.toString(JSON.parse(result.body.definition));
          Messenger.getInstance().info(res);
          resolve(res);
        }
      });
    });
  }
}

export const createCommand = new GetTaskCommand(optionModel as OptionModel).createCommand();
