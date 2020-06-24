const { expect } = require('chai');
const sinon = require('sinon');
const aws = require('aws-sdk');

const CloudformationClient = require('@src/clients/aws-client/cloudformation-client');

const noop = () => {};

describe('Clients test - cloudformation client test', () => {
    const TEST_AWS_PROFILE = 'AWS_PROFILE';
    const TEST_AWS_REGION = 'AWS_REGION';
    const TEST_CLIENT_ERROR = 'CLIENT_ERR';
    const TEST_CLIENT_RESPONSE = 'CLIENT_RESPONSE';
    const TEST_CONFIGURATION = {
        awsProfile: TEST_AWS_PROFILE,
        awsRegion: TEST_AWS_REGION
    };
    const TEST_CREATE_RESPONSE = {
        StackId: 'someId'
    };
    const TEST_UPDATE_RESPONSE = {
        StackId: 'someId'
    };
    let createStackStub,
        updateStackStub,
        describeStackStub,
        describeStackResourceStub,
        describeStackResourcesStub;

    beforeEach(() => {
        createStackStub = sinon.stub().returns({ promise: sinon.stub().resolves({ ...TEST_CREATE_RESPONSE }) });
        updateStackStub = sinon.stub().returns({ promise: sinon.stub().resolves({ ...TEST_UPDATE_RESPONSE }) });
        describeStackStub = sinon.stub();
        describeStackResourceStub = sinon.stub();
        describeStackResourcesStub = sinon.stub();
        sinon.stub(aws, 'CloudFormation').returns({
            createStack: createStackStub,
            updateStack: updateStackStub,
            describeStacks: describeStackStub,
            describeStackResource: describeStackResourceStub,
            describeStackResources: describeStackResourcesStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Check correctness for constructor function', () => {
        it('| inspect correctness for constructor when awsRegion is set in configuration', () => {
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            expect(cfnClient).to.be.instanceof(CloudformationClient);
            expect(cfnClient.awsRegion).equal(TEST_AWS_REGION);
            expect(aws.config.region).equal(TEST_AWS_REGION);
            expect(aws.config.credentials).deep.equal(new aws.SharedIniFileCredentials({ profile: TEST_AWS_PROFILE }));
        });

        it('| throw error when awsProfile or awsRegion is not passed in', () => {
            try {
                new CloudformationClient({});
            } catch (e) {
                expect(e.message).equal('Invalid awsProfile or Invalid awsRegion');
            }
        });
    });

    describe('Test client method - createStack()', () => {
        const TEST_STACK_NAME = 'STACK';
        const TEST_TEMPLATE = 'TEMPLATE_CONTENT';
        const TEST_PARAMETERS = {
            key: 'value'
        };

        it('| call aws-sdk createStack method with same params from input', () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.createStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS);
            // verify
            expect(createStackStub.args[0][0].StackName).equal(TEST_STACK_NAME);
            expect(createStackStub.args[0][0].TemplateBody).equal(TEST_TEMPLATE);
            expect(createStackStub.args[0][0].Capabilities).deep.equal(['CAPABILITY_IAM']);
            expect(createStackStub.args[0][0].Parameters).deep.equal(TEST_PARAMETERS);
        });

        it('| call aws-sdk createStack method with same params from input without parameters', () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.createStack(TEST_STACK_NAME, TEST_TEMPLATE, {});
            // verify
            expect(createStackStub.args[0][0].StackName).equal(TEST_STACK_NAME);
            expect(createStackStub.args[0][0].TemplateBody).equal(TEST_TEMPLATE);
            expect(createStackStub.args[0][0].Capabilities).deep.equal(['CAPABILITY_IAM']);
            expect(createStackStub.args[0][0].Parameters).equal(undefined);
        });


        it('| createStack returns response when client request succeeds', async () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);

            // call
            const res = await cfnClient.createStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS);

            expect(res).eql(TEST_CREATE_RESPONSE);
        });
    });

    describe('Test client method - updateStack()', () => {
        const TEST_STACK_NAME = 'STACK';
        const TEST_TEMPLATE = 'TEMPLATE_CONTENT';
        const TEST_PARAMETERS = {
            key: 'value'
        };

        it('| call aws-sdk updateStack method with same params from input', () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS, noop);
            // verify
            expect(updateStackStub.args[0][0].StackName).equal(TEST_STACK_NAME);
            expect(updateStackStub.args[0][0].TemplateBody).equal(TEST_TEMPLATE);
            expect(updateStackStub.args[0][0].Capabilities).deep.equal(['CAPABILITY_IAM']);
            expect(updateStackStub.args[0][0].Parameters).deep.equal(TEST_PARAMETERS);
        });

        it('| call aws-sdk updateStack method with same params from input without parameters', () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, {}, noop);
            // verify
            expect(updateStackStub.args[0][0].StackName).equal(TEST_STACK_NAME);
            expect(updateStackStub.args[0][0].TemplateBody).equal(TEST_TEMPLATE);
            expect(updateStackStub.args[0][0].Capabilities).deep.equal(['CAPABILITY_IAM']);
            expect(updateStackStub.args[0][0].Parameters).equal(undefined);
        });

        it('| updateStack method returns error when client request fails', () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            updateStackStub.returns({ promise: sinon.stub().rejects(TEST_CLIENT_ERROR) });
            // call
            return cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS).catch(err => {
                expect(err.name).eql(TEST_CLIENT_ERROR);
            });
        });

        it('| updateStack returns with response string when no update to be performed', async () => {
            // setup
            const NO_UPDATE_ERROR = {
                code: 'ValidationError',
                message: 'No updates are to be performed.'
            };
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            updateStackStub.returns({ promise: sinon.stub().rejects(NO_UPDATE_ERROR) });
            // call
            const res = await cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS);
            // verify
            expect(res).eql('No updates are to be performed.');
        });

        it('| updateStack returns response when client request succeeds', async () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            const res = await cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS);

            expect(res).eql(TEST_UPDATE_RESPONSE);
        });
    });

    describe('Test client method - stackExists()', () => {
        it('| returns false when stack id is undefined', async () => {
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);

            const exists = await cfnClient.stackExists();

            expect(exists).eql(false);
        });

        it('| returns false when stack status is delete complete', async () => {
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            describeStackStub.returns({ promise: sinon.stub().resolves({ Stacks: [{ StackStatus: 'DELETE_COMPLETE' }] }) });

            const exists = await cfnClient.stackExists('someId');

            expect(exists).eql(false);
        });

        it('| returns false when when getting stack status fails', async () => {
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            describeStackStub.returns({ promise: sinon.stub().rejects() });

            const exists = await cfnClient.stackExists('someId');

            expect(exists).eql(false);
        });

        it('| returns true when request succeeds', async () => {
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            describeStackStub.returns({ promise: sinon.stub().resolves({ Stacks: [{ StackStatus: 'test' }] }) });

            const exists = await cfnClient.stackExists('someId');

            expect(exists).eql(true);
        });
    });
    describe('Test client method - describeStack()', () => {
        const TEST_STACK_NAME = 'STACK';

        it('| call aws-sdk describeStack method with same params from input', () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.describeStack(TEST_STACK_NAME, noop);
            // verify
            expect(describeStackStub.args[0][0].StackName).equal(TEST_STACK_NAME);
        });

        it('| describeStack method callback with error when stackId not provided', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.describeStack('', (err, res) => {
                // verify
                expect(err).equal('Stack ID must be set to further describe');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| describeStack method callback with error when client request fails', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            describeStackStub.callsArgWith(1, TEST_CLIENT_ERROR, null);
            // call
            cfnClient.describeStack(TEST_STACK_NAME, (err, res) => {
                // verify
                expect(err).equal(TEST_CLIENT_ERROR);
                expect(res).equal(null);
                done();
            });
        });

        it('| describeStack method callback with response when client request succeeds', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            const TEST_DESCRIBE_RESPONSE = {
                Stacks: [TEST_CLIENT_RESPONSE]
            };
            describeStackStub.callsArgWith(1, null, TEST_DESCRIBE_RESPONSE);
            // call
            cfnClient.describeStack(TEST_STACK_NAME, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(TEST_CLIENT_RESPONSE);
                done();
            });
        });
    });
    // expect(err).equal('Logical ID must be set to describe the resource')

    describe('Test client method - describeStackResource()', () => {
        const TEST_STACK_NAME = 'STACK';
        const TEST_LOGICAL_ID = 'LOGICAL_ID';

        it('| call aws-sdk describeStackResource method with same params from input', () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.describeStackResource(TEST_STACK_NAME, TEST_LOGICAL_ID, noop);
            // verify
            expect(describeStackResourceStub.args[0][0].StackName).equal(TEST_STACK_NAME);
            expect(describeStackResourceStub.args[0][0].LogicalResourceId).equal(TEST_LOGICAL_ID);
        });

        it('| describeStackResource method callback error when stackId not set', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.describeStackResource('', TEST_LOGICAL_ID, (err, res) => {
                // verify
                expect(err).equal('Stack ID must be set to describe its resources');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| describeStackResource method callback error when logicalId not set', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.describeStackResource(TEST_STACK_NAME, '', (err, res) => {
                // verify
                expect(err).equal('Logical ID must be set to describe its resources');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| describeStackResource method callback error when client request fails', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            describeStackResourceStub.callsArgWith(1, TEST_CLIENT_ERROR, null);
            // call
            cfnClient.describeStackResource(TEST_STACK_NAME, TEST_LOGICAL_ID, (err, res) => {
                // verify
                expect(err).equal(TEST_CLIENT_ERROR);
                expect(res).equal(null);
                done();
            });
        });

        it('| describeStackResource method callback response when client request succeeds', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            const TEST_DESCRIBE_RESPONSE = {
                StackResourceDetail: TEST_CLIENT_RESPONSE
            };
            describeStackResourceStub.callsArgWith(1, null, TEST_DESCRIBE_RESPONSE);
            // call
            cfnClient.describeStackResource(TEST_STACK_NAME, TEST_LOGICAL_ID, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(TEST_CLIENT_RESPONSE);
                done();
            });
        });
    });

    describe('Test client method - describeStackResources()', () => {
        const TEST_STACK_NAME = 'STACK';

        it('| call aws-sdk describeStackResources method with same params from input', () => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.describeStackResources(TEST_STACK_NAME, noop);
            // verify
            expect(describeStackResourcesStub.args[0][0].StackName).equal(TEST_STACK_NAME);
        });

        it('| describeStackResources method callback error when stackId not set', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            // call
            cfnClient.describeStackResources('', (err, res) => {
                // verify
                expect(err).equal('Stack ID must be set to describe its resources');
                expect(res).equal();
                done();
            });
        });

        it('| describeStackResources method callback error when client request fails', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            describeStackResourcesStub.callsArgWith(1, TEST_CLIENT_ERROR, null);
            // call
            cfnClient.describeStackResources(TEST_STACK_NAME, (err, res) => {
                // verify
                expect(err).equal(TEST_CLIENT_ERROR);
                expect(res).equal(null);
                done();
            });
        });

        it('| describeStackResources method callback response when client request succeeds', (done) => {
            // setup
            const cfnClient = new CloudformationClient(TEST_CONFIGURATION);
            const TEST_DESCRIBE_RESPONSE = {
                StackResources: TEST_CLIENT_RESPONSE
            };
            describeStackResourcesStub.callsArgWith(1, null, TEST_DESCRIBE_RESPONSE);
            // call
            cfnClient.describeStackResources(TEST_STACK_NAME, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(TEST_CLIENT_RESPONSE);
                done();
            });
        });
    });
});
