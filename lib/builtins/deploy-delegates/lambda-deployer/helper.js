const async = require('async');
const fs = require('fs');
const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');
const IAMClient = require('@src/clients/aws-client/iam-client');
const LambdaClient = require('@src/clients/aws-client/lambda-client');
const Manifest = require('@src/model/manifest');
const ResourcesConfig = require('@src/model/resources-config');
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
                        revisionId: lambdaData.RevisionId
                    }
                });
            });
        });
    });
}

function _addEventPermissions(lambdaClient, skillId, functionArn, profile, callback) {
    const targetEndpoints = ResourcesConfig.getInstance().getTargetEndpoints(profile);
    // for backward compatibility, defaulting to api from skill manifest if targetEndpoints is not defined
    const domains = targetEndpoints.length ? targetEndpoints : Object.keys(Manifest.getInstance().getApis());
    async.forEach(domains, (domain, permCallback) => {
        lambdaClient.addAlexaPermissionByDomain(domain, skillId, functionArn, permCallback);
    }, (permErr) => {
        if (permErr) {
            return callback(permErr);
        }
        _waitForLambdaFunction(lambdaClient, functionArn, callback);
    });
}

function _updateLambdaFunction(reporter, lambdaClient, options, callback) {
    _updateLambdaFunctionCode(reporter, lambdaClient, options, (codeErr, codeData) => {
        if (codeErr) {
            return callback(codeErr);
        }

        _updateLambdaFunctionConfig(reporter, lambdaClient, codeData, (configErr, configData) => {
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

function _updateLambdaFunctionCode(reporter, lambdaClient, options, callback) {
    const { zipFilePath, deployState } = options;
    const zipFile = fs.readFileSync(zipFilePath);
    const functionName = deployState.lambda.arn;
    const { revisionId } = deployState.lambda;

    lambdaClient.updateFunctionCode(zipFile, functionName, revisionId, (err) => {
        if (err) {
            return callback(err);
        }

        reporter.updateStatus(`Update a lambda function code (${functionName}) in progress...`);

        _waitForLambdaFunction(lambdaClient, functionName, callback);
    });
}

function _updateLambdaFunctionConfig(reporter, lambdaClient, lambdaConfig, callback) {
    const { FunctionName: functionName, Runtime: runtime, Handler: handler, RevisionId: revisionId } = lambdaConfig;

    lambdaClient.updateFunctionConfiguration(functionName, runtime, handler, revisionId, (err) => {
        if (err) {
            return callback(err);
        }

        reporter.updateStatus(`Update a lambda function configuration (${functionName}) in progress...`);

        _waitForLambdaFunction(lambdaClient, functionName, callback);
    });
}

function _waitForLambdaFunction(lambdaClient, functionName, callback) {
    const retryConfig = {
        base: CONSTANTS.CONFIGURATION.RETRY.WAIT_LAMBDA_FUNCTION.BASE,
        factor: CONSTANTS.CONFIGURATION.RETRY.WAIT_LAMBDA_FUNCTION.FACTOR,
        maxRetry: CONSTANTS.CONFIGURATION.RETRY.WAIT_LAMBDA_FUNCTION.MAXRETRY
    };
    const retryCall = (loopCallback) => {
        lambdaClient.getFunction(functionName, (err, data) => {
            if (err) {
                return loopCallback(err);
            }
            loopCallback(null, data.Configuration);
        });
    };
    const shouldRetryCondition = (retryResponse) => retryResponse.State === CONSTANTS.LAMBDA.FUNCTION_STATE.PENDING
    || retryResponse.LastUpdateStatus === CONSTANTS.LAMBDA.LAST_UPDATE_STATUS.IN_PROGRESS;

    retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (retryErr, lambdaData) => {
        if (retryErr) {
            return callback(retryErr);
        }
        if (lambdaData.State !== CONSTANTS.LAMBDA.FUNCTION_STATE.ACTIVE) {
            return callback(`Function [${functionName}] state is ${lambdaData.State}.`);
        }
        if (lambdaData.LastUpdateStatus !== CONSTANTS.LAMBDA.LAST_UPDATE_STATUS.SUCCESSFUL) {
            return callback(`Function [${functionName}] last update status is ${lambdaData.LastUpdateStatus}.`);
        }
        callback(null, lambdaData);
    });
}
