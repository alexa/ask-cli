const aws = require('aws-sdk');
const { expect } = require('chai');
const sinon = require('sinon');

const IAMClient = require('@src/clients/aws-client/iam-client');

describe('Clients test - iam client test', () => {
    const TEST_AWS_PROFILE = 'TEST_AWS_PROFILE';
    const TEST_AWS_REGION = 'TEST_AWS_REGION';
    const TEST_CONFIGURATION = {
        awsProfile: TEST_AWS_PROFILE,
        awsRegion: TEST_AWS_REGION
    };
    const TEST_ROLE_ARN = 'iam_role_arn';
    const TEST_SKILL_NAME = 'skill_name';

    afterEach(() => {
        sinon.restore();
    });

    describe('# constructor tests', () => {
        it('| inspect correctness for constructor when awsRegion is set in configuration.', () => {
            const iamClient = new IAMClient(TEST_CONFIGURATION);
            expect(iamClient).to.be.instanceOf(IAMClient);
            expect(iamClient.awsRegion).equal(TEST_AWS_REGION);
            expect(aws.config.region).equal(TEST_AWS_REGION);
            expect(aws.config.credentials).deep.equal(new aws.SharedIniFileCredentials({ profile: TEST_AWS_PROFILE }));
        });

        it('| inspect an error for constructor when awsRegion is null in configuration.', () => {
            const configuration = {
                awsProfile: TEST_AWS_PROFILE,
                awsRegion: null
            };
            try {
                new IAMClient(configuration);
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
                new IAMClient(configuration);
            } catch (e) {
                expect(e.message).equal('Invalid awsProfile or Invalid awsRegion');
            }
        });
    });

    describe('# function getIAMRole tests', () => {
        it('| iamClient get IAM role request fails, expect an error return.', (done) => {
            // setup
            const iamClient = new IAMClient(TEST_CONFIGURATION);
            const TEST_GET_ROLE_ERR = 'GET_ROLE_ERROR';
            sinon.stub(iamClient.client, 'getRole').callsArgWith(1, TEST_GET_ROLE_ERR);
            // call
            iamClient.getIAMRole(TEST_ROLE_ARN, (err) => {
                // verify
                expect(err).equal(TEST_GET_ROLE_ERR);
                done();
            });
        });

        it('| iamClient get IAM role request passes, expect role data return.', (done) => {
            // setup
            const iamClient = new IAMClient(TEST_CONFIGURATION);
            const TEST_GET_ROLE_RESPONSE = {
                Role: {
                    Arn: TEST_ROLE_ARN
                }
            };
            sinon.stub(iamClient.client, 'getRole').callsArgWith(1, null, TEST_GET_ROLE_RESPONSE);
            // call
            iamClient.getIAMRole(TEST_ROLE_ARN, (err, data) => {
                // verify
                expect(data.Role.Arn).equal(TEST_ROLE_ARN);
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# function createBasicLambdaRole tests', () => {
        it('| iamClient create basic Lambda role request fails, expect an error return.', (done) => {
            // setup
            const iamClient = new IAMClient(TEST_CONFIGURATION);
            const TEST_CREATE_ROLE_ERR = 'CREATE_ROLE_ERROR';
            sinon.stub(iamClient.client, 'createRole').callsArgWith(1, TEST_CREATE_ROLE_ERR);
            // call
            iamClient.createBasicLambdaRole(TEST_SKILL_NAME, (err) => {
                // verify
                expect(err).equal(TEST_CREATE_ROLE_ERR);
                done();
            });
        });

        it('| iamClient create basic Lambda role request passes, expect role data return.', (done) => {
            // setup
            const iamClient = new IAMClient(TEST_CONFIGURATION);
            const TEST_CREATE_ROLE_RESPONSE = {
                Role: {
                    Arn: TEST_ROLE_ARN
                }
            };
            sinon.stub(iamClient.client, 'createRole').callsArgWith(1, null, TEST_CREATE_ROLE_RESPONSE);
            // call
            iamClient.createBasicLambdaRole(TEST_SKILL_NAME, (err, data) => {
                // verify
                expect(data.Role.Arn).equal(TEST_ROLE_ARN);
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# function attachBasicLambdaRolePolicy tests', () => {
        it('| iamClient attach basic Lambda role policy request fails, expect an error return.', (done) => {
            // setup
            const iamClient = new IAMClient(TEST_CONFIGURATION);
            const TEST_ATTACH_POLICY_ERR = 'ATTACH_POLICY_ERROR';
            sinon.stub(iamClient.client, 'attachRolePolicy').callsArgWith(1, TEST_ATTACH_POLICY_ERR);
            // call
            iamClient.attachBasicLambdaRolePolicy(TEST_ROLE_ARN, (err) => {
                // verify
                expect(err).equal(TEST_ATTACH_POLICY_ERR);
                done();
            });
        });

        it('| iamClient attach basic Lambda role policy request passes, expect null error return.', (done) => {
            // setup
            const iamClient = new IAMClient(TEST_CONFIGURATION);
            sinon.stub(iamClient.client, 'attachRolePolicy').callsArgWith(1, null);
            // call
            iamClient.attachBasicLambdaRolePolicy(TEST_ROLE_ARN, (err) => {
                // verify
                expect(err).equal(null);
                done();
            });
        });
    });
});
