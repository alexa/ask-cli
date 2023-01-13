const aws = require('aws-sdk');

const CONSTANTS = require('@src/utils/constants');
const AbstractAwsClient = require('./abstract-aws-client');

/**
 * Class for AWS IAM Client
 */
module.exports = class IAMClient extends AbstractAwsClient {
    constructor(configuration) {
        super(configuration);
        this.client = new aws.IAM();
    }

    /**
     * Wrapper of iam sdk api
     * Retrieves information about the specified role
     * @param {string} roleArn The arn of the IAM role to get information about.
     * @param {callback} callback { error, response }
     */
    getIAMRole(roleArn, callback) {
        const params = {
            RoleName: this._extractIAMRoleName(roleArn)
        };
        this.client.getRole(params, (err, response) => {
            callback(err, !err ? response : null);
        });
    }

    /**
     * Wrapper of iam sdk api
     * Creates a new role for AWS account.
     * @param {string} roleName The name of the IAM role.
     * @param {callback} callback { error, response }
     */
    createBasicLambdaRole(roleName, callback) {
        const policy = CONSTANTS.AWS.IAM.ROLE.LAMBDA_BASIC_ROLE.POLICY;
        const params = {
            RoleName: roleName,
            AssumeRolePolicyDocument: JSON.stringify(policy)
        };
        this.client.createRole(params, (err, response) => {
            callback(err, !err ? response : null);
        });
    }

    /**
     * Wrapper of iam sdk api
     * Attaches the specified managed policy to the specified IAM role.
     * @param {string} roleArn The Amazon Resource Name (ARN) specifying the group.
     * @param {callback} callback { error, response }
     */
    attachBasicLambdaRolePolicy(roleArn, callback) {
        const params = {
            PolicyArn: CONSTANTS.AWS.IAM.ROLE.LAMBDA_BASIC_ROLE.POLICY_ARN,
            RoleName: this._extractIAMRoleName(roleArn)
        };
        this.client.attachRolePolicy(params, (err, response) => {
            callback(err, !err ? response : null);
        });
    }

    /**
     * Extracts IAM Role from an existing iam role arn.
     * @param {string} roleArn The Amazon Resource Name (ARN) specifying the group.
     */
    _extractIAMRoleName(roleArn) {
        return roleArn.split('role/').pop();
    }
};
