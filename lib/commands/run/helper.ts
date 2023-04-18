import {existsSync} from "fs";
import {getInstance} from "../../model/resources-config";
import {HOSTED_SKILL, FILE_PATH, RUNTIME, ALEXA} from "../../utils/constants";
import {isNonBlankString} from "../../utils/string-utils";
import CliError from "../../exceptions/cli-error";
import {NodejsRunFlow} from "./run-flow/nodejs-run";
import {PythonRunFlow} from "./run-flow/python-run";
import {JavaRunFlow} from "./run-flow/java-run";

const RUN_FLOWS = [JavaRunFlow, NodejsRunFlow, PythonRunFlow];

export function getHostedSkillInvocationInfo(runtime: string) {
  const invocationInfo: any = HOSTED_SKILL.RUN.INVOCATION_INFO;
  return invocationInfo[runtime];
}

export function getNonHostedSkillInvocationInfo(runtime: string, handler: string, skillCodeFolderName: string): object {
  if (!isNonBlankString(runtime)) {
    throw new CliError(`Missing runtime info in resource file ${FILE_PATH.ASK_RESOURCES_JSON_CONFIG}.`);
  }
  if (!isNonBlankString(handler)) {
    throw new CliError(`Missing handler info in resource file ${FILE_PATH.ASK_RESOURCES_JSON_CONFIG}.`);
  }
  if (runtime === RUNTIME.JAVA) {
    return {handlerName: handler, skillCodeFolderName};
  }
  const handlerInfo = handler.split(".");
  const handlerName = handlerInfo.pop();
  const skillFileName = handlerInfo.pop();
  return {handlerName, skillFileName, skillCodeFolderName};
}

export function getSkillCodeFolderName(profile: string, skillCodeRegion: string) {
  const userRegionSkillCodeFolderName = getInstance().getCodeSrcByRegion(profile, skillCodeRegion);
  const skillCodeFolderName =
    !isNonBlankString(userRegionSkillCodeFolderName) && userRegionSkillCodeFolderName !== ALEXA.REGION.DEFAULT
      ? getInstance().getCodeSrcByRegion(profile, ALEXA.REGION.DEFAULT)
      : userRegionSkillCodeFolderName;
  if (!isNonBlankString(skillCodeFolderName)) {
    throw new CliError(
      `Invalid code setting in region ${skillCodeRegion}. "src" must be set if you want to run the skill code with skill package.`,
    );
  }
  if (!existsSync(skillCodeFolderName)) {
    throw new CliError(`Invalid code setting in region ${skillCodeRegion}. File doesn't exist for code src: ${skillCodeFolderName}.`);
  }
  return skillCodeFolderName;
}

export function getNormalisedRuntime(runtime: string) {
  if (runtime.includes(RUNTIME.NODE)) {
    return RUNTIME.NODE;
  }
  if (runtime.includes(RUNTIME.PYTHON)) {
    return RUNTIME.PYTHON;
  }
  if (runtime.includes(RUNTIME.JAVA)) {
    return RUNTIME.JAVA;
  }
  throw new CliError(`Runtime - ${runtime} is not supported.`);
}

export function selectRunFlowClass(runtime: string): any {
  return RUN_FLOWS.find((flow) => flow.canHandle(runtime));
}

export function getSkillFlowInstance(
  runtime: string,
  skillInvocationInfo: any,
  waitForAttach: boolean,
  debugPort: string,
  token: string,
  skillId: string,
  runRegion: string,
  watch: boolean,
) {
  const RunFlow = selectRunFlowClass(runtime);
  return new RunFlow({
    skillInvocationInfo,
    waitForAttach,
    debugPort,
    token,
    skillId,
    runRegion,
    watch,
  });
}
