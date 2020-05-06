const aws = require('aws-sdk');
const R = require('ramda');
const stringUtils = require('@src/utils/string-utils');
const AbstractAwsClient = require('./abstract-aws-client');

/**
 * Class for AWS Cloudformation Client
 */
module.exports = class CloudformationClient extends AbstractAwsClient {
    constructor(configuration) {
        super(configuration);
        this.client = new aws.CloudFormation();
    }

    /**
     * Create a stack based on the parameters.
     * @param {String} stackName        The name for the stack
     * @param {String} templateFile     Template file's buffer (No bigger then 51200bytes)
     * @param {Array} parameters        Array of object that contains the input parameters
     * @param {Function} callback       return the stackId
     */
    createStack(stackName, templateFile, parameters, callback) {
        const params = {
            StackName: stackName,
            Capabilities: ['CAPABILITY_IAM'],
            TemplateBody: templateFile
        };
        if (parameters && !R.isEmpty(parameters)) {
            params.Parameters = parameters;
        }
        this.client.createStack(params, (err, response) => {
            callback(err, !err ? response.StackId : null);
        });
    }

    /**
     * Update the stack based on the stackName with input parameters.
     * @param {String} stackName        The name for the stack
     * @param {String} templateFile     Template file's buffer (No bigger then 51200bytes)
     * @param {Array} parameters        Array of object that contains the input parameters
     * @param {Function} callback
     */
    updateStack(stackName, templateFile, parameters, callback) {
        const params = {
            StackName: stackName,
            TemplateBody: templateFile,
            Capabilities: ['CAPABILITY_IAM']
        };
        if (parameters && !R.isEmpty(parameters)) {
            params.Parameters = parameters;
        }
        this.client.updateStack(params, (err, response) => {
            const NO_UPDATE_MESSAGE = 'No updates are to be performed.';
            if (err && err.code === 'ValidationError' && err.message === NO_UPDATE_MESSAGE) {
                callback(null, NO_UPDATE_MESSAGE);
            } else {
                callback(err, !err ? response : null);
            }
        });
    }

    /**
     * Describe stack status based on the stack ID
     * @param {String} stackId          The stack ID
     * @param {Function} callback
     */
    describeStack(stackId, callback) {
        if (!stringUtils.isNonBlankString(stackId)) {
            callback('Stack ID must be set to further describe');
            return;
        }
        const params = {
            StackName: stackId
        };
        this.client.describeStacks(params, (err, response) => {
            // callback the first stack's description since stackId is required for the method
            callback(err, err ? null : response.Stacks[0]);
        });
    }

    /**
     * Describe specific resource in a stack
     * @param {String} stackId          The stack ID
     * @param {String} logicalId        The resource logical ID
     * @param {Function} callback
     */
    describeStackResource(stackId, logicalId, callback) {
        if (!stringUtils.isNonBlankString(stackId)) {
            callback('Stack ID must be set to describe its resources');
            return;
        }
        if (!stringUtils.isNonBlankString(logicalId)) {
            callback('Logical ID must be set to describe its resources');
            return;
        }
        const params = {
            StackName: stackId,
            LogicalResourceId: logicalId
        };
        this.client.describeStackResource(params, (err, response) => {
            callback(err, err ? null : response.StackResourceDetail);
        });
    }

    /**
     * Describe all the resources for a stack
     * @param {String} stackId          The stack ID
     * @param {Function} callback
     */
    describeStackResources(stackId, callback) {
        if (!stringUtils.isNonBlankString(stackId)) {
            callback('Stack ID must be set to describe its resources');
            return;
        }
        const params = {
            StackName: stackId
        };
        this.client.describeStackResources(params, (err, response) => {
            callback(err, err ? null : response.StackResources);
        });
    }
};
