const R = require("ramda");

const awsUtil = require("../../../clients/aws-client/aws-util");
const stringUtils = require("../../../utils/string-utils");
const helper = require("./helper");

module.exports = {
  bootstrap,
  invoke,
};

/**
 * Bootstrap ask-cli resources config with initial configuration.
 * @param {Object} options
 * @param {Function} callback
 */
function bootstrap(options, callback) {
  const {profile, userConfig} = options;
  const awsProfile = awsUtil.getAWSProfile(profile);
  const awsDefaultRegion = awsUtil.getCLICompatibleDefaultRegion(awsProfile);
  const updatedUserConfig = R.set(R.lensPath(["awsRegion"]), awsDefaultRegion, userConfig);
  callback(null, {userConfig: updatedUserConfig});
}

/**
 * Invoke the actual deploy logic for skill's infrastructure
 * @param {Object} reporter upstream CLI status reporter
 * @param {Object} options
 * @param {Function} callback
 */
function invoke(reporter, options, callback) {
  const {profile, ignoreHash, alexaRegion, skillId, skillName, code, userConfig, deployState = {}, deployRegions} = options;
  const currentRegionDeployState = deployState[alexaRegion] || {};
  const awsProfile = awsUtil.getAWSProfile(profile);
  if (!stringUtils.isNonBlankString(awsProfile)) {
    return callback(`Profile [${profile}] doesn't have AWS profile linked to it. Please run "ask configure" to re-configure your profile.`);
  }
  const awsRegion = deployRegions[alexaRegion];
  if (!stringUtils.isNonBlankString(awsRegion)) {
    return callback(
      `Unsupported Alexa region: ${alexaRegion}. Please check your region name or use "regionalOverrides" to specify AWS region.`,
    );
  }
  const deployRegion = R.keys(deployRegions).find((region) => deployRegions[region] === awsRegion);
  if (deployRegion !== alexaRegion && R.equals(deployState[deployRegion], deployState[alexaRegion])) {
    return callback(null, {
      isDeploySkipped: true,
      deployRegion,
      resultMessage: `The lambda deploy for Alexa region "${alexaRegion}" is same as "${deployRegion}"`,
    });
  }

  // load Lambda info from either existing deployState or userConfig's sourceLambda
  const loadLambdaConfig = {awsProfile, awsRegion, alexaRegion, ignoreHash, deployState: currentRegionDeployState, userConfig};
  helper.loadLambdaInformation(reporter, loadLambdaConfig, (loadLambdaErr, lambdaData) => {
    if (loadLambdaErr) {
      return callback(null, {
        isAllStepSuccess: false,
        isCodeDeployed: false,
        deployState: currentRegionDeployState,
        resultMessage: `The lambda deploy failed for Alexa region "${alexaRegion}": ${loadLambdaErr}`,
      });
    }
    currentRegionDeployState.lambda = lambdaData.lambda;
    currentRegionDeployState.iamRole = lambdaData.iamRole;
    // create/update deploy for IAM role
    const deployIAMConfig = {
      awsProfile,
      awsRegion,
      alexaRegion,
      skillName,
      deployState: currentRegionDeployState,
    };
    helper.deployIAMRole(reporter, deployIAMConfig, (iamErr, iamRoleArn) => {
      if (iamErr) {
        return callback(null, {
          isAllStepSuccess: false,
          isCodeDeployed: false,
          deployState: currentRegionDeployState,
          resultMessage: `The lambda deploy failed for Alexa region "${alexaRegion}": ${iamErr}`,
        });
      }
      currentRegionDeployState.iamRole = iamRoleArn;
      // create/update deploy for Lambda
      const deployLambdaConfig = {
        profile,
        awsProfile,
        alexaRegion,
        awsRegion,
        skillId,
        skillName,
        code,
        iamRoleArn,
        userConfig,
        deployState: currentRegionDeployState,
      };
      helper.deployLambdaFunction(reporter, deployLambdaConfig, (lambdaErr, lambdaResult) => {
        // 1.fatal error happens in Lambda deployment and nothing need to record additionally
        if (lambdaErr) {
          return callback(null, {
            isAllStepSuccess: false,
            isCodeDeployed: false,
            deployState: currentRegionDeployState,
            resultMessage: `The lambda deploy failed for Alexa region "${alexaRegion}": ${lambdaErr}`,
          });
        }
        const {isAllStepSuccess, isCodeDeployed, lambdaResponse = {}} = lambdaResult;
        currentRegionDeployState.lambda = lambdaResponse;
        const {arn} = lambdaResponse;
        // 2.full successs in Lambda deploy
        if (isAllStepSuccess) {
          return callback(null, {
            isAllStepSuccess,
            isCodeDeployed,
            deployState: currentRegionDeployState,
            endpoint: {uri: arn},
            resultMessage: `The lambda deploy succeeded for Alexa region "${alexaRegion}" with output Lambda ARN: ${arn}.`,
          });
        }
        // 3.partial success in Lambda deploy (like only LambdaCode is deployed)
        return callback(null, {
          isAllStepSuccess,
          isCodeDeployed,
          deployState: currentRegionDeployState,
          resultMessage: `The lambda deploy failed for Alexa region "${alexaRegion}": ${lambdaResult.resultMessage}`,
        });
      });
    });
  });
}
