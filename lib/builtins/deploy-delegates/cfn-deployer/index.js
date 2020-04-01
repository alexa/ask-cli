const path = require('path');
const fs = require('fs');
const R = require('ramda');

const awsUtil = require('@src/clients/aws-client/aws-util');
const helper = require('./helper');

const SKILL_STACK_PUBLIC_FILE_NAME = 'skill-stack.yaml';
const SKILL_STACK_ASSET_FILE_NAME = 'basic-lambda.yaml';

module.exports = {
    bootstrap,
    invoke
};

/**
 * Bootstrap ask-cli resources config with initial state and examples.
 * @param {Object} options
 * @param {Function} callback
 */
function bootstrap(options, callback) {
    const { profile, userConfig, workspacePath } = options;
    const templateLocation = path.join(workspacePath, SKILL_STACK_PUBLIC_FILE_NAME);
    let updatedUserConfig;
    try {
        const templateContent = fs.readFileSync(path.join(__dirname, 'assets', SKILL_STACK_ASSET_FILE_NAME), 'utf-8');
        const awsProfile = awsUtil.getAWSProfile(profile);
        const awsDefaultRegion = awsUtil.getCLICompatibleDefaultRegion(awsProfile);
        fs.writeFileSync(templateLocation, templateContent);
        userConfig.templatePath = `.${path.sep}${path.join('infrastructure', path.basename(workspacePath), SKILL_STACK_PUBLIC_FILE_NAME)}`;
        updatedUserConfig = R.set(R.lensPath(['awsRegion']), awsDefaultRegion, userConfig);
    } catch (e) {
        return callback(e.message);
    }
    callback(null, { userConfig: updatedUserConfig });
}

/**
 * Invoke the actual deploy logic for skill's infrastructures
 * @param {Object} reporter upstream CLI status reporter
 * @param {Object} options
 * @param {Function} callback
 */
function invoke(reporter, options, callback) {
    const { profile, alexaRegion, skillId, skillName, code, userConfig, deployState = {} } = options;
    const awsProfile = awsUtil.getAWSProfile(profile);
    if (!awsProfile) {
        return callback(`Profile [${profile}] doesn't have AWS profile linked to it. Please run "ask configure" to re-configure your porfile.`);
    }

    let currentRegionDeployState = deployState[alexaRegion];
    if (!currentRegionDeployState) {
        currentRegionDeployState = {};
        deployState[alexaRegion] = currentRegionDeployState;
    }

    let uploadArtifactsConfig, deployStackConfig;
    try {
        const { awsRegion, templatePath, bucketName, bucketObjectVersion } = helper
            .getAwsInformation(awsProfile, alexaRegion, userConfig, currentRegionDeployState);
        const bucketKey = `endpoint/${path.basename(code.codeBuild)}`;
        uploadArtifactsConfig = {
            awsProfile,
            awsRegion,
            bucketName,
            bucketKey,
            bucketObjectVersion,
            artifactFilePath: code.codeBuild,
            isCodeModified: code.isCodeModified
        };
        deployStackConfig = {
            awsProfile,
            awsRegion,
            templatePath,
            skillId,
            stackName: `ask-${skillName}-${alexaRegion}-skillStack-${Date.now()}`,
            stackId: currentRegionDeployState.stackId,
            lambdaRuntime: userConfig.runtime,
            lambdaHandler: userConfig.handler,
            codeBucket: bucketName,
            codeKey: bucketKey,
            codeVersion: null
        };
    } catch (getAwsInfoErr) {
        return callback(_composeErrorMessage(getAwsInfoErr, alexaRegion));
    }

    helper.uploadArtifacts(reporter, uploadArtifactsConfig, (uploadErr, uploadResult) => {
        if (uploadErr) {
            return callback(_composeErrorMessage(uploadErr, alexaRegion));
        }
        deployState[alexaRegion].s3 = {
            bucket: deployStackConfig.codeBucket,
            key: deployStackConfig.codeKey,
            objectVersion: uploadResult.versionId
        };
        deployStackConfig.codeVersion = uploadResult.versionId;
        helper.deployStack(reporter, deployStackConfig, (deployErr, deployResult) => {
            if (deployErr) {
                return callback(_composeErrorMessage(deployErr, alexaRegion));
            }
            const { stackId, endpointUri, reasons } = deployResult;
            if (!reasons || reasons === []) {
                deployState[alexaRegion].stackId = stackId;
                const invokeResponse = {
                    endpoint: { uri: endpointUri },
                    message: _composeSuccessMessage(endpointUri, alexaRegion),
                    deployState: deployState[alexaRegion]
                };
                return callback(null, invokeResponse);
            }

            callback(null, {
                reasons,
                message: _composeErrorMessage(reasons, alexaRegion),
                deployState: deployState[alexaRegion]
            });
        });
    });
}

/**
 * Compile the success message from the deploy result
 * @param {String} endpointUri
 * @param {String} alexaRegion
 */
function _composeSuccessMessage(endpointUri, alexaRegion) {
    return `The CloudFormation deploy succeeded for Alexa region "${alexaRegion}" with output Lambda ARN: ${endpointUri}.`;
}

/**
 * Come up with the error message for a certain Alexa region. Deal with both array of failure reasons or just string value.
 * @param {Array|String} failureReason Accept either a string or an array of reason messages
 * @param {String} alexaRegion
 */
function _composeErrorMessage(failureReason, alexaRegion) {
    if (Array.isArray(failureReason)) {
        const generateErrorString = (reasonObj) => {
            const { logicalId, resourceType, resourceStatus, reason } = reasonObj;
            return `${logicalId}[${resourceType}]  ${resourceStatus}(${reason})`;
        };

        let failReasonMsg;
        if (failureReason.length === 1) {
            failReasonMsg = `The CloudFormation deploy failed for Alexa region "${alexaRegion}": ${generateErrorString(failureReason[0])}.`;
        } else {
            failReasonMsg = `The CloudFormation deploy failed for Alexa region "${alexaRegion}" for the reasons: `;
            failureReason.forEach((reason) => {
                failReasonMsg += `\n   ${generateErrorString(reason)}`;
            });
        }
        return failReasonMsg;
    }

    // failureReason is not a collection
    return `The CloudFormation deploy failed for Alexa region "${alexaRegion}": ${failureReason}`;
}
