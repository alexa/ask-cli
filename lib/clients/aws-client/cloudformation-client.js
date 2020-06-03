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
     */
    createStack(stackName, templateFile, parameters) {
        const params = {
            StackName: stackName,
            Capabilities: ['CAPABILITY_IAM'],
            TemplateBody: templateFile
        };
        if (parameters && !R.isEmpty(parameters)) {
            params.Parameters = parameters;
        }
        return this.client.createStack(params).promise();
    }

    /**
     * Update the stack based on the stackName with input parameters.
     * @param {String} stackName        The name for the stack
     * @param {String} templateFile     Template file's buffer (No bigger then 51200bytes)
     * @param {Array} parameters        Array of object that contains the input parameters
     */
    updateStack(stackName, templateFile, parameters) {
        const params = {
            StackName: stackName,
            TemplateBody: templateFile,
            Capabilities: ['CAPABILITY_IAM']
        };
        if (parameters && !R.isEmpty(parameters)) {
            params.Parameters = parameters;
        }
        return this.client.updateStack(params).promise()
            .then(res => res)
            .catch(err => {
                const NO_UPDATE_MESSAGE = 'No updates are to be performed.';
                if (err.code === 'ValidationError' && err.message === NO_UPDATE_MESSAGE) {
                    return NO_UPDATE_MESSAGE;
                }
                throw err;
            });
    }

    stackExists(stackId) {
        if (!stringUtils.isNonBlankString(stackId)) return false;

        return this.client.describeStacks({ StackName: stackId }).promise()
            .then(data => data.Stacks[0].StackStatus !== 'DELETE_COMPLETE')
            .catch(() => false);
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
