const aws = require('aws-sdk');
const { expect } = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const CliCFNDeployerError = require('@src/exceptions/cli-cfn-deployer-error');
const Helper = require('@src/builtins/deploy-delegates/cfn-deployer/helper');

describe('Builtins test - cfn-deployer helper test', () => {
    const awsProfile = 'test';
    const awsRegion = 'test-region';
    const bucketName = 'some-bucket';
    const versioningConfiguration = { MFADelete: 'Disabled', Status: 'Enabled' };
    const stackId = 'some id';
    const stackName = 'some name';
    const templateBody = 'some template body';
    const endpointUri = 'some-endpoint';
    const parameters = [{ ParameterKey: 'SkillId', ParameterValue: 'some id' }];
    const capabilities = [];
    let helper;
    let reporter;
    let updateStatusStub;
    let headBucketStub;
    let createBucketStub;
    let waitForStub;
    let getBucketVersioningStub;
    let putBucketVersioningStub;
    let putObjectStub;
    let describeStacksStub;
    let updateStackStub;
    let createStackStub;
    let describeStackEventsStub;

    beforeEach(() => {
        createBucketStub = sinon.stub().returns({ promise: sinon.stub().resolves() });
        headBucketStub = sinon.stub();
        waitForStub = sinon.stub().returns({ promise: sinon.stub().resolves() });
        getBucketVersioningStub = sinon.stub();
        putBucketVersioningStub = sinon.stub().returns({ promise: sinon.stub().resolves() });
        putObjectStub = sinon.stub().returns({ promise: sinon.stub().resolves() });

        sinon.stub(aws, 'S3').returns({
            headBucket: headBucketStub,
            createBucket: createBucketStub,
            waitFor: waitForStub,
            getBucketVersioning: getBucketVersioningStub,
            putBucketVersioning: putBucketVersioningStub,
            putObject: putObjectStub
        });

        describeStacksStub = sinon.stub();
        updateStackStub = sinon.stub().returns({ promise: sinon.stub().resolves() });
        createStackStub = sinon.stub().returns({ promise: sinon.stub().resolves() });
        describeStackEventsStub = sinon.stub();

        sinon.stub(aws, 'CloudFormation').returns({
            describeStacks: describeStacksStub,
            updateStack: updateStackStub,
            createStack: createStackStub,
            describeStackEvents: describeStackEventsStub
        });
        updateStatusStub = sinon.stub();

        reporter = {
            updateStatus: updateStatusStub
        };

        helper = new Helper(awsProfile, awsRegion, reporter);
        sinon.stub(helper, 'sleep').resolves();
    });

    it('should not create s3 bucket when the bucket already exists', async () => {
        headBucketStub.returns({ promise: sinon.stub().resolves() });

        await helper.createS3BucketIfNotExists(bucketName);

        expect(headBucketStub.callCount).eq(1);
        expect(createBucketStub.callCount).eq(0);
    });

    it('should create s3 bucket when the bucket does not exist in us-east-1', async () => {
        headBucketStub.returns({ promise: sinon.stub().rejects() });

        helper = new Helper(awsProfile, 'us-east-1', reporter);
        await helper.createS3BucketIfNotExists(bucketName);

        expect(headBucketStub.callCount).eq(1);
        expect(createBucketStub.callCount).eq(1);
        expect(createBucketStub.args[0][0].Bucket).eq(bucketName);
        expect(waitForStub.callCount).eq(1);
    });

    it('should create s3 bucket when the bucket does not exist in non us-east-1', async () => {
        headBucketStub.returns({ promise: sinon.stub().rejects() });

        await helper.createS3BucketIfNotExists(bucketName);

        expect(headBucketStub.callCount).eq(1);
        expect(createBucketStub.callCount).eq(1);
        expect(createBucketStub.args[0][0].Bucket).eq(bucketName);
        expect(createBucketStub.args[0][0].CreateBucketConfiguration.LocationConstraint).eq(awsRegion);
        expect(waitForStub.callCount).eq(1);
    });

    it('should not enable s3 bucket versioning when the versioning already enabled', async () => {
        getBucketVersioningStub.returns({ promise: sinon.stub().resolves(versioningConfiguration) });

        await helper.enableS3BucketVersioningIfNotEnabled(bucketName);

        expect(putBucketVersioningStub.callCount).eq(0);
    });

    it('should enable s3 bucket versioning when the versioning is not enabled', async () => {
        getBucketVersioningStub.returns({ promise: sinon.stub().resolves({}) });

        await helper.enableS3BucketVersioningIfNotEnabled(bucketName);

        expect(putBucketVersioningStub.callCount).eq(1);
        expect(putBucketVersioningStub.args[0][0]).eql({ Bucket: bucketName, VersioningConfiguration: versioningConfiguration });
    });

    it('should upload to s3', async () => {
        const objectBody = 'some body';
        sinon.stub(fs, 'readFileSync').returns(objectBody);
        const bucketKey = 'someKey';
        const filePath = 'some-path';

        await helper.uploadToS3(bucketName, bucketKey, filePath);

        expect(putObjectStub.callCount).eq(1);
        expect(putObjectStub.args[0][0]).eql({ Bucket: bucketName, Key: bucketKey, Body: objectBody });
        expect(updateStatusStub.callCount).eq(1);
        expect(updateStatusStub.args[0][0]).eq(`Uploading code artifact to s3://${bucketName}/${bucketKey}`);
    });

    it('should create new cloud formation stack when stack does not exist', async () => {
        describeStacksStub.returns({ promise: sinon.stub().rejects({}) });

        await helper.deployStack(stackId, stackName, templateBody, parameters, capabilities);

        expect(updateStatusStub.args[0][0]).contains('No stack exists or stack has been deleted. Creating cloudformation stack');
        expect(createStackStub.callCount).eq(1);
        expect(createStackStub.args[0][0]).eql({ StackName: stackName, Capabilities: [], TemplateBody: templateBody, Parameters: parameters });
    });

    it('should create new cloud formation stack when stack id is undefined', async () => {
        await helper.deployStack(undefined, stackName, templateBody, parameters, capabilities);

        expect(updateStatusStub.args[0][0]).contains('No stack exists or stack has been deleted. Creating cloudformation stack');
        expect(createStackStub.callCount).eq(1);
        expect(createStackStub.args[0][0]).eql({ StackName: stackName, Capabilities: [], TemplateBody: templateBody, Parameters: parameters });
    });

    it('should update cloud formation stack when stack exists', async () => {
        describeStacksStub.returns({ promise: sinon.stub().resolves({ Stacks: [{ StackStatus: 'CREATE_COMPLETE' }] }) });

        await helper.deployStack(stackId, stackName, templateBody, parameters, capabilities);

        expect(updateStatusStub.args[0][0]).contains(`Updating stack (${stackId})...`);
        expect(updateStackStub.callCount).eq(1);
        expect(updateStackStub.args[0][0]).eql({ StackName: stackId, Capabilities: [], TemplateBody: templateBody, Parameters: parameters });
    });

    it('should wait for cloud formation stack deploy and return endpoint uri', async () => {
        const stackInfo1 = { StackStatus: 'CREATE_IN_PROGRESS', StackStatusReason: 'User initiated' };
        const stackInfo2 = { StackStatus: 'CREATE_COMPLETE',
            Outputs: [{ OutputKey: 'SkillEndpoint', OutputValue: endpointUri }] };

        describeStacksStub.onCall(0).returns({ promise: sinon.stub()
            .resolves({ Stacks: [stackInfo1] }) });
        describeStacksStub.onCall(1).returns({ promise: sinon.stub()
            .resolves({ Stacks: [stackInfo2] }) });

        const response = await helper.waitForStackDeploy(stackId);

        expect(response).eql({ stackInfo: stackInfo2, endpointUri });
        expect(updateStatusStub.args[0][0]).eq(`Current stack status: ${stackInfo1.StackStatus}... Status reason: ${stackInfo1.StackStatusReason}.`);
        expect(updateStatusStub.args[1][0]).eq(`Current stack status: ${stackInfo2.StackStatus}... `);
    });

    it('should wait for cloud formation stack deploy and throw a deploy error', async () => {
        const stackInfo = { StackStatus: 'ROLLBACK_COMPLETE',
            Outputs: [{ OutputKey: 'SkillEndpoint', OutputValue: endpointUri }] };
        describeStacksStub.returns({ promise: sinon.stub()
            .resolves({ Stacks: [stackInfo] }) });

        const failureReason = 'some failure reason';
        const stackEvent = { ResourceStatus: 'CREATE_FAILED',
            LogicalResourceId: 'some resource id',
            ResourceType: 'some resource type',
            ResourceStatusReason: failureReason };
        describeStackEventsStub.returns({ promise: sinon.stub()
            .resolves({ StackEvents: [{ ResourceStatus: 'reason 1' }, stackEvent, { ResourceStatus: 'reason 2' }] }) });

        return helper.waitForStackDeploy(stackId).catch(err => {
            expect(err).instanceOf(CliCFNDeployerError);
            expect(err.message).includes(failureReason);
        });
    });

    it('should wait for cloud formation stack deploy and throw a default error', async () => {
        const stackInfo = { StackStatus: 'ROLLBACK_COMPLETE',
            Outputs: [{ OutputKey: 'SkillEndpoint', OutputValue: endpointUri }] };
        describeStacksStub.returns({ promise: sinon.stub()
            .resolves({ Stacks: [stackInfo] }) });

        describeStackEventsStub.returns({ promise: sinon.stub()
            .resolves({ StackEvents: [{ ResourceStatus: 'reason 1' }, { ResourceStatus: 'reason 2' }] }) });

        return helper.waitForStackDeploy(stackId).catch(err => {
            expect(err).instanceOf(CliCFNDeployerError);
            expect(err.message).includes('We could not find details for deploy error');
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
