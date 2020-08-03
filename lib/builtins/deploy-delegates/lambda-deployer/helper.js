const async = require('async');
const fs = require('fs');
const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');
const IAMClient = require('@src/clients/aws-client/iam-client');
const LambdaClient = require('@src/clients/aws-client/lambda-client');
const Manifest = require('@src/model/manifest');
const retryUtils = require('@src/utils/retry-utility');
const stringUtils = require('@src/utils/string-utils');

module.exports = {
    validateLambdaDeployState,
    deployIAMRole,
    deployLambdaFunction
};

function validateLambdaDeployState(reporter, awsProfile, awsRegion, currentRegionDeployState, ignoreHash, callback) {
    const lambdaData = currentRegionDeployState.lambda;
    if (R.isNil(lambdaData) || R.isEmpty(lambdaData) || R.isNil(lambdaData.arn)) {
        return callback(null, { updatedDeployState: currentRegionDeployState });
    }
    reporter.updateStatus('Validating the deploy state of existing Lambda function...');
    let updatedDeployState;
    const lambdaClient = new LambdaClient({ awsProfile, awsRegion });
    const lambdaArn = lambdaData.arn;
    lambdaClient.getFunction(lambdaArn, (err, data) => {
        if (err) {
            return callback(err);
        }
        // 1. check IAM role arn
        const localIAMRole = currentRegionDeployState.iamRole;
        const remoteIAMRole = data.Configuration.Role;
        if (stringUtils.isNonBlankString(localIAMRole) && !R.equals(localIAMRole, remoteIAMRole)) {
            return callback(`The IAM role for Lambda ARN (${lambdaArn}) should be ${remoteIAMRole}, but found ${localIAMRole}. \
Please solve this IAM role mismatch and re-deploy again. To ignore this error run "ask deploy --ignore-hash".`);
        }
        updatedDeployState = R.set(R.lensPath(['iamRole']), remoteIAMRole, currentRegionDeployState);
        // 2. check revision id
        const localRevisionId = lambdaData.revisionId;
        const remoteRevisionId = data.Configuration.RevisionId;
        if (stringUtils.isNonBlankString(localRevisionId) && !R.equals(localRevisionId, remoteRevisionId) && !ignoreHash) {
            return callback(`The current revisionId (The revision ID for Lambda ARN (${lambdaArn}) should be ${remoteRevisionId}, \
but found ${localRevisionId}. Please solve this revision mismatch and re-deploy again. \
To ignore this error run "ask deploy --ignore-hash".`);
        }
        updatedDeployState = R.set(R.lensPath(['lambda', 'revisionId']), remoteRevisionId, updatedDeployState);
        // 3. add lastModified
        const lastModified = data.Configuration.LastModified;
        updatedDeployState = R.set(R.lensPath(['lambda', 'lastModified']), lastModified, updatedDeployState);
        callback(null, { updatedDeployState });
    });
}

function deployIAMRole(reporter, awsProfile, alexaRegion, skillName, awsRegion, deployState, callback) {
    const iamClient = new IAMClient({ awsProfile, awsRegion });
    const roleArn = deployState.iamRole;
    if (R.isNil(roleArn) || R.isEmpty(roleArn)) {
        reporter.updateStatus('No IAM role exists. Creating an IAM role...');
        _createIAMRole(reporter, iamClient, skillName, (roleErr, iamRoleArn) => {
            if (roleErr) {
                return callback(roleErr);
            }
            callback(null, iamRoleArn);
        });
    } else {
        iamClient.getIAMRole(roleArn, (roleErr, roleData) => {
            if (roleErr) {
                if (roleErr.code === 'NoSuchEntity') {
                    callback(`The IAM role is not found. Please check if your IAM role from region ${alexaRegion} is valid.`);
                } else {
                    callback(roleErr);
                }
            } else {
                reporter.updateStatus(`Current IAM role : "${roleArn}"...`);
                callback(null, roleData.Role.Arn);
            }
        });
    }
}

function _createIAMRole(reporter, iamClient, skillName, callback) {
    iamClient.createBasicLambdaRole(skillName, (roleErr, roleData) => {
        if (roleErr) {
            return callback(roleErr);
        }
        const roleArn = roleData.Role.Arn;
        reporter.updateStatus(`Create Role (arn: ${roleArn}) in progress...`);
        iamClient.attachBasicLambdaRolePolicy(roleArn, (policyErr) => {
            if (policyErr) {
                return callback(policyErr);
            }
            callback(null, roleData.Role.Arn);
        });
    });
}

function deployLambdaFunction(reporter, options, callback) {
    const { profile, awsProfile, alexaRegion, awsRegion, skillId, skillName, code, iamRoleArn, userConfig, currentRegionDeployState } = options;
    const lambdaClient = new LambdaClient({ awsProfile, awsRegion });
    const zipFilePath = code.codeBuild;
    if (R.isNil(currentRegionDeployState.lambda) || R.isEmpty(currentRegionDeployState.lambda)) {
        reporter.updateStatus('No Lambda information exists. Creating a lambda function...');
        const createLambdaOptions = {
            profile,
            alexaRegion,
            skillId,
            skillName,
            iamRoleArn,
            zipFilePath,
            userConfig
        };
        _createLambdaFunction(reporter, lambdaClient, createLambdaOptions, (lambdaErr, lambdaResources) => {
            if (lambdaErr) {
                return callback(lambdaErr);
            }
            callback(null, lambdaResources);
        });
    } else {
        reporter.updateStatus(`Updating current Lambda function with ARN ${currentRegionDeployState.lambda.arn}...`);
        const updateLambdaOptions = {
            zipFilePath,
            userConfig,
            currentRegionDeployState
        };
        _updateLambdaFunction(reporter, lambdaClient, updateLambdaOptions, (lambdaErr, lambdaResources) => {
            if (lambdaErr) {
                return callback(lambdaErr);
            }
            callback(null, lambdaResources);
        });
    }
}

function _createLambdaFunction(reporter, lambdaClient, options, callback) {
    const { profile, alexaRegion, skillId, skillName, iamRoleArn, zipFilePath, userConfig } = options;
    const zipFile = fs.readFileSync(zipFilePath);
    const { runtime, handler } = userConfig;
    const retryConfig = {
        base: CONSTANTS.CONFIGURATION.RETRY.CREATE_LAMBDA_FUNCTION.BASE,
        factor: CONSTANTS.CONFIGURATION.RETRY.CREATE_LAMBDA_FUNCTION.FACTOR,
        maxRetry: CONSTANTS.CONFIGURATION.RETRY.CREATE_LAMBDA_FUNCTION.MAXRETRY
    };
    const RETRY_MESSAGE = 'The role defined for the function cannot be assumed by Lambda.';
    const retryCall = (loopCallback) => {
        // 1. Create a Lambda function
        lambdaClient.createLambdaFunction(skillName, profile, alexaRegion, iamRoleArn, zipFile, runtime, handler, (lambdaErr, lambdaData) => {
            if (lambdaErr) {
                // There may be a (small) window of time after creating IAM role and adding policies, the role will trigger the error
                // if creating lambda function during this timming. Thus, use retry to bypass this issue.
                if (lambdaErr.message === RETRY_MESSAGE) {
                    return loopCallback(null, RETRY_MESSAGE);
                }
                return loopCallback(lambdaErr);
            }
            loopCallback(null, lambdaData);
        });
    };
    const shouldRetryCondition = retryResponse => retryResponse === RETRY_MESSAGE;
    retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (retryErr, lambdaData) => {
        if (retryErr) {
            return callback(retryErr);
        }
        const arn = lambdaData.FunctionArn;
        // 2. Grant permissions to use a Lambda function
        _addEventPermissions(lambdaClient, skillId, arn, (addErr) => {
            if (addErr) {
                return callback(addErr);
            }
            // 3. Get the latest revisionId from getFunction API
            lambdaClient.getFunction(arn, (revisionErr, revisionData) => {
                if (revisionErr) {
                    return callback(revisionErr);
                }
                callback(null, {
                    isAllStepSuccess: true,
                    isCodeDeployed: true,
                    lambdaResponse: {
                        arn,
                        lastModified: lambdaData.LastModified,
                        revisionId: revisionData.Configuration.RevisionId
                    }
                });
            });
        });
    });
}

function _addEventPermissions(lambdaClient, skillId, functionArn, callback) {
    // TODO: to move Manifest outside the deployer logic
    const domainInfo = Manifest.getInstance().getApis();
    const domainList = R.keys(domainInfo);
    async.forEach(domainList, (domain, addCallback) => {
        lambdaClient.addAlexaPermissionByDomain(domain, skillId, functionArn, (err) => {
            if (err) {
                return addCallback(err);
            }
            addCallback();
        });
    }, (error) => {
        callback(error);
    });
}

function _updateLambdaFunction(reporter, lambdaClient, options, callback) {
    const { zipFilePath, userConfig, currentRegionDeployState } = options;
    const zipFile = fs.readFileSync(zipFilePath);
    const functionName = currentRegionDeployState.lambda.arn;
    let { revisionId } = currentRegionDeployState.lambda;
    lambdaClient.updateFunctionCode(zipFile, functionName, revisionId, (codeErr, codeData) => {
        if (codeErr) {
            return callback(codeErr);
        }
        reporter.updateStatus(`Update a lambda function (${functionName}) in progress...`);
        const { runtime } = userConfig;
        const { handler } = userConfig;
        revisionId = codeData.RevisionId;
        lambdaClient.updateFunctionConfiguration(functionName, runtime, handler, revisionId, (configErr, configData) => {
            if (configErr) {
                return callback(null, {
                    isAllStepSuccess: false,
                    isCodeDeployed: true,
                    lambdaResponse: {
                        arn: codeData.FunctionArn,
                        lastModified: codeData.LastModified,
                        revisionId: codeData.RevisionId
                    },
                    resultMessage: configErr
                });
            }
            callback(null, {
                isAllStepSuccess: true,
                isCodeDeployed: true,
                lambdaResponse: {
                    arn: configData.FunctionArn,
                    lastModified: configData.LastModified,
                    revisionId: configData.RevisionId
                }
            });
        });
    });
}
