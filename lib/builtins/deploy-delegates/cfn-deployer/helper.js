/* eslint-disable no-await-in-loop */
const fs = require("fs");
const sleep = require("util").promisify(setTimeout);

const CliCFNDeployerError = require("../../../exceptions/cli-cfn-deployer-error");
const CloudformationClient = require("../../../clients/aws-client/cloudformation-client").default;
const S3Client = require("../../../clients/aws-client/s3-client").default;
const SmapiClient = require("../../../clients/smapi-client").default;

module.exports = class Helper {
  constructor(profile, doDebug, awsProfile, awsRegion, reporter) {
    this.awsProfile = awsProfile;
    this.awsRegion = awsRegion;
    this.reporter = reporter;
    this.s3Client = new S3Client({awsProfile, awsRegion});
    this.cloudformationClient = new CloudformationClient({awsProfile, awsRegion});
    this.smapiClient = new SmapiClient({profile, doDebug});
  }

  /** Uploads object to S3
   * @param  {string} bucketName Bucket name
   * @param  {string} bucketKey Bucket key
   * @param  {string} filePath File path for file to upload
   * @returns {Promise{<{ETag: string, VersionId: string}>}}
   */
  async uploadToS3(bucketName, bucketKey, filePath) {
    // check if bucket exists
    const bucketExits = await this.s3Client.bucketExits(bucketName);
    // create and wait for bucket if not found
    if (!bucketExits) {
      this.reporter.updateStatus(`Creating s3 bucket "${bucketName}"...`);
      await this.s3Client.createBucket(bucketName, this.awsRegion);
      await this.s3Client.waitForBucketExists(bucketName);
    }
    // get bucket versioning
    const versioning = await this.s3Client.getBucketVersioning(bucketName);
    // enable bucket versioning if status not enabled
    if (versioning.Status !== "Enabled") {
      this.reporter.updateStatus(`Enabling versioning on s3 bucket "${bucketName}"...`);
      await this.s3Client.enableBucketVersioning(bucketName);
    }
    // TODO: add caching when is code modified is fixed in the code builder
    this.reporter.updateStatus(`Uploading code artifact to s3://${bucketName}/${bucketKey}`);
    return this.s3Client.putObject(bucketName, bucketKey, fs.readFileSync(filePath));
  }

  /**
   * Triggers stack deploy - update or create
   * @param {string | undefined} stackId stack id
   * @param {string | undefined} stackName  stack name
   * @param {Buffer} templateBody cloud formation template body
   * @param {Array<{ParameterKey: string, ParameterValue: string}>} parameters cloud formation parameters
   * @param {Array<string>} capabilities cloud formation capabilities
   * @returns {Promise{<{stackId: string, stackInfo: Stack, endpointUri: string}>}}
   */
  async deployStack(stackId, stackName, templateBody, parameters, capabilities) {
    const stackExists = await this.cloudformationClient.stackExists(stackId);
    if (stackExists) {
      this.reporter.updateStatus(`Updating stack (${stackId})...`);
      stackId = await this.cloudformationClient.updateStack(stackId, templateBody, parameters, capabilities);
    } else {
      this.reporter.updateStatus(`No stack exists or stack has been deleted. Creating cloudformation stack "${stackName}"...`);
      stackId = await this.cloudformationClient.createStack(stackName, templateBody, parameters, capabilities);
    }
    return this._waitForStackDeploy(stackId);
  }

  /**
   * Waits for stack to be created or updated
   * @param {string} stackId stack id
   * @returns {Promise{<{stackId: string, stackInfo: Stack, endpointUri: string}>}}
   */
  async _waitForStackDeploy(stackId) {
    let stackInfo;
    while (true) {
      stackInfo = await this.cloudformationClient.getStack(stackId);
      const stackStatus = stackInfo.StackStatus;
      const statusReason = stackInfo.StackStatusReason;
      const reasonMsg = statusReason ? `Status reason: ${statusReason}.` : "";
      this.reporter.updateStatus(`Current stack status: ${stackStatus}... ${reasonMsg}`);
      if (stackStatus.endsWith("_COMPLETE")) break;
      await sleep(2000);
    }

    if (["CREATE_COMPLETE", "UPDATE_COMPLETE"].includes(stackInfo.StackStatus)) {
      const skillEndpointOutput = stackInfo.Outputs.find((o) => o.OutputKey === "SkillEndpoint");
      const endpointUri = skillEndpointOutput.OutputValue;
      return {stackId, stackInfo, endpointUri};
    }
    // default fallback error message
    let message = "CloudFormation deploy failed. We could not find details for deploy error. Please check AWS Console for more details.";
    // finding the last error
    const events = await this.cloudformationClient.getStackEvents(stackId);
    const error = events.find((e) => e.ResourceStatus.endsWith("_FAILED"));
    if (error) {
      const {LogicalResourceId, ResourceType, ResourceStatus, ResourceStatusReason} = error;
      message = `${LogicalResourceId}[${ResourceType}]  ${ResourceStatus} (${ResourceStatusReason})`;
    }
    throw new CliCFNDeployerError(message);
  }

  /**
   * Gets skill credentials
   * @param  {string} skillId skill id
   * @return {Promise{<{clientId: string, clientSecret: string}>}}
   */
  getSkillCredentials(skillId) {
    return new Promise((resolve, reject) => {
      this.smapiClient.skill.getSkillCredentials(skillId, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.body.skillMessagingCredentials);
        }
      });
    });
  }
};
