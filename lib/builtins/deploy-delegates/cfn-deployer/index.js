const path = require("path");
const fs = require("fs");
const R = require("ramda");

const awsUtil = require("../../../clients/aws-client/aws-util");
const stringUtils = require("../../../utils/string-utils");
const CliCFNDeployerError = require("../../../exceptions/cli-cfn-deployer-error");
const Helper = require("./helper");

const SKILL_STACK_PUBLIC_FILE_NAME = "skill-stack.yaml";
const SKILL_STACK_ASSET_FILE_NAME = "basic-lambda.yaml";

module.exports = {
  bootstrap,
  invoke,
};

/**
 * Bootstrap ask-cli resources config with initial state and examples.
 * @param {Object} options
 * @param {Function} callback
 */
async function bootstrap(options, callback) {
  const {profile, workspacePath} = options;
  const userConfig = options.userConfig || {};
  const templateLocation = path.join(workspacePath, SKILL_STACK_PUBLIC_FILE_NAME);
  let updatedUserConfig;
  try {
    const templateContent = fs.readFileSync(path.join(__dirname, "assets", SKILL_STACK_ASSET_FILE_NAME), "utf-8");
    const awsProfile = awsUtil.getAWSProfile(profile);
    const awsDefaultRegion = await awsUtil.getCLICompatibleDefaultRegion(awsProfile);
    fs.writeFileSync(templateLocation, templateContent);
    userConfig.templatePath = `./${path.posix.join("infrastructure", path.basename(workspacePath), SKILL_STACK_PUBLIC_FILE_NAME)}`;
    updatedUserConfig = R.set(R.lensPath(["awsRegion"]), awsDefaultRegion, userConfig);
  } catch (e) {
    return callback(e.message);
  }
  callback(null, {userConfig: updatedUserConfig});
}

/**
 * Invoke the actual deploy logic for skill's infrastructures
 * @param {Object} reporter upstream CLI status reporter
 * @param {Object} options request object from deploy-delegate which provides user's input and project's info
 *                         { profile, alexaRegion, skillId, skillName, code, userConfig, deployState }
 * @param {Function} callback { errorStr, responseObject }
 *                            .errorStr deployDelegate will fail immediately with this errorStr
 *                            .responseObject.isAllStepSuccess show if the entire process succeeds
 *                            .responseObject.isCodeDeployed true if the code is uploaded sucessfully and no need to upload again
 *                            .responseObject.deployState record the state of deployment back to file (including partial success)
 *                            .responseObject.endpoint the final result endpoint response
 *                            .responseObject.resultMessage the message to summarize current situation
 */
async function invoke(reporter, options, callback) {
  const {alexaRegion, deployState = {}} = options;
  const deployProgress = {
    isAllStepSuccess: false,
    isCodeDeployed: false,
    deployState: deployState[alexaRegion] || {},
  };

  try {
    await _deploy(reporter, options, deployProgress);
    deployProgress.resultMessage = deployProgress.isDeploySkipped
      ? _makeSkippedMessage(deployProgress.deployRegion, alexaRegion)
      : _makeSuccessMessage(deployProgress.endpoint.uri, alexaRegion);
  } catch (err) {
    deployProgress.resultMessage = _makeErrorMessage(err, alexaRegion);
  }
  callback(null, deployProgress);
}

async function _deploy(reporter, options, deployProgress) {
  const {profile, doDebug, alexaRegion, skillId, skillName, code, userConfig, deployState = {}, deployRegions} = options;

  const {stackId} = deployProgress.deployState;
  const awsProfile = _getAwsProfile(profile);
  const awsRegion = _getAwsRegion(alexaRegion, deployRegions);
  const templateBody = _getTemplateBody(alexaRegion, userConfig);
  const userDefinedParameters = _getUserDefinedParameters(alexaRegion, userConfig);
  const bucketName = _getS3BucketName(alexaRegion, userConfig, deployProgress.deployState, awsProfile, awsRegion);
  const bucketKey = _getS3BucketKey(alexaRegion, userConfig, code.codeBuild);
  const stackName = _getStackName(skillName, alexaRegion);
  const deployRegion = R.keys(deployRegions).find((region) => deployRegions[region] === awsRegion);

  if (deployRegion !== alexaRegion && R.equals(deployState[deployRegion], deployState[alexaRegion])) {
    deployProgress.isDeploySkipped = true;
    deployProgress.deployRegion = deployRegion;
    return;
  }

  const helper = new Helper(profile, doDebug, awsProfile, awsRegion, reporter);

  // skill credentials
  const skillCredentials =
    templateBody.includes("SkillClientId") && templateBody.includes("SkillClientSecret") ? await helper.getSkillCredentials(skillId) : {};

  // s3 upload
  const uploadResult = await helper.uploadToS3(bucketName, bucketKey, code.codeBuild);

  deployProgress.deployState.s3 = {
    bucket: bucketName,
    key: bucketKey,
  };

  deployProgress.isCodeDeployed = true;

  // cf deploy
  const codeVersion = uploadResult.VersionId;
  const s3Artifact = {bucketName, bucketKey, codeVersion};
  const stackParameters = _mapStackParameters(skillId, skillCredentials, userConfig, s3Artifact, userDefinedParameters);
  const capabilities = _getCapabilities(alexaRegion, userConfig);

  const deployResult = await helper.deployStack(stackId, stackName, templateBody, stackParameters, capabilities);

  deployProgress.deployState.stackId = deployResult.stackId;
  deployProgress.deployState.outputs = deployResult.stackInfo.Outputs;
  deployProgress.endpoint = {uri: deployResult.endpointUri};
  deployProgress.isAllStepSuccess = true;
}

function _getAwsProfile(profile) {
  const awsProfile = awsUtil.getAWSProfile(profile);
  if (!awsProfile) {
    throw new CliCFNDeployerError(
      `Profile [${profile}] doesn't have AWS profile linked to it. ` + 'Please run "ask configure" to re-configure your profile.',
    );
  }
  return awsProfile;
}

function _getAwsRegion(alexaRegion, deployRegions) {
  const awsRegion = deployRegions[alexaRegion];
  if (!awsRegion) {
    throw new CliCFNDeployerError(
      `Unsupported Alexa region: ${alexaRegion}. ` + 'Please check your region name or use "regionalOverrides" to specify AWS region.',
    );
  }
  return awsRegion;
}

function _getS3BucketName(alexaRegion, userConfig, currentRegionDeployState, awsProfile, awsRegion) {
  const customValue =
    R.path(["regionalOverrides", alexaRegion, "artifactsS3", "bucketName"], userConfig) ||
    R.path(["artifactsS3", "bucketName"], userConfig);

  if (customValue) return customValue;

  // Generates a valid S3 bucket name.
  //  a bucket name should follow the pattern: ask-projectName-profileName-awsRegion-timeStamp
  //  a valid bucket name cannot longer than 63 characters, so cli fixes the project name no longer than 22 characters
  const generateBucketName = () => {
    const projectName = path.basename(process.cwd());
    const validProjectName = stringUtils.filterNonAlphanumeric(projectName.toLowerCase()).substring(0, 22);
    const validProfile = stringUtils.filterNonAlphanumeric(awsProfile.toLowerCase()).substring(0, 9);
    const shortRegionName = awsRegion.replace(/-/g, "");
    return `ask-${validProjectName}-${validProfile}-${shortRegionName}-${Date.now()}`;
  };

  return R.path(["s3", "bucket"], currentRegionDeployState) || generateBucketName();
}

function _getS3BucketKey(alexaRegion, userConfig, codeBuild) {
  const customValue =
    R.path(["regionalOverrides", alexaRegion, "artifactsS3", "bucketKey"], userConfig) || R.path(["artifactsS3", "bucketKey"], userConfig);

  if (customValue) return customValue;

  return `endpoint/${path.basename(codeBuild)}`;
}

function _getStackName(skillName, alexaRegion) {
  // Generates a valid CloudFormation stack name.
  //  a stack name should follow the pattern: ask-skillName-alexaRegion-skillStack-timeStamp
  //  a valid stack name cannot longer than 128 characters, so cli fixes the skill name no longer than 64 characters
  const generateStackName = () => {
    const validSkillName = stringUtils.filterNonAlphanumeric(skillName).substring(0, 64);
    const shortRegionName = alexaRegion.replace(/-/g, "");
    return `ask-${validSkillName}-${shortRegionName}-skillStack-${Date.now()}`;
  };

  return generateStackName();
}

function _getCapabilities(alexaRegion, userConfig) {
  let capabilities =
    R.path(["regionalOverrides", alexaRegion, "cfn", "capabilities"], userConfig) || R.path(["cfn", "capabilities"], userConfig);
  capabilities = new Set(capabilities || []);
  capabilities.add("CAPABILITY_IAM");

  return Array.from(capabilities);
}

function _getUserDefinedParameters(alexaRegion, userConfig) {
  const reservedParameters = {
    SkillId: "Please use a different name.",
    SkillClientId: "Please use a different name.",
    SkillClientSecret: "Please use a different name.",
    LambdaRuntime: "Please specify under skillInfrastructure.userConfig.runtime.",
    LambdaHandler: "Please specify under skillInfrastructure.userConfig.handler.",
    CodeBucket: "Please specify under skillInfrastructure.userConfig.artifactsS3.bucketName.",
    CodeKey: "Please specify under skillInfrastructure.userConfig.artifactsS3.bucketKey.",
    CodeVersion: "Please use a different name.",
  };

  const reservedParametersKeys = new Set(Object.keys(reservedParameters));

  let parameters = R.path(["regionalOverrides", alexaRegion, "cfn", "parameters"], userConfig) || R.path(["cfn", "parameters"], userConfig);

  parameters = parameters || [];

  Object.keys(parameters).forEach((key) => {
    if (reservedParametersKeys.has(key)) {
      const message = reservedParameters[key];
      throw new CliCFNDeployerError(`Cloud Formation parameter "${key}" is reserved. ${message}`);
    }
  });

  return parameters;
}

function _getTemplateBody(alexaRegion, userConfig) {
  const templatePath = R.path(["regionalOverrides", alexaRegion, "templatePath"], userConfig) || userConfig.templatePath;
  if (!templatePath) {
    throw new CliCFNDeployerError("The template path in userConfig must be provided.");
  }
  return fs.readFileSync(templatePath, "utf-8");
}

function _makeSkippedMessage(deployRegion, alexaRegion) {
  return `The CloudFormation deploy for Alexa region "${alexaRegion}" is same as "${deployRegion}".`;
}

function _makeSuccessMessage(endpointUri, alexaRegion) {
  return `The CloudFormation deploy succeeded for Alexa region "${alexaRegion}" with output Lambda ARN: ${endpointUri}.`;
}

function _makeErrorMessage(error, alexaRegion) {
  return `The CloudFormation deploy failed for Alexa region "${alexaRegion}": ${error.message}`;
}

function _mapStackParameters(skillId, skillCredentials, userConfig, s3Artifact, userDefinedParameters) {
  const parameters = [
    {
      ParameterKey: "SkillId",
      ParameterValue: skillId,
    },
    {
      ParameterKey: "LambdaRuntime",
      ParameterValue: userConfig.runtime,
    },
    {
      ParameterKey: "LambdaHandler",
      ParameterValue: userConfig.handler,
    },
    {
      ParameterKey: "CodeBucket",
      ParameterValue: s3Artifact.bucketName,
    },
    {
      ParameterKey: "CodeKey",
      ParameterValue: s3Artifact.bucketKey,
    },
    {
      ParameterKey: "CodeVersion",
      ParameterValue: s3Artifact.codeVersion,
    },
  ];

  if (skillCredentials.clientId && skillCredentials.clientSecret) {
    const clientIdParameter = {
      ParameterKey: "SkillClientId",
      ParameterValue: skillCredentials.clientId,
    };
    const clientSecretParameter = {
      ParameterKey: "SkillClientSecret",
      ParameterValue: skillCredentials.clientSecret,
    };
    parameters.push(clientIdParameter, clientSecretParameter);
  }

  Object.keys(userDefinedParameters).forEach((key) => {
    const parameter = {
      ParameterKey: key,
      ParameterValue: userDefinedParameters[key],
    };
    parameters.push(parameter);
  });

  return parameters;
}
