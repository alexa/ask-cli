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
    loadLambdaInformation,
    deployIAMRole,
    deployLambdaFunction
};

// TODO: use Error class
function loadLambdaInformation(reporter, loadLambdaConfig, callback) {
    const { awsProfile, awsRegion, alexaRegion, deployState, userConfig, ignoreHash } = loadLambdaConfig;
    const lambdaClient = new LambdaClient({ awsProfile, awsRegion });
    // check if user sets userConfig with "sourceLambda" field to reuse existing Lambda
    const sourceLambdaArn = alexaRegion === 'default' ? R.path(['sourceLambda', 'arn'], userConfig)
        : R.path(['regionalOverrides', alexaRegion, 'sourceLambda', 'arn'], userConfig);
    if (stringUtils.isNonBlankString(sourceLambdaArn)) {
        return _loadLambdaFromUserConfigSource(reporter, lambdaClient, sourceLambdaArn, (loadErr, sourceLambdaData) => {
            callback(loadErr, loadErr ? undefined : sourceLambdaData);
        });
    }

    // Lambda does not exist in deployState
    const lambdaArn = R.path(['lambda', 'arn'], deployState);
    if (R.isNil(lambdaArn)) {
        return callback(null, {});
    }

    // Lambda exists, validate the deploy states
    reporter.updateStatus('Validating the deploy state of existing Lambda function...');
    lambdaClient.getFunction(lambdaArn, (err, data) => {
        if (err) {
            return callback(err);
        }
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
                lastModified: data.Configuration.LastModified
            }
        });
    });
}

function _loadLambdaFromUserConfigSource(reporter, lambdaClient, sourceLambdaArn, callback) {
    lambdaClient.getFunction(sourceLambdaArn, (err, data) => {
        if (err) {
            return callback(`Failed to load the Lambda (${sourceLambdaArn}) specified in "sourceLambda". ${err}`);
        }
        const iamRole = data.Configuration.Role;
        const lambda = {
            arn: sourceLambdaArn,
            revisionId: data.Configuration.RevisionId,
            lastModified: data.Configuration.LastModified
        };
        callback(undefined, { iamRole, lambda });
    });
}

function deployIAMRole(reporter, deployIAMConfig, callback) {
    const { awsProfile, alexaRegion, skillName, awsRegion, deployState } = deployIAMConfig;
    const iamClient = new IAMClient({ awsProfile, awsRegion });
    const roleArn = deployState.iamRole;
    if (R.isNil(roleArn) || R.isEmpty(roleArn)) {
        reporter.updateStatus('No IAM role exists. Creating an IAM role...');
        _createIAMRole(reporter, iamClient, skillName, (roleErr, iamRoleArn) => {
            if (roleErr) {
                return callback(`Failed to create IAM role before deploying Lambda. ${roleErr}`);
            }
            callback(null, iamRoleArn);
        });
    } else {
        iamClient.getIAMRole(roleArn, (roleErr, roleData) => {
            if (roleErr) {
                if (roleErr.code === 'NoSuchEntity') {
                    callback(`The IAM role is not found. Please check if your IAM role from region ${alexaRegion} is valid.`);
                } else {
                    callback(`Failed to retrieve IAM role (${roleArn}) for Lambda. ${roleErr}`);
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
    const { profile, awsProfile, alexaRegion, awsRegion, skillId, skillName, code, iamRoleArn, userConfig, deployState } = options;
    const lambdaClient = new LambdaClient({ awsProfile, awsRegion });
    const zipFilePath = code.codeBuild;
    if (R.isNil(deployState.lambda) || R.isEmpty(deployState.lambda)) {
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
        reporter.updateStatus(`Updating current Lambda function with ARN ${deployState.lambda.arn}...`);
        const updateLambdaOptions = {
            zipFilePath,
            userConfig,
            deployState
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
    const { zipFilePath, userConfig, deployState } = options;
    const zipFile = fs.readFileSync(zipFilePath);
    const functionName = deployState.lambda.arn;
    let { revisionId } = deployState.lambda;
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
