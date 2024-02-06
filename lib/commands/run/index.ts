import path from "path";
import SmapiClient, {ISmapiClient} from "../../clients/smapi-client";
import {AbstractCommand} from "../abstract-command";
import optionModel from "../../commands/option-model.json";
import AuthorizationController from "../../controllers/authorization-controller";
import ResourcesConfig from "../../model/resources-config";
import CONSTANTS from "../../utils/constants";
import profileHelper from "../../utils/profile-helper";
import jsonView from "../../view/json-view";
import stringUtils from "../../utils/string-utils";
import Messenger from "../../view/messenger";
import CliError from "../../exceptions/cli-error";
import * as helper from "./helper";
import {OptionModel} from "../option-validator";

export default class RunCommand extends AbstractCommand {
  name() {
    return "run";
  }

  description() {
    return (
      "Starts a local instance of your project as the skill endpoint." +
      " Automatically re-routes development requests and responses between the Alexa service and your local instance."
    );
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["debug-port", "wait-for-attach", "watch", "region", "profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    const debugPort = cmd.debugPort || CONSTANTS.RUN.DEFAULT_DEBUG_PORT;
    const skillCodeRegion = cmd.region || CONSTANTS.ALEXA.REGION.NA;
    const runRegion = cmd.region || CONSTANTS.ALEXA.REGION.NA;
    const watch = cmd.watch || false;
    let skillId, profile;

    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
      new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
      skillId = ResourcesConfig.getInstance().getSkillId(profile);
      if (!stringUtils.isNonBlankString(skillId)) {
        throw new CliError(`Failed to obtain skill-id for the given profile - ${profile}` + ". Please deploy your skill project first.");
      }
    } catch (error) {
      Messenger.getInstance().error(error);
      throw error;
    }

    try {
      const token = await this._getAccessTokenForProfile(profile, cmd.debug);
      const runFlowInstance = await this._getSkillRunFlow(
        skillId,
        profile,
        skillCodeRegion,
        cmd.waitForAttach,
        watch,
        cmd.debug,
        debugPort,
        token,
        runRegion,
      );
      Messenger.getInstance().info(
        "\n*****Once the session is successfully started, " +
          "you can use `ask dialog` to make simulation requests to your local skill code*****\n",
      );
      if (cmd.waitForAttach) {
        Messenger.getInstance().info(`\n*****Debugging session will wait until inspector is attached at port - ${debugPort}*****\n`);
      }
      await runFlowInstance.execCommand();
    } catch (tokenErr) {
      Messenger.getInstance().error(tokenErr);
      throw tokenErr;
    }
  }

  _getAccessTokenForProfile(profile: string, debug: string): Promise<string> {
    const authorizationController = new AuthorizationController({
      auth_client_type: "LWA",
      doDebug: debug,
    });
    return new Promise((resolve, reject) => {
      authorizationController.tokenRefreshAndRead(profile, (tokenErr: any, token: string) => {
        if (tokenErr) {
          return reject(tokenErr);
        }
        resolve(token);
      });
    });
  }

  _getHostedSkillRuntime(smapiClient: ISmapiClient, skillId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      smapiClient.skill.alexaHosted.getAlexaHostedSkillMetadata(skillId, (err: any, response: any) => {
        if (err) {
          return reject(err);
        }
        if (response.statusCode >= 300) {
          const error = jsonView.toString(response.body);
          return reject(error);
        }
        try {
          if (!response.body) {
            throw new CliError("Received an empty response body from getAlexaHostedSkillMetadata");
          }
          const {runtime} = response.body.alexaHosted;
          if (!stringUtils.isNonBlankString(runtime)) {
            throw new CliError(`Unable to determine runtime of the hosted skill - ${skillId}`);
          }
          resolve(helper.getNormalisedRuntime(runtime));
        } catch (error) {
          return reject(error);
        }
      });
    });
  }

  async _getSkillRunFlow(
    skillId: string,
    profile: string,
    skillCodeRegion: string,
    waitForAttach: boolean,
    watch: boolean,
    debug: boolean,
    debugPort: string,
    token: string,
    runRegion: string,
  ) {
    if (this._filterAlexaHostedSkill(profile)) {
      const smapiClient = new SmapiClient({
        profile,
        doDebug: debug,
      });
      const runtime = await this._getHostedSkillRuntime(smapiClient, skillId);
      return helper.getSkillFlowInstance(
        runtime,
        helper.getHostedSkillInvocationInfo(runtime),
        waitForAttach,
        debugPort,
        token,
        skillId,
        runRegion,
        watch,
      );
    } else {
      const skillCodeFolderName = helper.getSkillCodeFolderName(profile, skillCodeRegion);
      Messenger.getInstance().info(`Skill code folder name select for the run session: ${skillCodeFolderName}`);
      const userConfig = ResourcesConfig.getInstance().getSkillInfraUserConfig(profile);
      if (!userConfig) {
        throw new CliError("Failed to obtain userConfig from project " + `resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`);
      }
      const {runtime, handler} = userConfig;
      if (!runtime) {
        throw new CliError(
          `Failed to obtain runtime from userConfig in project resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`,
        );
      }
      const normalisedRuntime = helper.getNormalisedRuntime(runtime);
      return helper.getSkillFlowInstance(
        normalisedRuntime,
        helper.getNonHostedSkillInvocationInfo(normalisedRuntime, handler, skillCodeFolderName),
        waitForAttach,
        debugPort,
        token,
        skillId,
        runRegion,
        watch,
      );
    }
  }

  _filterAlexaHostedSkill(profile: string) {
    return ResourcesConfig.getInstance().getSkillInfraType(profile) === CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME;
  }
}

export const createCommand = new RunCommand(optionModel as OptionModel).createCommand();
