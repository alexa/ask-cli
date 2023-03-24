const fs = require("fs");
const ResourcesConfig = require("../../model/resources-config");
const CONSTANTS = require("../../utils/constants");
const stringUtils = require("../../utils/string-utils");
const CliError = require("../../exceptions/cli-error");
const NodejsRunFlow = require("./run-flow/nodejs-run");
const PythonRunFlow = require("./run-flow/python-run");
const JavaRunFlow = require("./run-flow/java-run");

const RUN_FLOWS = [JavaRunFlow, NodejsRunFlow, PythonRunFlow];

module.exports = {
  getHostedSkillInvocationInfo,
  getNonHostedSkillInvocationInfo,
  getSkillCodeFolderName,
  getNormalisedRuntime,
  selectRunFlowClass,
  getSkillFlowInstance,
};

function getHostedSkillInvocationInfo(runtime) {
  return CONSTANTS.HOSTED_SKILL.RUN.INVOCATION_INFO[runtime];
}

function getNonHostedSkillInvocationInfo(runtime, handler, skillCodeFolderName) {
  if (!stringUtils.isNonBlankString(runtime)) {
    throw new CliError("Missing runtime info in " + `resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}.`);
  }
  if (!stringUtils.isNonBlankString(handler)) {
    throw new CliError("Missing handler info " + `in resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}.`);
  }
  if (runtime === CONSTANTS.RUNTIME.JAVA) {
    return {handlerName: handler, skillCodeFolderName};
  }
  const handlerInfo = handler.split(".");
  const handlerName = handlerInfo.pop();
  const skillFileName = handlerInfo.pop();
  return {handlerName, skillFileName, skillCodeFolderName};
}

function getSkillCodeFolderName(profile, skillCodeRegion) {
  const userRegionSkillCodeFolderName = ResourcesConfig.getInstance().getCodeSrcByRegion(profile, skillCodeRegion);
  const skillCodeFolderName =
    !stringUtils.isNonBlankString(userRegionSkillCodeFolderName) && userRegionSkillCodeFolderName !== CONSTANTS.ALEXA.REGION.DEFAULT
      ? ResourcesConfig.getInstance().getCodeSrcByRegion(profile, CONSTANTS.ALEXA.REGION.DEFAULT)
      : userRegionSkillCodeFolderName;
  if (!stringUtils.isNonBlankString(skillCodeFolderName)) {
    throw new CliError(
      `Invalid code setting in region ${skillCodeRegion}. "src" must be set if you want to run ` + "the skill code with skill package.",
    );
  }
  if (!fs.existsSync(skillCodeFolderName)) {
    throw new CliError(`Invalid code setting in region ${skillCodeRegion}.` + ` File doesn't exist for code src: ${skillCodeFolderName}.`);
  }
  return skillCodeFolderName;
}

function getNormalisedRuntime(runtime) {
  if (runtime.includes(CONSTANTS.RUNTIME.NODE)) {
    return CONSTANTS.RUNTIME.NODE;
  }
  if (runtime.includes(CONSTANTS.RUNTIME.PYTHON)) {
    return CONSTANTS.RUNTIME.PYTHON;
  }
  if (runtime.includes(CONSTANTS.RUNTIME.JAVA)) {
    return CONSTANTS.RUNTIME.JAVA;
  }
  throw new CliError(`Runtime - ${runtime} is not supported.`);
}

function selectRunFlowClass(runtime) {
  return RUN_FLOWS.find((flow) => flow.canHandle(runtime));
}

function getSkillFlowInstance(runtime, skillInvocationInfo, waitForAttach, debugPort, token, skillId, runRegion, watch) {
  const RunFlow = this.selectRunFlowClass(runtime);
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
