const aws = require('aws-sdk');

const stringUtils = require('@src/utils/string-utils');
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
     * @param {string} role The Amazon Resource Name (ARN) of the function's execution role.
     * @param {Buffer} zipFile The base64-encoded contents of the deployment package.
     * @param {string} runtime The identifier of the function's runtime.
     * @param {string} handler The name of the method within your code that Lambda calls to execute your function.
     * @param {callback} callback { error, response }
     */
    createLambdaFunction(skillName, profile, alexaRegion, role, zipFile, runtime, handler, callback) {
        const params = {
            Code: {
                ZipFile: zipFile
            },
            Role: role,
            Runtime: runtime,
            Handler: handler,
            FunctionName: this._generateFunctionName(skillName, profile, alexaRegion)
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
     * @param {string} functionArn The name of the Lambda function.
     * @param {callback} callback { error, response }
     */
    addAlexaPermissionByDomain(domain, skillId, functionArn, callback) {
        const params = this._getDomainPermission(domain);
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
     * @param {string} functionName The name of the Lambda function.
     * @param {string} revisionId Only update the function if the revision ID matches the ID that's specified.
     * @param {callback} callback { error, response }
     */
    updateFunctionCode(zipFile, functionName, revisionId, callback) {
        const codeUpdateParams = {
            ZipFile: zipFile,
            FunctionName: functionName,
            RevisionId: revisionId
        };
        this.client.updateFunctionCode(codeUpdateParams, (err, data) => {
            callback(err, !err ? data : null);
        });
    }

    /**
     * Wrapper of aws sdk api
     * Modifies the version-specific settings of a Lambda function.
     * @param {string} functionName The name of the Lambda function.
     * @param {string} runtime The identifier of the function's runtime.
     * @param {string} handler The name of the method within your code that Lambda calls to execute your function.
     * @param {string} revisionId Only update the function if the revision ID matches the ID that's specified.
     * @param {callback} callback { error, response }
     */
    updateFunctionConfiguration(functionName, runtime, handler, revisionId, callback) {
        const configurationUpdateParams = {
            FunctionName: functionName,
            Runtime: runtime,
            Handler: handler,
            RevisionId: revisionId
        };
        this.client.updateFunctionConfiguration(configurationUpdateParams, (err, data) => {
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

    /**
     * Generates a valid Lambda function name.
     * a lambda function name should follow the pattern: ask-skillName-profileName-alexaRegion-timeStamp
     * a valid function name cannot longer than 64 characters, so cli fixes the project name no longer than 22 characters
     * @param {String} skillName
     * @param {String} awsProfile
     */
    _generateFunctionName(skillName, profile, alexaRegion) {
        const validSkillName = stringUtils.filterNonAlphanumeric(skillName.toLowerCase()).substring(0, 22);
        const validProfile = stringUtils.filterNonAlphanumeric(profile.toLowerCase());
        const shortRegionName = alexaRegion.replace(/-/g, '');
        return `ask-${validSkillName}-${validProfile}-${shortRegionName}-${Date.now()}`;
    }
};
