const {expect} = require("chai");
const fs = require("fs");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

const CliCFNDeployerError = require("../../../../lib/exceptions/cli-cfn-deployer-error");

describe("Builtins test - cfn-deployer helper test", () => {
  const profile = "default";
  const doDebug = false;
  const awsProfile = "test";
  const awsRegion = "test-region";
  const bucketName = "some-bucket";
  const versioningConfiguration = {MFADelete: "Disabled", Status: "Enabled"};
  const stackId = "some id";
  const stackName = "some name";
  const templateBody = "some template body";
  const endpointUri = "some-endpoint";
  const parameters = [{ParameterKey: "SkillId", ParameterValue: "some id"}];
  const capabilities = [];
  let sleepStub, updateStatusStub, reporter, helper;

  beforeEach(() => {
    sleepStub = sinon.stub();
    updateStatusStub = sinon.stub();
    reporter = {
      updateStatus: updateStatusStub,
    };
    const Helper = proxyquire("../../../../lib/builtins/deploy-delegates/cfn-deployer/helper", {
      util: {
        promisify: sinon.stub().withArgs(setTimeout).returns(sleepStub),
      },
    });
    helper = new Helper(profile, doDebug, awsProfile, awsRegion, reporter);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("# function uploadToS3 tests", () => {
    const bucketKey = "someKey";
    const filePath = "some-path";
    const objectBody = "some body";
    let bucketExitsStub, createBucketStub, waitForBucketStub, getBucketVersioningStub, enableBucketVersioningStub, putObjectStub;

    beforeEach(() => {
      bucketExitsStub = sinon.stub(helper.s3Client, "bucketExits");
      createBucketStub = sinon.stub(helper.s3Client, "createBucket");
      waitForBucketStub = sinon.stub(helper.s3Client, "waitForBucketExists");
      getBucketVersioningStub = sinon.stub(helper.s3Client, "getBucketVersioning");
      enableBucketVersioningStub = sinon.stub(helper.s3Client, "enableBucketVersioning");
      putObjectStub = sinon.stub(helper.s3Client, "putObject");
      sinon.stub(fs, "readFileSync").returns(objectBody);
    });

    it("should upload file but not create s3 bucket or enable versioning when the bucket already exists and versioning already enabled", async () => {
      // setup
      bucketExitsStub.resolves(true);
      getBucketVersioningStub.resolves(versioningConfiguration);
      // call
      await helper.uploadToS3(bucketName, bucketKey, filePath);
      // verify
      expect(bucketExitsStub.args[0][0]).eq(bucketName);
      expect(createBucketStub.called).to.be.false;
      expect(waitForBucketStub.called).to.be.false;
      expect(getBucketVersioningStub.args[0][0]).eq(bucketName);
      expect(enableBucketVersioningStub.called).to.be.false;
      expect(putObjectStub.args[0]).deep.equal([bucketName, bucketKey, objectBody]);
    });

    it("should enable versioning and upload file but not create s3 bucket when the bucket already exists and versioning not enabled", async () => {
      // setup
      bucketExitsStub.resolves(true);
      getBucketVersioningStub.resolves({});
      // call
      await helper.uploadToS3(bucketName, bucketKey, filePath);
      // verify
      expect(bucketExitsStub.args[0][0]).eq(bucketName);
      expect(createBucketStub.called).to.be.false;
      expect(waitForBucketStub.called).to.be.false;
      expect(getBucketVersioningStub.args[0][0]).eq(bucketName);
      expect(enableBucketVersioningStub.args[0][0]).eq(bucketName);
      expect(putObjectStub.args[0]).deep.equal([bucketName, bucketKey, objectBody]);
    });

    it("should create s3 bucket, enable versioning and upload file when the bucket does not exist", async () => {
      // setup
      bucketExitsStub.resolves(false);
      getBucketVersioningStub.resolves({});
      // call
      await helper.uploadToS3(bucketName, bucketKey, filePath);
      // verify
      expect(bucketExitsStub.args[0][0]).eq(bucketName);
      expect(createBucketStub.args[0][0]).eq(bucketName);
      expect(createBucketStub.args[0][1]).eq(awsRegion);
      expect(waitForBucketStub.args[0][0]).eq(bucketName);
      expect(getBucketVersioningStub.args[0][0]).eq(bucketName);
      expect(enableBucketVersioningStub.args[0][0]).eq(bucketName);
      expect(putObjectStub.args[0]).deep.equal([bucketName, bucketKey, objectBody]);
    });
  });

  describe("# function deployStack tests", () => {
    let stackExistsStub, createStackStub, updateStackStub, getStackStub, getStackEventsStub;

    beforeEach(() => {
      stackExistsStub = sinon.stub(helper.cloudformationClient, "stackExists");
      createStackStub = sinon.stub(helper.cloudformationClient, "createStack");
      updateStackStub = sinon.stub(helper.cloudformationClient, "updateStack");
      getStackStub = sinon.stub(helper.cloudformationClient, "getStack");
      getStackEventsStub = sinon.stub(helper.cloudformationClient, "getStackEvents");
    });

    it("should create new cloud formation stack when stack does not exist and return endpoint uri", async () => {
      // setup
      stackExistsStub.resolves(false);
      createStackStub.resolves(stackId);
      const stackInfo1 = {StackStatus: "CREATE_IN_PROGRESS", StackStatusReason: "User initiated"};
      const stackInfo2 = {StackStatus: "CREATE_COMPLETE", Outputs: [{OutputKey: "SkillEndpoint", OutputValue: endpointUri}]};
      getStackStub.onCall(0).resolves(stackInfo1);
      getStackStub.onCall(1).resolves(stackInfo2);
      // call
      const res = await helper.deployStack(undefined, stackName, templateBody, parameters, capabilities);
      // verify
      expect(res).deep.equal({stackId, stackInfo: stackInfo2, endpointUri});
      expect(stackExistsStub.args[0][0]).equal(undefined);
      expect(createStackStub.args[0]).deep.equal([stackName, templateBody, parameters, capabilities]);
      expect(updateStackStub.called).to.be.false;
      expect(getStackStub.callCount).equal(2);
      expect(getStackEventsStub.callCount).equal(0);
      expect(sleepStub.callCount).equal(1);
      expect(updateStatusStub.args).deep.equals([
        [`No stack exists or stack has been deleted. Creating cloudformation stack "${stackName}"...`],
        [`Current stack status: ${stackInfo1.StackStatus}... Status reason: ${stackInfo1.StackStatusReason}.`],
        [`Current stack status: ${stackInfo2.StackStatus}... `],
      ]);
    });

    it("should update cloud formation stack when stack exists and return endpoint uri", async () => {
      // setup
      stackExistsStub.resolves(true);
      updateStackStub.resolves(stackId);
      const stackInfo1 = {StackStatus: "UPDATE_IN_PROGRESS", StackStatusReason: "User initiated"};
      const stackInfo2 = {StackStatus: "UPDATE_COMPLETE", Outputs: [{OutputKey: "SkillEndpoint", OutputValue: endpointUri}]};
      getStackStub.onCall(0).resolves(stackInfo1);
      getStackStub.onCall(1).resolves(stackInfo2);
      // call
      const res = await helper.deployStack(stackId, stackName, templateBody, parameters, capabilities);
      // verify
      expect(res).deep.equal({stackId, stackInfo: stackInfo2, endpointUri});
      expect(stackExistsStub.args[0][0]).equal(stackId);
      expect(createStackStub.called).to.be.false;
      expect(updateStackStub.args[0]).deep.equal([stackId, templateBody, parameters, capabilities]);
      expect(getStackStub.callCount).equal(2);
      expect(getStackEventsStub.callCount).equal(0);
      expect(sleepStub.callCount).equal(1);
      expect(updateStatusStub.args).deep.equals([
        [`Updating stack (${stackId})...`],
        [`Current stack status: ${stackInfo1.StackStatus}... Status reason: ${stackInfo1.StackStatusReason}.`],
        [`Current stack status: ${stackInfo2.StackStatus}... `],
      ]);
    });

    it("should fail to create new cloud formation stack and throw a specific deploy error", (done) => {
      // setup
      stackExistsStub.resolves(false);
      createStackStub.resolves(stackId);
      const stackInfo = {StackStatus: "ROLLBACK_COMPLETE", Outputs: [{OutputKey: "SkillEndpoint", OutputValue: endpointUri}]};
      getStackStub.resolves(stackInfo);
      const stackEvent = {
        ResourceStatus: "CREATE_FAILED",
        LogicalResourceId: "some resource id",
        ResourceType: "some resource type",
        ResourceStatusReason: "some failure reason",
      };
      getStackEventsStub.resolves([{ResourceStatus: "reason 1"}, stackEvent, {ResourceStatus: "reason 2"}]);
      // call
      helper.deployStack(stackId, stackName, templateBody, parameters, capabilities).catch((err) => {
        // verify
        expect(err).instanceOf(CliCFNDeployerError);
        expect(err.message).includes(stackEvent.ResourceStatusReason);
        expect(createStackStub.args[0]).deep.equal([stackName, templateBody, parameters, capabilities]);
        expect(updateStackStub.called).to.be.false;
        expect(getStackStub.callCount).equal(1);
        expect(getStackEventsStub.callCount).equal(1);
        expect(sleepStub.callCount).equal(0);
        expect(updateStatusStub.args).deep.equals([
          [`No stack exists or stack has been deleted. Creating cloudformation stack "${stackName}"...`],
          [`Current stack status: ${stackInfo.StackStatus}... `],
        ]);
        done();
      });
    });

    it("should fail to update cloud formation stack and throw a generic deploy error", (done) => {
      // setup
      stackExistsStub.resolves(true);
      updateStackStub.resolves(stackId);
      const stackInfo = {StackStatus: "UPDATE_ROLLBACK_COMPLETE", Outputs: [{OutputKey: "SkillEndpoint", OutputValue: endpointUri}]};
      getStackStub.resolves(stackInfo);
      getStackEventsStub.resolves([{ResourceStatus: "reason 1"}, {ResourceStatus: "reason 2"}]);
      // call
      helper.deployStack(stackId, stackName, templateBody, parameters, capabilities).catch((err) => {
        // verify
        expect(err).instanceOf(CliCFNDeployerError);
        expect(err.message).includes("We could not find details for deploy error");
        expect(createStackStub.called).to.be.false;
        expect(updateStackStub.args[0]).deep.equal([stackId, templateBody, parameters, capabilities]);
        expect(getStackStub.callCount).equal(1);
        expect(getStackEventsStub.callCount).equal(1);
        expect(sleepStub.callCount).equal(0);
        expect(updateStatusStub.args).deep.equals([
          [`Updating stack (${stackId})...`],
          [`Current stack status: ${stackInfo.StackStatus}... `],
        ]);
        done();
      });
    });
  });

  describe("# function getSkillCredentials tests", () => {
    it("should get skill credentials successful", async () => {
      // setup
      const credentials = {clientId: "id", clientSecret: "secret"};
      const response = {body: {skillMessagingCredentials: credentials}};
      sinon.stub(helper.smapiClient.skill, "getSkillCredentials").yields(null, response);
      // call
      const result = await helper.getSkillCredentials("skill-id");
      // verify
      expect(result).equal(credentials);
    });

    it("should get skill credentials failure", (done) => {
      // setup
      const error = "some failure reason";
      sinon.stub(helper.smapiClient.skill, "getSkillCredentials").yields(error);
      // call
      helper.getSkillCredentials("skill-id").catch((err) => {
        // verify
        expect(err).equal(error);
        done();
      });
    });
  });
});
