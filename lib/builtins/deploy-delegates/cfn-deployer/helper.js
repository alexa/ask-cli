const R = require('ramda');
const fs = require('fs');

const CloudformationClient = require('@src/clients/aws-client/cloudformation-client');
const S3Client = require('@src/clients/aws-client/s3-client');
const stringUtils = require('@src/utils/string-utils');
const retryUtils = require('@src/utils/retry-utility');

const alexaAwsRegionMap = {
    default: 'us-east-1',
    NA: 'us-east-1',
    EU: 'eu-west-1',
    FE: 'us-west-2'
};

module.exports = {
    getAwsInformation,
    uploadArtifacts,
    deployStack,
};

function getAwsInformation(awsProfile, alexaRegion, userConfig, deployState) {
    let awsRegion = alexaRegion === 'default' ? userConfig.awsRegion
        : R.view(R.lensPath(['regionalOverrides', alexaRegion, 'awsRegion']), userConfig);
    awsRegion = awsRegion || alexaAwsRegionMap[alexaRegion];
    if (!stringUtils.isNonBlankString(awsRegion)) {
        throw `Unsupported Alexa region: ${alexaRegion}. Please check your region name or use "regionalOverrides" to specify AWS region.`;
    }

    const templatePath = R.view(R.lensPath(['regionalOverrides', alexaRegion, 'templatePath']), userConfig) || userConfig.templatePath;
    if (!stringUtils.isNonBlankString(templatePath)) {
        throw 'The template path in userConfig must be provided.';
    }

    const bucketName = R.view(R.lensPath(['s3', 'bucket']), deployState) || S3Client.generateBucketName(awsProfile, awsRegion);
    const bucketObjectVersion = R.view(R.lensPath(['s3', 'objectVersion']), deployState);

    return { awsRegion, templatePath, bucketName, bucketObjectVersion };
}

function uploadArtifacts(reporter, options, callback) {
    const { awsProfile, awsRegion, bucketName, bucketKey, bucketObjectVersion, artifactFilePath, isCodeModified } = options;
    if (isCodeModified === false) {
        reporter.updateStatus('No change on the code and skip the code s3 upload process.');
        return process.nextTick(() => {
            callback(null, { versionId: bucketObjectVersion });
        });
    }

    const s3Client = new S3Client({ awsProfile, awsRegion });
    reporter.updateStatus(`Uploading code artifact to s3://${bucketName}/${bucketKey}`);
    s3Client.provisionBucketAndPutObject(bucketName, bucketKey, awsRegion, artifactFilePath, (error, resp) => {
        callback(error, error ? null : { versionId: resp.VersionId });
    });
}

function deployStack(reporter, options, callback) {
    const {
        awsProfile, awsRegion, templatePath, skillId, stackName, stackId, lambdaRuntime, lambdaHandler, codeBucket, codeKey, codeVersion
    } = options;

    let templateContents, cloudformationClient;
    try {
        templateContents = fs.readFileSync(templatePath, 'utf-8');
        cloudformationClient = new CloudformationClient({ awsProfile, awsRegion });
    } catch (preErr) {
        return callback(preErr);
    }

    const stackOptions = {
        stackId,
        stackName,
        templateContents,
        stackParameters: [
            {
                ParameterKey: 'SkillId',
                ParameterValue: skillId
            },
            {
                ParameterKey: 'LambdaRuntime',
                ParameterValue: lambdaRuntime
            },
            {
                ParameterKey: 'LambdaHandler',
                ParameterValue: lambdaHandler
            },
            {
                ParameterKey: 'CodeBucket',
                ParameterValue: codeBucket
            },
            {
                ParameterKey: 'CodeKey',
                ParameterValue: codeKey
            },
            {
                ParameterKey: 'CodeVersion',
                ParameterValue: codeVersion
            }
        ]
    };
    _createOrUpdateStack(reporter, cloudformationClient, stackOptions)
        .then(ensuredStackId => {
            _pollingStackStatus(reporter, cloudformationClient, ensuredStackId, (getStackErr, stackResult) => {
                if (getStackErr) {
                    return callback(getStackErr);
                }
                const stackStatus = R.view(R.lensPath(['StackStatus']), stackResult);
                if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
                    _getEndpointOutput(stackResult, (endpointErr, endpointUri) => {
                        if (endpointErr) {
                            return callback(endpointErr);
                        }
                        callback(null, {
                            stackId: ensuredStackId,
                            endpointUri
                        });
                    });
                } else {
                    _getStackResourcesFailureReason(reporter, cloudformationClient, ensuredStackId, (resourcesErr, reasons) => {
                        if (resourcesErr) {
                            return callback(resourcesErr);
                        }
                        callback(null, {
                            stackId: ensuredStackId,
                            reasons
                        });
                    });
                }
            });
        })
        .catch(callback);
}

async function _createOrUpdateStack(reporter, cloudformationClient, options) {
    const {
        stackId,
        stackName,
        templateContents,
        stackParameters
    } = options;
    const exists = await cloudformationClient.stackExists(stackId);
    if (!exists) {
        reporter.updateStatus(`No stack exists or stack has been deleted. Creating cloudformation stack "${stackName}"...`);
        const { StackId } = await cloudformationClient.createStack(stackName, templateContents, stackParameters);
        reporter.updateStatus(`Create stack (id: ${StackId}) in progress...`);
        return StackId;
    }
    reporter.updateStatus(`Updating stack (${stackId})...`);
    await cloudformationClient.updateStack(stackId, templateContents, stackParameters);
    return stackId;
}

function _pollingStackStatus(reporter, cloudformationClient, stackId, callback) {
    const retryConfig = {
        base: 2000,
        factor: 1.1,
        maxRetry: 50
    };
    const retryCall = (loopCallback) => {
        cloudformationClient.describeStack(stackId, (stackErr, stackResponse) => {
            if (stackErr) {
                return loopCallback(stackErr);
            }
            const stackStatus = R.view(R.lensPath(['StackStatus']), stackResponse);
            const statusReason = R.view(R.lensPath(['StackStatusReason']), stackResponse);
            const reasonMsg = statusReason ? `Status reason: ${statusReason}.` : '';
            reporter.updateStatus(`Current stack status: ${stackStatus}... ${reasonMsg}`);
            loopCallback(null, stackResponse);
        });
    };
    const shouldRetryCondition = retryResponse => !retryResponse || retryResponse.StackStatus.endsWith('IN_PROGRESS');
    retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
}

function _getEndpointOutput(resp, callback) {
    const endpoint = resp.Outputs.filter(output => output.OutputKey === 'SkillEndpoint');
    if (!endpoint[0] || !endpoint[0].OutputValue) {
        return callback('No "SkillEndpoint" result returned in the stack outputs. '
            + 'Make sure you have a "SkillEndpoint" output in your template which points to the endpoint URL.');
    }
    callback(null, endpoint[0].OutputValue);
}

function _getStackResourcesFailureReason(reporter, cloudformationClient, stackId, callback) {
    const errorsList = [];
    reporter.updateStatus('Checking the failure details for the stack resources...');
    cloudformationClient.describeStackResources(stackId, (err, stackResources) => {
        if (err) {
            return callback(err);
        }
        stackResources.forEach((stackResource) => {
            if (stackResource.ResourceStatus.endsWith('_FAILED')) {
                errorsList.push({
                    logicalId: stackResource.LogicalResourceId,
                    resourceType: stackResource.ResourceType,
                    resourceStatus: stackResource.ResourceStatus,
                    reason: stackResource.ResourceStatusReason
                });
            }
            if (stackResource.ResourceStatus === 'DELETE_COMPLETE') {
                errorsList.push({
                    logicalId: stackResource.LogicalResourceId,
                    resourceType: stackResource.ResourceType,
                    resourceStatus: stackResource.ResourceStatus,
                    reason: `Resource deleted. For detailed reasoning, \
please check the "events" tab in the AWS console for CloudFormation stackId (${stackId}).`
                });
            }
        });
        callback(null, errorsList);
    });
}
