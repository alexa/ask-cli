const path = require('path');
const fs = require('fs');
const R = require('ramda');

const awsUtil = require('@src/clients/aws-client/aws-util');
const CliCFNDeployerError = require('@src/exceptions/cli-cfn-deployer-error');
const Helper = require('./helper');

const SKILL_STACK_PUBLIC_FILE_NAME = 'skill-stack.yaml';
const SKILL_STACK_ASSET_FILE_NAME = 'basic-lambda.yaml';

const alexaAwsRegionMap = {
    default: 'us-east-1',
    NA: 'us-east-1',
    EU: 'eu-west-1',
    FE: 'us-west-2'
};

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
        userConfig.templatePath = `./${path.posix.join('infrastructure', path.basename(workspacePath), SKILL_STACK_PUBLIC_FILE_NAME)}`;
        updatedUserConfig = R.set(R.lensPath(['awsRegion']), awsDefaultRegion, userConfig);
    } catch (e) {
        return callback(e.message);
    }
    callback(null, { userConfig: updatedUserConfig });
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
    const { alexaRegion, deployState = {} } = options;
    deployState[alexaRegion] = deployState[alexaRegion] || {};
    const deployProgress = {
        isAllStepSuccess: false,
        isCodeDeployed: false,
        deployState: deployState[alexaRegion]
    };

    try {
        await _deploy(reporter, options, deployProgress);
        deployProgress.resultMessage = _makeSuccessMessage(deployProgress.endpoint.uri, alexaRegion);
        callback(null, deployProgress);
    } catch (err) {
        deployProgress.resultMessage = _makeErrorMessage(err, alexaRegion);
        callback(null, deployProgress);
    }
}

async function _deploy(reporter, options, deployProgress) {
    const { profile, alexaRegion, skillId, skillName, code, userConfig } = options;

    let { stackId } = deployProgress.deployState;
    const awsProfile = _getAwsProfile(profile);
    const awsRegion = _getAwsRegion(alexaRegion, userConfig);
    const templateBody = _getTemplateBody(alexaRegion, userConfig);
    const userDefinedParameters = _getUserDefinedParameters(alexaRegion, userConfig);
    const bucketName = _getS3BucketName(alexaRegion, userConfig, deployProgress.deployState[alexaRegion], awsProfile, awsRegion);
    const bucketKey = _getS3BucketKey(alexaRegion, userConfig, code.codeBuild);
    const stackName = `ask-${skillName}-${alexaRegion}-skillStack-${Date.now()}`;

    const helper = new Helper(awsProfile, awsRegion, reporter);

    // s3 upload
    await helper.createS3BucketIfNotExists(bucketName);
    await helper.enableS3BucketVersioningIfNotEnabled(bucketName);
    const uploadResult = await helper.uploadToS3(bucketName, bucketKey, code.codeBuild);

    deployProgress.deployState.s3 = {
        bucket: bucketName,
        key: bucketKey
    };

    deployProgress.isCodeDeployed = true;

    // cf deploy
    const codeVersion = uploadResult.VersionId;
    const stackParameters = _mapStackParameters(skillId, userConfig, { bucketName, bucketKey, codeVersion }, userDefinedParameters);
    const capabilities = _getCapabilities(alexaRegion, userConfig);

    const deployRequest = await helper.deployStack(stackId, stackName, templateBody, stackParameters, capabilities);
    stackId = deployRequest.StackId;
    const deployResult = await helper.waitForStackDeploy(stackId, reporter);

    deployProgress.deployState.stackId = stackId;
    deployProgress.deployState.outputs = deployResult.stackInfo.Outputs;
    deployProgress.endpoint = { uri: deployResult.endpointUri };
    deployProgress.isAllStepSuccess = true;
    return deployResult;
}

function _getAwsProfile(profile) {
    const awsProfile = awsUtil.getAWSProfile(profile);
    if (!awsProfile) {
        throw new CliCFNDeployerError(`Profile [${profile}] doesn't have AWS profile linked to it. `
            + 'Please run "ask configure" to re-configure your profile.');
    }
    return awsProfile;
}

function _getAwsRegion(alexaRegion, userConfig) {
    let awsRegion = alexaRegion === 'default' ? userConfig.awsRegion
        : R.path(['regionalOverrides', alexaRegion, 'awsRegion'], userConfig);
    awsRegion = awsRegion || alexaAwsRegionMap[alexaRegion];

    if (!awsRegion) {
        throw new CliCFNDeployerError(`Unsupported Alexa region: ${alexaRegion}. `
        + 'Please check your region name or use "regionalOverrides" to specify AWS region.');
    }
    return awsRegion;
}

function _getS3BucketName(alexaRegion, userConfig, currentRegionDeployState, awsProfile, awsRegion) {
    const customValue = R.path(['regionalOverrides', alexaRegion, 'artifactsS3', 'bucketName'], userConfig)
    || R.path(['artifactsS3', 'bucketName'], userConfig);

    if (customValue) return customValue;

    function generateBucketName() {
        const projectName = path.basename(process.cwd());
        const validProjectName = projectName.toLowerCase().replace(/[^a-z0-9-.]+/g, '').substring(0, 22);
        const validProfile = awsProfile.toLowerCase().replace(/[^a-z0-9-.]+/g, '').substring(0, 9);
        const shortRegionName = awsRegion.replace(/-/g, '');
        return `ask-${validProjectName}-${validProfile}-${shortRegionName}-${Date.now()}`;
    }

    return R.path(['s3', 'bucket'], currentRegionDeployState) || generateBucketName();
}

function _getS3BucketKey(alexaRegion, userConfig, codeBuild) {
    const customValue = R.path(['regionalOverrides', alexaRegion, 'artifactsS3', 'bucketKey'], userConfig)
    || R.path(['artifactsS3', 'bucketKey'], userConfig);

    if (customValue) return customValue;

    return `endpoint/${path.basename(codeBuild)}`;
}

function _getCapabilities(alexaRegion, userConfig) {
    let capabilities = R.path(['regionalOverrides', alexaRegion, 'cfn', 'capabilities'], userConfig)
    || R.path(['cfn', 'capabilities'], userConfig);
    capabilities = new Set(capabilities || []);
    capabilities.add('CAPABILITY_IAM');

    return Array.from(capabilities);
}

function _getUserDefinedParameters(alexaRegion, userConfig) {
    const reservedParameters = {
        SkillId: 'Please use a different name.',
        LambdaRuntime: 'Please specify under skillInfrastructure.userConfig.runtime.',
        LambdaHandler: 'Please specify under skillInfrastructure.userConfig.handler.',
        CodeBucket: 'Please specify under skillInfrastructure.userConfig.artifactsS3.bucketName.',
        CodeKey: 'Please specify under skillInfrastructure.userConfig.artifactsS3.bucketKey.',
        CodeVersion: 'Please use a different name.'
    };

    const reservedParametersKeys = new Set(Object.keys(reservedParameters));

    let parameters = R.path(['regionalOverrides', alexaRegion, 'cfn', 'parameters'], userConfig)
        || R.path(['cfn', 'parameters'], userConfig);

    parameters = parameters || [];

    Object.keys(parameters).forEach(key => {
        if (reservedParametersKeys.has(key)) {
            const message = reservedParameters[key];
            throw new CliCFNDeployerError(`Cloud Formation parameter "${key}" is reserved. ${message}`);
        }
    });

    return parameters;
}

function _getTemplateBody(alexaRegion, userConfig) {
    const templatePath = R.path(['regionalOverrides', alexaRegion, 'templatePath'], userConfig) || userConfig.templatePath;
    if (!templatePath) {
        throw new CliCFNDeployerError('The template path in userConfig must be provided.');
    }
    return fs.readFileSync(templatePath, 'utf-8');
}

function _makeSuccessMessage(endpointUri, alexaRegion) {
    return `The CloudFormation deploy succeeded for Alexa region "${alexaRegion}" with output Lambda ARN: ${endpointUri}.`;
}

function _makeErrorMessage(error, alexaRegion) {
    return `The CloudFormation deploy failed for Alexa region "${alexaRegion}": ${error.message}`;
}

function _mapStackParameters(skillId, userConfig, s3Artifact, userDefinedParameters) {
    const parameters = [
        {
            ParameterKey: 'SkillId',
            ParameterValue: skillId
        },
        {
            ParameterKey: 'LambdaRuntime',
            ParameterValue: userConfig.runtime
        },
        {
            ParameterKey: 'LambdaHandler',
            ParameterValue: userConfig.handler
        },
        {
            ParameterKey: 'CodeBucket',
            ParameterValue: s3Artifact.bucketName
        },
        {
            ParameterKey: 'CodeKey',
            ParameterValue: s3Artifact.bucketKey
        },
        {
            ParameterKey: 'CodeVersion',
            ParameterValue: s3Artifact.codeVersion
        }
    ];

    Object.keys(userDefinedParameters).forEach(key => {
        const parameter = {
            ParameterKey: key,
            ParameterValue: userDefinedParameters[key]
        };
        parameters.push(parameter);
    });

    return parameters;
}
