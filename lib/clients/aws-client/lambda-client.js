const aws = require('aws-sdk');

const AbstractAwsClient = require('./abstract-aws-client');

/**
 * Class for Lambda Client
 */
module.exports = class LambdaClient extends AbstractAwsClient {
    constructor(configuration) {
        super(configuration);
        this.client = new aws.Lambda();
    }

    /**
     * Wrapper of aws sdk api
     * Creates a Lambda function
     * @param {string} functionName The name of the Lambda function.
     * @param {object} config The configuration of the Lambda function.
     * @param {string} role The Amazon Resource Name (ARN) of the function's execution role.
     * @param {Buffer} zipFile The base64-encoded contents of the deployment package.
     * @param {callback} callback { error, response }
     */
    createLambdaFunction(functionName, config, role, zipFile, callback) {
        const { runtime, handler, description, memorySize, timeout, environmentVariables } = config;
        const params = {
            Code: {
                ZipFile: zipFile
            },
            FunctionName: functionName,
            Role: role,
            Runtime: runtime,
            Handler: handler,
            Description: description,
            MemorySize: memorySize,
            Timeout: timeout,
            Environment: {
                Variables: environmentVariables
            }
        };
        this.client.createFunction(params, (err, data) => {
            callback(err, !err ? data : null);
        });
    }

    /**
     * Wrapper of aws sdk api
     * Grants an AWS service or another account permission to use a function.
     * @param {string} domain The type of skill.
     * @param {string} skillId The skill ID is used as a token that must be supplied by the invoker.
     * @param {string} functionArn The arn of the Lambda function.
     * @param {callback} callback { error, response }
     */
    addAlexaPermissionByDomain(domain, skillId, functionArn, callback) {
        const params = this._getDomainPermission(domain);
        if (!params) return callback();

        params.FunctionName = functionArn;
        params.EventSourceToken = skillId;
        this.client.addPermission(params, (err, data) => {
            callback(err, !err ? data : null);
        });
    }

    /**
     * Wrapper of aws sdk api
     * Returns information about the function or function version
     * @param {string} functionArn The name of the Lambda function
     * @param {callback} callback  { error, response }
     */
    getFunction(functionArn, callback) {
        const params = {
            FunctionName: functionArn
        };
        this.client.getFunction(params, (err, data) => {
            callback(err, !err ? data : null);
        });
    }

    /**
     * Wrapper of aws sdk api
     * Updates a Lambda function's code.
     * @param {Buffer} zipFile The base64-encoded contents of the deployment package.
     * @param {string} functionArn The arn of the Lambda function.
     * @param {string} revisionId Only update the function if the revision ID matches the ID that's specified.
     * @param {callback} callback { error, response }
     */
    updateFunctionCode(zipFile, functionArn, revisionId, callback) {
        const codeUpdateParams = {
            ZipFile: zipFile,
            FunctionName: functionArn,
            RevisionId: revisionId
        };
        this.client.updateFunctionCode(codeUpdateParams, (err, data) => {
            callback(err, !err ? data : null);
        });
    }

    /**
     * Wrapper of aws sdk api
     * Modifies the version-specific settings of a Lambda function.
     * @param {string} functionArn The arn of the Lambda function.
     * @param {object} config The configuration of the Lambda function.
     * @param {string} revisionId Only update the function if the revision ID matches the ID that's specified.
     * @param {callback} callback { error, response }
     */
    updateFunctionConfiguration(functionArn, config, revisionId, callback) {
        const { runtime, handler, description, memorySize, timeout, environmentVariables } = config;
        const params = {
            FunctionName: functionArn,
            Runtime: runtime,
            Handler: handler,
            Description: description,
            MemorySize: memorySize,
            Timeout: timeout,
            Environment: {
                Variables: environmentVariables
            },
            RevisionId: revisionId
        };
        this.client.updateFunctionConfiguration(params, (err, data) => {
            callback(err, !err ? data : null);
        });
    }

    /**
     * Gets a permission configuration by skill domain.
     * @param {string} domain skill domain
     */
    _getDomainPermission(domain) {
        let permission;
        switch (domain) {
        case 'smartHome':
        case 'video':
            permission = {
                Action: 'lambda:InvokeFunction',
                StatementId: Date.now().toString(),
                Principal: 'alexa-connectedhome.amazon.com'
            };
            break;
        case 'custom':
        case 'houseHoldList':
        case 'music':
            permission = {
                Action: 'lambda:InvokeFunction',
                StatementId: Date.now().toString(),
                Principal: 'alexa-appkit.amazon.com'
            };
            break;
        default:
        }
        return permission;
    }
};
