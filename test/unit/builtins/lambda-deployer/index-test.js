const { expect } = require('chai');
const sinon = require('sinon');

const awsUtil = require('@src/clients/aws-client/aws-util');
const CONSTANTS = require('@src/utils/constants');
const helper = require('@src/builtins/deploy-delegates/lambda-deployer/helper');
const lambdaDeployer = require('@src/builtins/deploy-delegates/lambda-deployer/index');


describe('Builtins test - lambda-deployer index.js test', () => {
    const TEST_PROFILE = 'default'; // test file uses 'default' profile
    const TEST_ALEXA_REGION = 'default';
    const TEST_SKILL_NAME = 'skill_name';

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
        const NULL_PROFILE = null;
        const TEST_OPTIONS = {
            profile: TEST_PROFILE,
            alexaRegion: TEST_ALEXA_REGION,
            skillId: '',
            skillName: TEST_SKILL_NAME,
            code: {},
            userConfig: {},
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
                profile: NULL_PROFILE,
            };
            const TEST_ERROR = `Profile [${NULL_PROFILE}] doesn't have AWS profile linked to it. Please run "ask init" to re-configure your porfile.`;
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(NULL_PROFILE).returns(NULL_PROFILE);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_PROFILE, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| profile is set, awsRegion is blank, expect an error return', (done) => {
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

        it('| profile is set, validate Lambda deploy state fails, expect an error return', (done) => {
            // setup
            const TEST_ERROR = 'validateLambdaDeployState error message';
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(4, TEST_ERROR);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| profile is set, validate Lambda deploy state passes, deploy IAM role fails, expect an error return', (done) => {
            // setup
            const TEST_ERROR = 'IAMRole error message';
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(4, null, TEST_VALIDATED_DEPLOY_STATE);
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
            const IAM_ROLE_ARN = 'IAM role arn';
            const TEST_ERROR = 'LambdaFunction error message';
            const TEST_ERROR_MESSAGE_RESPONSE = `The lambda deploy failed for Alexa region "default": ${TEST_ERROR}`;
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(4, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, TEST_ERROR);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, data) => {
                // verify
                expect(data.reasons).to.be.an.instanceOf(Array);
                expect(data.reasons.length).equal(1);
                expect(data.message).equal(TEST_ERROR_MESSAGE_RESPONSE);
                expect(data.deployState.iamRole).equal(IAM_ROLE_ARN);
                done();
            });
        });

        it('| deploy IAM role and Lambda Function pass, expect correct data return', (done) => {
            // setup
            const IAM_ROLE_ARN = 'iam_role_arn';
            const LAMBDA_ARN = 'lambda_arn';
            const LAST_MODIFIED = 'last_modified';
            const REVISIONID = '1';
            const TEST_SUCCESS_RESPONSE = `The lambda deploy succeeded for Alexa region "${TEST_ALEXA_REGION}" \
with output Lambda ARN: ${LAMBDA_ARN}.`;
            const LAMDBA_RESUALT = {
                arn: LAMBDA_ARN,
                lastModified: LAST_MODIFIED,
                revisionId: REVISIONID
            };
            sinon.stub(awsUtil, 'getAWSProfile').withArgs(TEST_PROFILE).returns(TEST_PROFILE);
            sinon.stub(helper, 'validateLambdaDeployState').callsArgWith(4, null, TEST_VALIDATED_DEPLOY_STATE);
            sinon.stub(helper, 'deployIAMRole').callsArgWith(6, null, IAM_ROLE_ARN);
            sinon.stub(helper, 'deployLambdaFunction').callsArgWith(2, null, LAMDBA_RESUALT);
            // call
            lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, res) => {
                // verify
                expect(res.endpoint.uri).equal(LAMBDA_ARN);
                expect(res.deployState.iamRole).equal(IAM_ROLE_ARN);
                expect(res.message).equal(TEST_SUCCESS_RESPONSE);
                expect(err).equal(null);
                done();
            });
        });
    });
});
