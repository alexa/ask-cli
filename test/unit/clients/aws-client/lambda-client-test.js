const aws = require('aws-sdk');
const { expect } = require('chai');
const sinon = require('sinon');

const LambdaClient = require('@src/clients/aws-client/lambda-client');

describe('Clients test - lambda client test', () => {
    const TEST_AWS_PROFILE = 'TEST_AWS_PROFILE';
    const TEST_AWS_REGION = 'TEST_AWS_REGION';
    const TEST_ALEXA_REGION = 'TEST_ALEXA_REGION';
    const TEST_CONFIGURATION = {
        awsProfile: TEST_AWS_PROFILE,
        awsRegion: TEST_AWS_REGION
    };
    const TEST_SKILL_NAME = 'skill_name';
    const TEST_FUNCTION_ARN = 'function_arn';
    const TEST_SKILL_ID = 'skill_id';
    const TEST_REVISION_ID = 'revision_id';
    const TEST_ZIPFILD = 'zipfile_path';
    const TEST_RUNTIME = 'runtime';
    const TEST_HANDLE = 'handler';

    afterEach(() => {
        sinon.restore();
    });

    describe('# constructor tests', () => {
        it('| inspect correctness for constructor when awsRegion is set in configuration.', () => {
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            expect(lambdaClient).to.be.instanceOf(LambdaClient);
            expect(lambdaClient.awsRegion).equal(TEST_AWS_REGION);
            expect(aws.config.region).equal(TEST_AWS_REGION);
            expect(aws.config.credentials).deep.equal(new aws.SharedIniFileCredentials({ profile: TEST_AWS_PROFILE }));
        });

        it('| inspect an error for constructor when awsRegion is null in configuration.', () => {
            const configuration = {
                awsProfile: TEST_AWS_PROFILE,
                awsRegion: null
            };
            try {
                new LambdaClient(configuration);
            } catch (e) {
                expect(e.message).equal('Invalid awsProfile or Invalid awsRegion');
            }
        });
        it('| inspect an error for constructor when awsRegion is blank in configuration.', () => {
            const configuration = {
                awsProfile: '    ',
                awsRegion: TEST_AWS_REGION
            };
            try {
                new LambdaClient(configuration);
            } catch (e) {
                expect(e.message).equal('Invalid awsProfile or Invalid awsRegion');
            }
        });
    });

    describe('# function createLambdaFunction tests', () => {
        const TEST_IAM_ROLE = 'iam_role';

        it('| iamClient create Lambda function request fails, expect an error return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_CREATE_FUNCTION_ERR = 'create_function_error';
            sinon.stub(lambdaClient.client, 'createFunction').callsArgWith(1, TEST_CREATE_FUNCTION_ERR);
            // call
            lambdaClient.createLambdaFunction(TEST_SKILL_NAME, TEST_AWS_PROFILE, TEST_ALEXA_REGION,
                TEST_IAM_ROLE, TEST_ZIPFILD, TEST_RUNTIME, TEST_HANDLE, (err) => {
                // verify
                    expect(err).equal(TEST_CREATE_FUNCTION_ERR);
                    done();
                });
        });

        it('| iamClient create Lambda function request passes, expect role data return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_CREATE_FUNCTION_RESPONSE = {
                FunctionArn: TEST_FUNCTION_ARN
            };
            sinon.stub(lambdaClient.client, 'createFunction').callsArgWith(1, null, TEST_CREATE_FUNCTION_RESPONSE);
            // call
            lambdaClient.createLambdaFunction(TEST_SKILL_NAME, TEST_AWS_PROFILE, TEST_ALEXA_REGION,
                TEST_IAM_ROLE, TEST_ZIPFILD, TEST_RUNTIME, TEST_HANDLE, (err, data) => {
                // verify
                    expect(data.FunctionArn).equal(TEST_FUNCTION_ARN);
                    done();
                });
        });
    });

    describe('# function addAlexaPermissionByDomain tests', () => {
        it('| iamClient add Alexa permission by custom domain request fails, expect an error return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_DOMAIN = 'custom';
            const TEST_ADD_PERMISSION_ERR = 'ADD_PERMISSION_ERROR';
            sinon.stub(lambdaClient.client, 'addPermission').callsArgWith(1, TEST_ADD_PERMISSION_ERR);
            // call
            lambdaClient.addAlexaPermissionByDomain(TEST_DOMAIN, TEST_SKILL_ID, TEST_FUNCTION_ARN, (err) => {
                // verify
                expect(err).equal(TEST_ADD_PERMISSION_ERR);
                done();
            });
        });

        it('| iamClient add Alexa permission by smartHome domain request fails, expect an error return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_DOMAIN = 'smartHome';
            const TEST_ADD_PERMISSION_ERR = 'ADD_PERMISSION_ERROR';
            sinon.stub(lambdaClient.client, 'addPermission').callsArgWith(1, TEST_ADD_PERMISSION_ERR);
            // call
            lambdaClient.addAlexaPermissionByDomain(TEST_DOMAIN, TEST_SKILL_ID, TEST_FUNCTION_ARN, (err) => {
                // verify
                expect(err).equal(TEST_ADD_PERMISSION_ERR);
                done();
            });
        });

        it('| iamClient add Alexa permission by domain request passes, expect null error return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_DOMAIN = 'video';
            sinon.stub(lambdaClient.client, 'addPermission').callsArgWith(1, null);
            // call
            lambdaClient.addAlexaPermissionByDomain(TEST_DOMAIN, TEST_SKILL_ID, TEST_FUNCTION_ARN, (err) => {
                // verify
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# function getFunction tests', () => {
        it('| iamClient get Function request fails, expect an error return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_GET_FUNCTION_ERR = 'GET_FUNCTION_ERROR';
            sinon.stub(lambdaClient.client, 'getFunction').callsArgWith(1, TEST_GET_FUNCTION_ERR);
            // call
            lambdaClient.getFunction(TEST_FUNCTION_ARN, (err) => {
                // verify
                expect(err).equal(TEST_GET_FUNCTION_ERR);
                done();
            });
        });

        it('| iamClient get Function request passes, expect a revision id return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_GET_FUNCTION_RESPONSE = {
                Configuration: {
                    RevisionId: TEST_REVISION_ID
                }
            };
            sinon.stub(lambdaClient.client, 'getFunction').callsArgWith(1, null, TEST_GET_FUNCTION_RESPONSE);
            // call
            lambdaClient.getFunction(TEST_FUNCTION_ARN, (err, data) => {
                // verify
                expect(data.Configuration.RevisionId).equal(TEST_REVISION_ID);
                done();
            });
        });
    });

    describe('# function updateFunctionCode tests', () => {
        it('| iamClient update function code request fails, expect an error return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_UPDATE_CODE_ERR = 'UPDATE_CODE_ERROR';
            sinon.stub(lambdaClient.client, 'updateFunctionCode').callsArgWith(1, TEST_UPDATE_CODE_ERR);
            // call
            lambdaClient.updateFunctionCode(TEST_ZIPFILD, TEST_FUNCTION_ARN, TEST_REVISION_ID, (err) => {
                // verify
                expect(err).equal(TEST_UPDATE_CODE_ERR);
                done();
            });
        });

        it('| iamClient update function code request passes, expect function data return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_UPDATE_CODE_RESPONSE = {
                FunctionArn: TEST_FUNCTION_ARN
            };
            sinon.stub(lambdaClient.client, 'updateFunctionCode').callsArgWith(1, null, TEST_UPDATE_CODE_RESPONSE);
            // call
            lambdaClient.updateFunctionCode(TEST_ZIPFILD, TEST_FUNCTION_ARN, TEST_REVISION_ID, (err, data) => {
                // verify
                expect(data.FunctionArn).equal(TEST_FUNCTION_ARN);
                done();
            });
        });
    });

    describe('# function update function configuration tests', () => {
        it('| iamClient update function configuration request fails, expect an error return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_UPDATE_CONFIG_ERR = 'UPDATE_CONFIG_ERROR';
            sinon.stub(lambdaClient.client, 'updateFunctionConfiguration').callsArgWith(1, TEST_UPDATE_CONFIG_ERR);
            // call
            lambdaClient.updateFunctionConfiguration(TEST_FUNCTION_ARN, TEST_RUNTIME, TEST_HANDLE, TEST_REVISION_ID, (err) => {
                // verify
                expect(err).equal(TEST_UPDATE_CONFIG_ERR);
                done();
            });
        });

        it('| iamClient update function configuration request passes, expect null error return.', (done) => {
            // setup
            const lambdaClient = new LambdaClient(TEST_CONFIGURATION);
            const TEST_UPDATE_CONFIG_RESPONSE = {
                RevisionId: TEST_REVISION_ID
            };
            sinon.stub(lambdaClient.client, 'updateFunctionConfiguration').callsArgWith(1, null, TEST_UPDATE_CONFIG_RESPONSE);
            // call
            lambdaClient.updateFunctionConfiguration(TEST_FUNCTION_ARN, TEST_RUNTIME, TEST_HANDLE, TEST_REVISION_ID, (err, data) => {
                // verify
                expect(data.RevisionId).equal(TEST_REVISION_ID);
                done();
            });
        });
    });
});
