const { expect } = require('chai');
const sinon = require('sinon');

const awsUtil = require('@src/clients/aws-client/aws-util');
const CONSTANTS = require('@src/utils/constants');
const helper = require('@src/builtins/deploy-delegates/lambda-deployer/helper');
const lambdaDeployer = require('@src/builtins/deploy-delegates/lambda-deployer/index');

describe('Builtins test - lambda-deployer index.js test', () => {
    const TEST_PROFILE = 'default'; // test file uses 'default' profile
    const TEST_IGNORE_HASH = false;
    const TEST_ALEXA_REGION_DEFAULT = 'default';
    const TEST_AWS_REGION_DEFAULT = 'us-east-1';
    const TEST_SKILL_NAME = 'skill_name';
    const TEST_IAM_ROLE_ARN = 'IAM role arn';
    const NULL_PROFILE = 'null';

    describe('# test class method: bootstrap', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| awsProfile and awsDefaultRegion are set, expect config is updated correctly', (done) => {
            // set up
            const TEST_OPTIONS = {
                profile: TEST_PROFILE,
                userConfig: {}
            };
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(awsUtil, 'getCLICompatibleDefaultRegion').withArgs(TEST_PROFILE).returns(CONSTANTS.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION);
            // call
            lambdaDeployer.bootstrap(TEST_OPTIONS, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).deep.equal({
                    userConfig: { awsRegion: CONSTANTS.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION }
                });
                done();
            });
        });
    });

    describe('# test case method: invoke', () => {
        const REPORTER = {};
        const TEST_OPTIONS = {
            profile: TEST_PROFILE,
            ignoreHash: TEST_IGNORE_HASH,
            alexaRegion: TEST_ALEXA_REGION_DEFAULT,
            skillId: '',
            skillName: TEST_SKILL_NAME,
            code: {},
            userConfig: {
                awsRegion: TEST_AWS_REGION_DEFAULT
            },
            deployState: {}
        };
        const TEST_VALIDATED_DEPLOY_STATE = {
            updatedDeployState: {}
        };

        afterEach(() => {
            sinon.restore();
        });

        it('| profile is not set, expect an error return', (done) => {
            // setup
            const TEST_OPTIONS_WITHOUT_PROFILE = {
                profile: null,
            };
            const TEST_ERROR = `Profile [${NULL_PROFILE}] doesn't have AWS profile linked to it. \
Please run "ask configure" to re-configure your porfile.`;
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(NULL_PROFILE).returns(NULL_PROFILE);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_PROFILE, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| profile is set, alexaRegion is not set correctly, expect an error return', (done) => {
            // setup
            const TEST_OPTIONS_WITHOUT_REGION = {
                profile: TEST_PROFILE,
                alexaRegion: null,
                skillId: '',
                skillName: TEST_SKILL_NAME,
                code: {},
                userConfig: {},
                deployState: {}
            };
            const TEST_ERROR = `Unsupported Alexa region: ${null}. Please check your region name or use "regionalOverrides" to specify AWS region.`;
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_REGION, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| alexaRegion is set correctly, validate Lambda deploy state fails, expect an error return', (done) => {
            // setup
            const TEST_ERROR = 'validateLambdaDeployState error message';
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, TEST_ERROR);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| validate Lambda deploy state passes, deploy IAM role fails, expect an error return', (done) => {
            // setup
            const TEST_ERROR = 'IAMRole error message';
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, TEST_ERROR);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| deploy IAM role passes, deploy Lambda Function fails, expect IAM role arn and an error message return', (done) => {
            // setup
            const TEST_ERROR = 'LambdaFunction error message';
            const TEST_ERROR_MESSAGE_RESPONSE = `The lambda deploy failed for Alexa region "default": ${TEST_ERROR}`;
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, TEST_IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, TEST_ERROR);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, data) => {
                // verify
                expect(data.resultMessage).equal(TEST_ERROR_MESSAGE_RESPONSE);
                expect(data.deployState.iamRole).equal(TEST_IAM_ROLE_ARN);
                done();
            });
        });

        it('| deploy IAM role passes, deploy Lambda code configuration fails, expect IAM role arn, revisionId and a message returned', (done) => {
            // setup
            const TEST_ERROR = 'LambdaFunction error message';
            const TEST_ERROR_MESSAGE_RESPONSE = `The lambda deploy failed for Alexa region "default": ${TEST_ERROR}`;
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, TEST_IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, TEST_ERROR);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, data) => {
                // verify
                expect(data.resultMessage).equal(TEST_ERROR_MESSAGE_RESPONSE);
                expect(data.deployState.iamRole).equal(TEST_IAM_ROLE_ARN);
                done();
            });
        });

        it('| deploy IAM role and Lambda Function pass, expect correct data return', (done) => {
            // setup
            const LAMBDA_ARN = 'lambda_arn';
            const LAST_MODIFIED = 'last_modified';
            const REVISION_ID = '1';
            const TEST_SUCCESS_RESPONSE = `The lambda deploy succeeded for Alexa region "${TEST_ALEXA_REGION_DEFAULT}" \
with output Lambda ARN: ${LAMBDA_ARN}.`;
            const LAMDBA_RESPONSE = {
                arn: LAMBDA_ARN,
                lastModified: LAST_MODIFIED,
                revisionId: REVISION_ID
            };
            const TEST_LAMBDA_RESULT = {
                isAllStepSuccess: true,
                isCodeDeployed: true,
                lambdaResponse: LAMDBA_RESPONSE
            };
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, TEST_IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, null, TEST_LAMBDA_RESULT);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, res) => {
                // verify
                expect(res.endpoint.uri).equal(LAMBDA_ARN);
                expect(res.deployState.iamRole).equal(TEST_IAM_ROLE_ARN);
                expect(res.deployState.lambda).deep.equal(LAMDBA_RESPONSE);
                expect(res.resultMessage).equal(TEST_SUCCESS_RESPONSE);
                expect(err).equal(null);
                done();
            });
        });

        it('| alexaRegion is default, userConfig awsRegion is set, expect awsRegion is retrieved correctly.', (done) => {
            // setup
            const USER_CONFIG_AWS_REGION = 'sa-east-1';
            const TEST_OPTIONS_WITHOUT_AWS_REGION = {
                profile: TEST_PROFILE,
                alexaRegion: TEST_ALEXA_REGION_DEFAULT,
                skillId: '',
                skillName: TEST_SKILL_NAME,
                code: {},
                userConfig: {
                    awsRegion: USER_CONFIG_AWS_REGION
                },
                deployState: {}
            };
            const TEST_LAMBDA_RESULT = {
                isAllStepSuccess: true,
                isCodeDeployed: true,
                lambdaResponse: {}
            };
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, TEST_IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, null, TEST_LAMBDA_RESULT);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_AWS_REGION, (err) => {
                // verify
                expect(err).equal(null);
                expect(helper.validateLambdaDeployState.args[0][2]).equal(USER_CONFIG_AWS_REGION);
                expect(helper.deployIAMRole.args[0][4]).equal(USER_CONFIG_AWS_REGION);
                done();
            });
        });

        it('| alexaRegion is default, userConfig awsRegion is NOT set, expect awsRegion is set based on Alexa and AWS region map.', (done) => {
            // setup
            const MAPPING_ALEXA_DEFAULT_AWS_REGION = 'us-east-1';
            const TEST_OPTIONS_WITHOUT_AWS_REGION = {
                profile: TEST_PROFILE,
                alexaRegion: TEST_ALEXA_REGION_DEFAULT,
                skillId: '',
                skillName: TEST_SKILL_NAME,
                code: {},
                userConfig: {},
                deployState: {}
            };
            const LAMDBA_RESULT = {};
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, TEST_IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, null, LAMDBA_RESULT);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_AWS_REGION, (err) => {
                // verify
                expect(err).equal(null);
                expect(helper.validateLambdaDeployState.args[0][2]).equal(MAPPING_ALEXA_DEFAULT_AWS_REGION);
                expect(helper.deployIAMRole.args[0][4]).equal(MAPPING_ALEXA_DEFAULT_AWS_REGION);
                done();
            });
        });

        it('| alexaRegion is not default, userConfig regionalOverrides awsRegion is set, expect awsRegion is retrieved correctly.', (done) => {
            // setup
            const TEST_ALEXA_REGION_EU = 'EU';
            const USER_CONFIG_AWS_REGION = 'eu-west-2';
            const TEST_OPTIONS_WITHOUT_EU_REGION = {
                profile: TEST_PROFILE,
                alexaRegion: TEST_ALEXA_REGION_EU,
                skillId: '',
                skillName: TEST_SKILL_NAME,
                code: {},
                userConfig: {
                    regionalOverrides: {
                        EU: {
                            awsRegion: USER_CONFIG_AWS_REGION
                        }
                    }
                },
                deployState: {}
            };
            const LAMDBA_RESULT = {};
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, TEST_IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, null, LAMDBA_RESULT);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_EU_REGION, (err) => {
                // verify
                expect(err).equal(null);
                expect(helper.validateLambdaDeployState.args[0][2]).equal(USER_CONFIG_AWS_REGION);
                expect(helper.deployIAMRole.args[0][4]).equal(USER_CONFIG_AWS_REGION);
                done();
            });
        });

        it('| alexaRegion is not default, userConfig regionalOverrides awsRegion is NOT set, '
        + 'expect awsRegion is set based on Alexa and AWS region map.', (done) => {
            // setup
            const TEST_ALEXA_REGION_EU = 'EU';
            const MAPPING_ALEXA_EU_AWS_REGION = 'eu-west-1';
            const TEST_OPTIONS_WITHOUT_AWS_REGION = {
                profile: TEST_PROFILE,
                alexaRegion: TEST_ALEXA_REGION_EU,
                skillId: '',
                skillName: TEST_SKILL_NAME,
                code: {},
                userConfig: {},
                deployState: {}
            };
            const LAMDBA_RESULT = {};
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(5, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, TEST_IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, null, LAMDBA_RESULT);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_AWS_REGION, (err) => {
                // verify
                expect(err).equal(null);
                expect(helper.validateLambdaDeployState.args[0][2]).equal(MAPPING_ALEXA_EU_AWS_REGION);
                expect(helper.deployIAMRole.args[0][4]).equal(MAPPING_ALEXA_EU_AWS_REGION);
                done();
            });
        });
    });
});
