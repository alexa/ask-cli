const async = require("async");
const fs = require("fs");
const R = require("ramda");

const CONSTANTS = require("../../../utils/constants");
const IAMClient = require("../../../clients/aws-client/iam-client").default;
const LambdaClient = require("../../../clients/aws-client/lambda-client").default;
const Manifest = require("../../../model/manifest");
const ResourcesConfig = require("../../../model/resources-config");
const retryUtils = require("../../../utils/retry-utility");
const stringUtils = require("../../../utils/string-utils");

module.exports = {
  loadLambdaInformation,
  deployIAMRole,
  deployLambdaFunction,
};

/**
 * Loads lambda information
 * @param {Object}   reporter
 * @param {Object}   loadLambdaConfig
 * @param {Function} callback
 */
// TODO: use Error class
async function loadLambdaInformation(reporter, loadLambdaConfig, callback) {
  const {awsProfile, awsRegion, alexaRegion, deployState, userConfig, ignoreHash} = loadLambdaConfig;
  const lambdaClient = new LambdaClient({awsProfile, awsRegion});
  // check if user sets userConfig with "sourceLambda" field to reuse existing Lambda
  const sourceLambdaArn =
    alexaRegion === "default"
      ? R.path(["sourceLambda", "arn"], userConfig)
      : R.path(["regionalOverrides", alexaRegion, "sourceLambda", "arn"], userConfig);
  if (stringUtils.isNonBlankString(sourceLambdaArn)) {
    return _loadLambdaFromUserConfigSource(reporter, lambdaClient, sourceLambdaArn, (loadErr, sourceLambdaData) => {
      callback(loadErr, loadErr ? undefined : sourceLambdaData);
    });
  }

  // Lambda does not exist in deployState
  const lambdaArn = R.path(["lambda", "arn"], deployState);
  if (R.isNil(lambdaArn)) {
    return callback(null, {});
  }

  // Lambda exists, validate the deploy states
  reporter.updateStatus("Validating the deploy state of existing Lambda function...");
  try {
    const data = await lambdaClient.getFunction(lambdaArn);
    // 1. check IAM role arn
    const localIAMRole = deployState.iamRole;
    const remoteIAMRole = data.Configuration.Role;
    if (stringUtils.isNonBlankString(localIAMRole) && !R.equals(localIAMRole, remoteIAMRole)) {
      return callback(`The IAM role for Lambda ARN (${lambdaArn}) should be "${remoteIAMRole}", but found "${localIAMRole}". \
Please solve this IAM role mismatch and re-deploy again. To ignore this error run "ask deploy --ignore-hash".`);
    }
    // 2. check revision id
    const localRevisionId = deployState.lambda.revisionId;
    const remoteRevisionId = data.Configuration.RevisionId;
    if (stringUtils.isNonBlankString(localRevisionId) && !R.equals(localRevisionId, remoteRevisionId) && !ignoreHash) {
      return callback(`The current revisionId (The revision ID for Lambda ARN (${lambdaArn}) should be ${remoteRevisionId}, \
but found ${localRevisionId}. Please solve this revision mismatch and re-deploy again. \
To ignore this error run "ask deploy --ignore-hash".`);
    }
    // 3. return the loaded Lambda data
    callback(null, {
      iamRole: remoteIAMRole,
      lambda: {
        arn: lambdaArn,
        revisionId: remoteRevisionId,
        lastModified: data.Configuration.LastModified,
      },
    });
  } catch (err) {
    callback(err);
  }
}

/**
 * Loads lambda from user config source
 * @param {Object}   reporter
 * @param {Object}   lambdaClient
 * @param {String}   sourceLambdaArn
 * @param {Function} callback
 */
function _loadLambdaFromUserConfigSource(reporter, lambdaClient, sourceLambdaArn, callback) {
  lambdaClient
    .getFunction(sourceLambdaArn)
    .then((data) => {
      const iamRole = data.Configuration.Role;
      const lambda = {
        arn: sourceLambdaArn,
        revisionId: data.Configuration.RevisionId,
        lastModified: data.Configuration.LastModified,
      };
      callback(undefined, {iamRole, lambda});
    })
    .catch((err) => {
      callback(`Failed to load the Lambda (${sourceLambdaArn}) specified in "sourceLambda". ${err}`);
    });
}

/**
 * Deploys an iam role
 * @param {Object}   reporter
 * @param {Object}   deployIAMConfig
 * @param {Function} callback
 */
async function deployIAMRole(reporter, deployIAMConfig, callback) {
  const {awsProfile, alexaRegion, skillName, awsRegion, deployState} = deployIAMConfig;
  const iamClient = new IAMClient({awsProfile, awsRegion});
  let roleArn = deployState.iamRole;
  if (R.isNil(roleArn) || R.isEmpty(roleArn)) {
    reporter.updateStatus("No IAM role exists. Creating an IAM role...");
    try {
      const roleName = _getIAMRoleName(skillName);
      const role = await iamClient.createBasicLambdaRole(roleName);
      roleArn = role.Arn;
      await iamClient.attachBasicLambdaRolePolicy(roleArn);
      reporter.updateStatus(`Created IAM role: "${roleArn}"`);
      callback(null, roleArn);
    } catch (err) {
      callback(`Failed to create IAM role before deploying Lambda. ${err}`);
    }
  } else {
    try {
      const role = await iamClient.getIAMRole(roleArn);
      roleArn = role.Arn;
      reporter.updateStatus(`Current IAM role: "${roleArn}"`);
      callback(null, roleArn);
    } catch (err) {
      if (err.$metadata.httpStatusCode === 404) {
        callback(`The IAM role is not found. Please check if your IAM role from region ${alexaRegion} is valid.`);
      } else {
        callback(`Failed to retrieve IAM role (${roleArn}) for Lambda. ${err}`);
      }
    }
  }
}

/**
 * Returns the IAM role name based on a generated unique role name
 * @param {String} skillName
 * @return {String}
 */
function _getIAMRoleName(skillName) {
  // Generates a valid IAM Role function name.
  //  a IAM Role function name should follow the pattern: ask-lambda-skillName-timeStamp
  //  a valid role name cannot be longer than 64 characters, so the skillName should be <=39 characters since
  //   the roleNamePrefix is 11 characters including the trailing '-' and the timeStamp is 14 characters including the '-'.
  const generateIAMRoleName = () => {
    const roleNamePrefix = process.env.ASK_DEPLOY_ROLE_PREFIX || "ask-lambda";
    const validSkillName = skillName.replace(/_/g, "-").substr(0, 39 - 1);
    return `${roleNamePrefix}-${validSkillName}-${Date.now()}`;
  };

  return generateIAMRoleName();
}

/**
 * Deploys a lambda function
 * @param {Object}   reporter
 * @param {Object}   options
 * @param {Function} callback
 */
function deployLambdaFunction(reporter, options, callback) {
  const {profile, awsProfile, alexaRegion, awsRegion, skillId, skillName, code, iamRoleArn, userConfig, deployState} = options;
  const lambdaClient = new LambdaClient({awsProfile, awsRegion});
  const zipFilePath = code.codeBuild;
  if (R.isNil(deployState.lambda) || R.isEmpty(deployState.lambda)) {
    reporter.updateStatus("No Lambda information exists. Creating a lambda function...");
    const createLambdaOptions = {
      profile,
      alexaRegion,
      skillId,
      skillName,
      iamRoleArn,
      zipFilePath,
      userConfig,
    };
    _createLambdaFunction(reporter, lambdaClient, createLambdaOptions, (lambdaErr, lambdaResources) => {
      if (lambdaErr) {
        return callback(lambdaErr);
      }
      callback(null, lambdaResources);
    });
  } else {
    reporter.updateStatus(`Updating current Lambda function with ARN ${deployState.lambda.arn}...`);
    const updateLambdaOptions = {
      zipFilePath,
      userConfig,
      deployState,
    };
    _updateLambdaFunction(reporter, lambdaClient, updateLambdaOptions, (lambdaErr, lambdaResources) => {
      if (lambdaErr) {
        return callback(lambdaErr);
      }
      callback(null, lambdaResources);
    });
  }
}

/**
 * Creates a lambda function
 * @param {Object}   reporter
 * @param {Object}   lambdaClient
 * @param {Object}   options
 * @param {Function} callback
 */
function _createLambdaFunction(reporter, lambdaClient, options, callback) {
  const {profile, alexaRegion, skillId, skillName, iamRoleArn, zipFilePath, userConfig} = options;
  const functionName = _getLambdaFunctionName(alexaRegion, userConfig, skillName, profile);
  const functionConfig = _getLambdaFunctionConfig(alexaRegion, userConfig);
  const zipFile = fs.readFileSync(zipFilePath);
  const retryConfig = {
    base: CONSTANTS.CONFIGURATION.RETRY.CREATE_LAMBDA_FUNCTION.BASE,
    factor: CONSTANTS.CONFIGURATION.RETRY.CREATE_LAMBDA_FUNCTION.FACTOR,
    maxRetry: CONSTANTS.CONFIGURATION.RETRY.CREATE_LAMBDA_FUNCTION.MAXRETRY,
  };
  const retryCall = (loopCallback) => {
    // 1. Create a Lambda function
    lambdaClient
      .createLambdaFunction(functionName, functionConfig, iamRoleArn, zipFile)
      .then((data) => loopCallback(null, data))
      .catch((err) => {
        // There may be a (small) window of time after creating IAM role and adding policies, the role will trigger the error
        // if creating lambda function during this timming. Thus, use retry to bypass this issue.
        if (err.message === CONSTANTS.LAMBDA.ERROR_MESSAGE.ROLE_NOT_ASSUMED) {
          loopCallback();
        } else {
          loopCallback(err);
        }
      });
  };
  const shouldRetryCondition = (retryResponse) => retryResponse === undefined;
  retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (retryErr, createData) => {
    if (retryErr) {
      return callback(retryErr);
    }
    const functionArn = createData.FunctionArn;
    // 2. Wait for created lambda function to be active
    _waitForLambdaFunction(lambdaClient, functionArn, (waitErr) => {
      if (waitErr) {
        return callback(waitErr);
      }
      // 3. Grant permissions to use a Lambda function
      _addEventPermissions(lambdaClient, skillId, functionArn, profile, (permErr, lambdaData) => {
        if (permErr) {
          return callback(permErr);
        }
        callback(null, {
          isAllStepSuccess: true,
          isCodeDeployed: true,
          lambdaResponse: {
            arn: functionArn,
            lastModified: lambdaData.LastModified,
            revisionId: lambdaData.RevisionId,
          },
        });
      });
    });
  });
}

/**
 * Adds event permissions
 * @param {Object}   lambdaClient
 * @param {String}   skillId
 * @param {String}   functionArn
 * @param {Object}   profile
 * @param {Function} callback
 */
function _addEventPermissions(lambdaClient, skillId, functionArn, profile, callback) {
  const targetEndpoints = ResourcesConfig.getInstance().getTargetEndpoints(profile);
  // for backward compatibility, defaulting to api from skill manifest if targetEndpoints is not defined
  const domains = targetEndpoints.length ? targetEndpoints : Object.keys(Manifest.getInstance().getApis());
  async.forEach(
    domains,
    (domain, permCallback) => {
      lambdaClient
        .addAlexaPermissionByDomain(domain, skillId, functionArn)
        .then(() => permCallback())
        .catch((err) => permCallback(err));
    },
    (permErr) => {
      if (permErr) {
        return callback(permErr);
      }
      _waitForLambdaFunction(lambdaClient, functionArn, callback);
    },
  );
}

/**
 * Returns a Lambda user config parameter value at the regional level defaulting to top level
 * @param {String} alexaRegion
 * @param {Object} userConfig
 * @param {String} parameter
 * @return {String}
 */
function _getLambdaConfigParameter(alexaRegion, userConfig, parameter) {
  return R.path(["regionalOverrides", alexaRegion, "lambda", parameter], userConfig) || R.path(["lambda", parameter], userConfig);
}

/**
 * Returns the Lambda function name based on user config or a generated unique function name
 * @param {String} alexaRegion
 * @param {Object} userConfig
 * @param {String} skillName
 * @param {String} profile
 * @return {String}
 */
function _getLambdaFunctionName(alexaRegion, userConfig, skillName, profile) {
  // Generates a valid Lambda function name.
  //  a lambda function name should follow the pattern: ask-skillName-profileName-alexaRegion-timeStamp
  //  a valid function name cannot longer than 64 characters, so cli fixes the project name no longer than 22 characters
  const generateFunctionName = () => {
    const validSkillName = stringUtils.filterNonAlphanumeric(skillName.toLowerCase()).substring(0, 22);
    const validProfile = stringUtils.filterNonAlphanumeric(profile.toLowerCase()).substring(0, 15);
    return `ask-${validSkillName}-${validProfile}-${alexaRegion}-${Date.now()}`;
  };

  return _getLambdaConfigParameter(alexaRegion, userConfig, "functionName") || generateFunctionName();
}

/**
 * Returns the Lambda function config based on user config
 * @param (String) alexaRegion
 * @param {Object} userConfig
 * @return {Object}
 */
function _getLambdaFunctionConfig(alexaRegion, userConfig) {
  const {runtime, handler} = userConfig;
  const description = _getLambdaConfigParameter(alexaRegion, userConfig, "description");
  const memorySize = _getLambdaConfigParameter(alexaRegion, userConfig, "memorySize");
  const timeout = _getLambdaConfigParameter(alexaRegion, userConfig, "timeout");
  const environmentVariables = _getLambdaConfigParameter(alexaRegion, userConfig, "environmentVariables");
  return {
    runtime,
    handler,
    description,
    memorySize: Number.parseInt(memorySize, 10) || CONSTANTS.LAMBDA.DEFAULT_CONFIG.MEMORY_SIZE,
    timeout: Number.parseInt(timeout, 10) || CONSTANTS.LAMBDA.DEFAULT_CONFIG.TIMEOUT,
    environmentVariables,
  };
}

/**
 * Updates lambda function
 * @param {Object}   reporter
 * @param {Object}   lambdaClient
 * @param {Object}   options
 * @param {Function} callback
 */
function _updateLambdaFunction(reporter, lambdaClient, options, callback) {
  _updateLambdaFunctionCode(reporter, lambdaClient, options, (codeErr, codeData) => {
    if (codeErr) {
      return callback(codeErr);
    }

    _updateLambdaFunctionConfig(reporter, lambdaClient, options, codeData.RevisionId, (configErr, configData) => {
      if (configErr) {
        return callback(null, {
          isAllStepSuccess: false,
          isCodeDeployed: true,
          lambdaResponse: {
            arn: codeData.FunctionArn,
            lastModified: codeData.LastModified,
            revisionId: codeData.RevisionId,
          },
          resultMessage: configErr,
        });
      }
      callback(null, {
        isAllStepSuccess: true,
        isCodeDeployed: true,
        lambdaResponse: {
          arn: configData.FunctionArn,
          lastModified: configData.LastModified,
          revisionId: configData.RevisionId,
        },
      });
    });
  });
}

/**
 * Updates lambda function code
 * @param {Object}   reporter
 * @param {Object}   lambdaClient
 * @param {Object}   options
 * @param {Function} callback
 */
function _updateLambdaFunctionCode(reporter, lambdaClient, options, callback) {
  const {zipFilePath, deployState} = options;
  const zipFile = fs.readFileSync(zipFilePath);
  const functionArn = deployState.lambda.arn;
  const {revisionId} = deployState.lambda;

  lambdaClient
    .updateFunctionCode(functionArn, zipFile, revisionId)
    .then(() => {
      reporter.updateStatus(`Update a lambda function code (${functionArn}) in progress...`);
      _waitForLambdaFunction(lambdaClient, functionArn, callback);
    })
    .catch((err) => callback(err));
}

/**
 * Updates lambda function config
 * @param {Object}   reporter
 * @param {Object}   lambdaClient
 * @param {Object}   options
 * @param {String}   revisionId
 * @param {Function} callback
 */
function _updateLambdaFunctionConfig(reporter, lambdaClient, options, revisionId, callback) {
  const {alexaRegion, deployState, userConfig} = options;
  const functionArn = deployState.lambda.arn;
  const functionConfig = _getLambdaFunctionConfig(alexaRegion, userConfig);

  lambdaClient
    .updateFunctionConfiguration(functionArn, functionConfig, revisionId)
    .then(() => {
      reporter.updateStatus(`Update a lambda function configuration (${functionArn}) in progress...`);
      _waitForLambdaFunction(lambdaClient, functionArn, callback);
    })
    .catch((err) => callback(err));
}

/**
 * Waits for lambda function
 * @param {Object}   lambdaClient
 * @param {String}   functionArn
 * @param {Function} callback
 */
function _waitForLambdaFunction(lambdaClient, functionArn, callback) {
  const retryConfig = {
    base: CONSTANTS.CONFIGURATION.RETRY.WAIT_LAMBDA_FUNCTION.BASE,
    factor: CONSTANTS.CONFIGURATION.RETRY.WAIT_LAMBDA_FUNCTION.FACTOR,
    maxRetry: CONSTANTS.CONFIGURATION.RETRY.WAIT_LAMBDA_FUNCTION.MAXRETRY,
  };
  const retryCall = (loopCallback) => {
    lambdaClient
      .getFunction(functionArn)
      .then((data) => loopCallback(null, data.Configuration))
      .catch((err) => loopCallback(err));
  };
  const shouldRetryCondition = (retryResponse) =>
    retryResponse.State === CONSTANTS.LAMBDA.FUNCTION_STATE.PENDING ||
    retryResponse.LastUpdateStatus === CONSTANTS.LAMBDA.LAST_UPDATE_STATUS.IN_PROGRESS;

  retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (retryErr, lambdaData) => {
    if (retryErr) {
      return callback(retryErr);
    }
    if (lambdaData.State !== CONSTANTS.LAMBDA.FUNCTION_STATE.ACTIVE) {
      return callback(`Function [${functionArn}] state is ${lambdaData.State}.`);
    }
    if (lambdaData.LastUpdateStatus !== CONSTANTS.LAMBDA.LAST_UPDATE_STATUS.SUCCESSFUL) {
      return callback(`Function [${functionArn}] last update status is ${lambdaData.LastUpdateStatus}.`);
    }
    callback(null, lambdaData);
  });
}
