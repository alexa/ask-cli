/* eslint-disable no-await-in-loop */
const fs = require('fs');
const sleep = require('util').promisify(setTimeout);

const CliCFNDeployerError = require('@src/exceptions/cli-cfn-deployer-error');
const CloudformationClient = require('@src/clients/aws-client/cloudformation-client');
const S3Client = require('@src/clients/aws-client/s3-client');

module.exports = class Helper {
    constructor(awsProfile, awsRegion, reporter) {
        this.awsProfile = awsProfile;
        this.awsRegion = awsRegion;
        this.reporter = reporter;
        this.sleep = sleep;
        this.s3Client = (new S3Client({ awsProfile, awsRegion })).client;
        this.cloudformationClient = (new CloudformationClient({ awsProfile, awsRegion })).client;
    }

    async _s3BucketExists(bucketName) {
        try {
            await this.s3Client.headBucket({ Bucket: bucketName }).promise();
            return true;
        } catch (err) {
            return false;
        }
    }

    async _createS3Bucket(bucketName) {
        const params = {
            Bucket: bucketName
        };
        if (this.awsRegion !== 'us-east-1') {
            params.CreateBucketConfiguration = {
                LocationConstraint: this.awsRegion
            };
        }
        await this.s3Client.createBucket(params).promise();
        return this.s3Client.waitFor('bucketExists', { Bucket: bucketName }).promise();
    }

    /**
     * Creates new S3 bucket if it does not exist
     * @param {string} bucketName Bucket Name
     * @returns {Promise{<{}> | void}}
     */
    async createS3BucketIfNotExists(bucketName) {
        const exists = await this._s3BucketExists(bucketName);
        if (!exists) {
            return this._createS3Bucket(bucketName);
        }
    }

    /**
     * Enables S3 bucket versioning if it is not enabled
     * @param {string} bucketName Bucket Name
     * @returns {Promise{<{}> | void}}
     */
    async enableS3BucketVersioningIfNotEnabled(bucketName) {
        const response = await this.s3Client.getBucketVersioning({ Bucket: bucketName }).promise();
        if (typeof response === 'object' && Object.keys(response).length === 0) {
            const params = {
                Bucket: bucketName,
                VersioningConfiguration: {
                    MFADelete: 'Disabled',
                    Status: 'Enabled'
                }
            };
            return this.s3Client.putBucketVersioning(params).promise();
        }
    }

    /** Uploads object to S3
     * @param  {string} bucketName Bucket name
     * @param  {string} bucketKey Bucket key
     * @param  {} filePath File path for file to upload
     * @returns {Promise{<{ETag: string, VersionId: string}>}}
     */
    async uploadToS3(bucketName, bucketKey, filePath) {
        const params = {
            Bucket: bucketName,
            Key: bucketKey,
            Body: fs.readFileSync(filePath)
        };
        // TODO: add caching when is code modified is fixed in the code builder
        this.reporter.updateStatus(`Uploading code artifact to s3://${bucketName}/${bucketKey}`);
        return this.s3Client.putObject(params).promise();
    }

    _stackExists(stackId) {
        if (!stackId) return false;
        return this.cloudformationClient.describeStacks({ StackName: stackId }).promise()
            .then(data => !data.Stacks[0].StackStatus.startsWith('DELETE_'))
            .catch(() => false);
    }

    /**
     * Triggers stack deploy - update or create
     * @param {string | undefined} stackId stack id
     * @param {string | undefined} stackName  stack name
     * @param {Buffer} templateBody cloud formation template body
     * @param {Array<{ParameterKey: string, ParameterValue: string}>} parameters cloud formation parameters
     * @param {Array<string>} capabilities cloud formation capabilities
     * @returns {Promise{<{StackId: string}>}}
     */
    async deployStack(stackId, stackName, templateBody, parameters, capabilities) {
        const stackExists = await this._stackExists(stackId);
        if (stackExists) {
            this.reporter.updateStatus(`Updating stack (${stackId})...`);
        } else {
            this.reporter.updateStatus(`No stack exists or stack has been deleted. Creating cloudformation stack "${stackName}"...`);
        }
        const params = {
            StackName: stackExists ? stackId : stackName,
            TemplateBody: templateBody,
            Parameters: parameters,
            Capabilities: capabilities,
        };

        if (stackExists) {
            return this.cloudformationClient.updateStack(params).promise();
        }
        return this.cloudformationClient.createStack(params).promise();
    }

    /**
     * Waits for stack to be created or updated
     * @param {string} stackId stack id
     * @returns {Promise{<{
     * stackInfo: {
     *   StackId: string,
     *   StackName: string,
     *   Parameters: Array<{ParameterKey: string, ParameterValue: string}>}}>,
     *   CreationTime: timestamp,
     *   RollbackConfiguration: {},
     *   StackStatus: string,
     *   DisableRollback: boolean,
     *   NotificationARNs: Array<string>,
     *   Capabilities: Array<string>,
     *   Outputs: Array<{OutputKey: string, OutputValue: string, Description: string}>,
     *   Tags: Array<string>,
     *   EnableTerminationProtection: boolean,
     *   DriftInformation: {}
     * }
     * endpointUri: string
     * }
     */
    async waitForStackDeploy(stackId) {
        let pooling = true;
        let stackInfo;
        while (pooling) {
            const response = await this.cloudformationClient.describeStacks({ StackName: stackId }).promise();
            [stackInfo] = response.Stacks;
            const stackStatus = stackInfo.StackStatus;
            const statusReason = stackInfo.StackStatusReason;
            const reasonMsg = statusReason ? `Status reason: ${statusReason}.` : '';
            this.reporter.updateStatus(`Current stack status: ${stackStatus}... ${reasonMsg}`);
            await this.sleep(2000);
            pooling = !stackStatus.endsWith('_COMPLETE');
        }

        if (['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(stackInfo.StackStatus)) {
            const skillEndpointOutput = stackInfo.Outputs.find(o => o.OutputKey === 'SkillEndpoint');
            const endpointUri = skillEndpointOutput.OutputValue;
            return { stackInfo, endpointUri };
        }
        // default fallback error message
        let message = 'Cloud Formation deploy failed. We could not find details for deploy error. '
        + 'Please check AWS Console for more details.';
        // finding the last error
        const events = await this.cloudformationClient.describeStackEvents({ StackName: stackId }).promise();
        const error = events.StackEvents.find(e => e.ResourceStatus.endsWith('_FAILED'));
        if (error) {
            const { LogicalResourceId, ResourceType, ResourceStatus, ResourceStatusReason } = error;
            message = `${LogicalResourceId}[${ResourceType}]  ${ResourceStatus} (${ResourceStatusReason})`;
        }
        throw new CliCFNDeployerError(message);
    }
};
