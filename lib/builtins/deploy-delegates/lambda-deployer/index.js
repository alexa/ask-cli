const R = require('ramda');

const awsUtil = require('@src/clients/aws-client/aws-util');
const stringUtils = require('@src/utils/string-utils');
const helper = require('./helper');

const alexaAwsRegionMap = {
    default: 'us-east-1',
    NA: 'us-east-1',
    EU: 'eu-west-1',
    FE: 'ap-northeast-1'
};

module.exports = {
    bootstrap,
    invoke
};

/**
 * Bootstrap ask-cli resources config with initial configuration.
 * @param {Object} options
 * @param {Function} callback
 */
function bootstrap(options, callback) {
    const { profile, userConfig } = options;
    const awsProfile = awsUtil.getAWSProfile(profile);
    const awsDefaultRegion = awsUtil.getCLICompatibleDefaultRegion(awsProfile);
    const updatedUserConfig = R.set(R.lensPath(['awsRegion']), awsDefaultRegion, userConfig);
    callback(null, { userConfig: updatedUserConfig });
}

/**
 * Invoke the actual deploy logic for skill's infrastructure
 * @param {Object} reporter upstream CLI status reporter
 * @param {Object} options
 * @param {Function} callback
 */
function invoke(reporter, options, callback) {
    const { profile, alexaRegion, skillId, skillName, code, userConfig, deployState = {} } = options;
    const awsProfile = awsUtil.getAWSProfile(profile);
    if (!stringUtils.isNonBlankString(awsProfile)) {
        return callback(`Profile [${profile}] doesn't have AWS profile linked to it. Please run "ask configure" to re-configure your porfile.`);
    }
    let currentRegionDeployState = deployState[alexaRegion];
    if (!currentRegionDeployState) {
        currentRegionDeployState = {};
        deployState[alexaRegion] = currentRegionDeployState;
    }
    let awsRegion = alexaRegion === 'default' ? userConfig.awsRegion
        : R.view(R.lensPath(['regionalOverrides', alexaRegion, 'awsRegion']), userConfig);
    awsRegion = awsRegion || alexaAwsRegionMap[alexaRegion];
    if (!stringUtils.isNonBlankString(awsRegion)) {
        return callback(`Unsupported Alexa region: ${alexaRegion}. Please check your region name or use "regionalOverrides" to specify AWS region.`);
    }

    helper.validateLambdaDeployState(reporter, awsProfile, awsRegion, currentRegionDeployState, (validationErr, validationData) => {
        if (validationErr) {
            return callback(validationErr);
        }
        currentRegionDeployState = validationData.updatedDeployState;
        helper.deployIAMRole(reporter, awsProfile, alexaRegion, skillName, awsRegion, currentRegionDeployState, (iamErr, iamRoleArn) => {
            if (iamErr) {
                return callback(iamErr);
            }
            deployState[alexaRegion].iamRole = iamRoleArn;
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
                currentRegionDeployState
            };
            helper.deployLambdaFunction(reporter, deployLambdaConfig, (lambdaErr, lambdaResult) => {
                if (lambdaErr) {
                    const errMessage = `The lambda deploy failed for Alexa region "${alexaRegion}": ${lambdaErr}`;
                    const reasons = [errMessage];
                    return callback(null, {
                        reasons,
                        message: errMessage,
                        deployState: deployState[alexaRegion]
                    });
                }
                const { arn, lastModified, revisionId } = lambdaResult;
                deployState[alexaRegion].lambda = {
                    arn,
                    lastModified,
                    revisionId
                };
                return callback(null, {
                    endpoint: { uri: arn },
                    message: `The lambda deploy succeeded for Alexa region "${alexaRegion}" with output Lambda ARN: ${arn}.`,
                    deployState: deployState[alexaRegion]
                });
            });
        });
    });
}
