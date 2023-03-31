const {expect} = require("chai");
const sinon = require("sinon");

const awsUtil = require("../../../../lib/clients/aws-client/aws-util");
const CONSTANTS = require("../../../../lib/utils/constants");
const helper = require("../../../../lib/builtins/deploy-delegates/lambda-deployer/helper");
const lambdaDeployer = require("../../../../lib/builtins/deploy-delegates/lambda-deployer/index");

describe("Builtins test - lambda-deployer index.js test", () => {
  const TEST_PROFILE = "default"; // test file uses 'default' profile
  const TEST_IGNORE_HASH = false;
  const TEST_ALEXA_REGION_DEFAULT = "default";
  const TEST_ALEXA_REGION_NA = "NA";
  const TEST_AWS_REGION_DEFAULT = "us-east-1";
  const TEST_AWS_REGION_NA = "us-east-1";
  const TEST_SKILL_NAME = "skill_name";
  const TEST_IAM_ROLE_ARN = "IAM role arn";
  const NULL_PROFILE = "null";
  const LAMBDA_ARN = "lambda_arn";
  const LAST_MODIFIED = "last_modified";
  const REVISION_ID = "1";

  describe("# test class method: bootstrap", () => {
    afterEach(() => {
      sinon.restore();
    });

    it("| awsProfile and awsDefaultRegion are set, expect config is updated correctly", (done) => {
      // set up
      const TEST_OPTIONS = {
        profile: TEST_PROFILE,
        userConfig: {},
      };
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      sinon
        .stub(awsUtil, "getCLICompatibleDefaultRegion")
        .withArgs(TEST_PROFILE)
        .returns(CONSTANTS.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION);
      // call
      lambdaDeployer.bootstrap(TEST_OPTIONS, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).deep.equal({
          userConfig: {awsRegion: CONSTANTS.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION},
        });
        done();
      });
    });
  });

  describe("# test case method: invoke", () => {
    const REPORTER = {};
    const TEST_OPTIONS = {
      profile: TEST_PROFILE,
      ignoreHash: TEST_IGNORE_HASH,
      alexaRegion: TEST_ALEXA_REGION_DEFAULT,
      skillId: "",
      skillName: TEST_SKILL_NAME,
      code: {},
      userConfig: {},
      deployState: {},
      deployRegions: {
        [TEST_ALEXA_REGION_DEFAULT]: TEST_AWS_REGION_DEFAULT,
      },
    };
    const TEST_VALIDATED_DEPLOY_STATE = {
      lambda: {},
      iamRole: {},
    };

    afterEach(() => {
      sinon.restore();
    });

    it("| profile is not set, expect an error return", (done) => {
      // setup
      const TEST_OPTIONS_WITHOUT_PROFILE = {
        profile: null,
      };
      const TEST_ERROR = `Profile [${NULL_PROFILE}] doesn't have AWS profile linked to it. \
Please run "ask configure" to re-configure your profile.`;
      sinon.stub(awsUtil, "getAWSProfile").withArgs(NULL_PROFILE).returns(NULL_PROFILE);
      // call
      lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_PROFILE, (err) => {
        // verify
        expect(err).equal(TEST_ERROR);
        done();
      });
    });

    it("| profile is set, alexaRegion is not set correctly, expect an error return", (done) => {
      // setup
      const TEST_OPTIONS_WITHOUT_REGION = {
        profile: TEST_PROFILE,
        alexaRegion: null,
        skillId: "",
        skillName: TEST_SKILL_NAME,
        code: {},
        userConfig: {},
        deployState: {},
        deployRegions: {},
      };
      const TEST_ERROR = `Unsupported Alexa region: ${null}. Please check your region name or use "regionalOverrides" to specify AWS region.`;
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      // call
      lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITHOUT_REGION, (err) => {
        // verify
        expect(err).equal(TEST_ERROR);
        done();
      });
    });

    it("| alexaRegion is set correctly, validate Lambda deploy state fails, expect an error message return", (done) => {
      // setup
      const TEST_ERROR = "loadLambdaInformation error message";
      const TEST_ERROR_MESSAGE_RESPONSE = `The lambda deploy failed for Alexa region "default": ${TEST_ERROR}`;
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      sinon.stub(helper, "loadLambdaInformation").callsArgWith(2, TEST_ERROR);
      // call
      lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, res) => {
        // verify
        expect(res.resultMessage).equal(TEST_ERROR_MESSAGE_RESPONSE);
        expect(err).equal(null);
        done();
      });
    });

    it("| validate Lambda deploy state passes, deploy IAM role fails, expect an error message return", (done) => {
      // setup
      const TEST_ERROR = "IAMRole error message";
      const TEST_ERROR_MESSAGE_RESPONSE = `The lambda deploy failed for Alexa region "default": ${TEST_ERROR}`;
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      sinon.stub(helper, "loadLambdaInformation").callsArgWith(2, null, TEST_VALIDATED_DEPLOY_STATE);
      sinon.stub(helper, "deployIAMRole").callsArgWith(2, TEST_ERROR);
      // call
      lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, res) => {
        // verify
        expect(res.resultMessage).equal(TEST_ERROR_MESSAGE_RESPONSE);
        expect(err).equal(null);
        done();
      });
    });

    it("| deploy IAM role passes, deploy Lambda Function fails, expect IAM role arn and an error message return", (done) => {
      // setup
      const TEST_ERROR = "LambdaFunction error message";
      const TEST_ERROR_MESSAGE_RESPONSE = `The lambda deploy failed for Alexa region "default": ${TEST_ERROR}`;
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      sinon.stub(helper, "loadLambdaInformation").callsArgWith(2, null, TEST_VALIDATED_DEPLOY_STATE);
      sinon.stub(helper, "deployIAMRole").callsArgWith(2, null, TEST_IAM_ROLE_ARN);
      sinon.stub(helper, "deployLambdaFunction").callsArgWith(2, TEST_ERROR);
      // call
      lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, res) => {
        // verify
        expect(res.resultMessage).equal(TEST_ERROR_MESSAGE_RESPONSE);
        expect(res.deployState.iamRole).equal(TEST_IAM_ROLE_ARN);
        expect(err).equal(null);
        done();
      });
    });

    it("| deploy IAM role passes, deploy Lambda config fails, expect all data, except endpoint, and an error message returned", (done) => {
      // setup
      const TEST_ERROR = "LambdaFunction error message";
      const TEST_ERROR_MESSAGE_RESPONSE = `The lambda deploy failed for Alexa region "default": ${TEST_ERROR}`;
      const LAMDBA_RESPONSE = {
        arn: LAMBDA_ARN,
        lastModified: LAST_MODIFIED,
        revisionId: REVISION_ID,
      };
      const TEST_LAMBDA_RESULT = {
        isAllStepSuccess: false,
        isCodeDeployed: true,
        lambdaResponse: LAMDBA_RESPONSE,
        resultMessage: TEST_ERROR,
      };
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      sinon.stub(helper, "loadLambdaInformation").callsArgWith(2, null, TEST_VALIDATED_DEPLOY_STATE);
      sinon.stub(helper, "deployIAMRole").callsArgWith(2, null, TEST_IAM_ROLE_ARN);
      sinon.stub(helper, "deployLambdaFunction").callsArgWith(2, null, TEST_LAMBDA_RESULT);
      // call
      lambdaDeployer.invoke(REPORTER, TEST_OPTIONS, (err, res) => {
        // verify
        expect(res.endpoint).equal(undefined);
        expect(res.deployState.iamRole).equal(TEST_IAM_ROLE_ARN);
        expect(res.deployState.lambda).deep.equal(LAMDBA_RESPONSE);
        expect(res.resultMessage).equal(TEST_ERROR_MESSAGE_RESPONSE);
        expect(err).equal(null);
        done();
      });
    });

    it("| deploy IAM role and Lambda Function pass, expect correct data return", (done) => {
      // setup
      const TEST_SUCCESS_RESPONSE = `The lambda deploy succeeded for Alexa region "${TEST_ALEXA_REGION_DEFAULT}" \
with output Lambda ARN: ${LAMBDA_ARN}.`;
      const LAMDBA_RESPONSE = {
        arn: LAMBDA_ARN,
        lastModified: LAST_MODIFIED,
        revisionId: REVISION_ID,
      };
      const TEST_LAMBDA_RESULT = {
        isAllStepSuccess: true,
        isCodeDeployed: true,
        lambdaResponse: LAMDBA_RESPONSE,
      };
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      sinon.stub(helper, "loadLambdaInformation").callsArgWith(2, null, TEST_VALIDATED_DEPLOY_STATE);
      sinon.stub(helper, "deployIAMRole").callsArgWith(2, null, TEST_IAM_ROLE_ARN);
      sinon.stub(helper, "deployLambdaFunction").callsArgWith(2, null, TEST_LAMBDA_RESULT);
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

    it("| not primary deployRegion in multi-regions environment, expect deploy skipped message return", (done) => {
      // setup
      const TEST_OPTIONS_WITH_MULTI_REGIONS = {
        ...TEST_OPTIONS,
        alexaRegion: TEST_ALEXA_REGION_NA,
        deployRegions: {
          [TEST_ALEXA_REGION_DEFAULT]: TEST_AWS_REGION_DEFAULT,
          [TEST_ALEXA_REGION_NA]: TEST_AWS_REGION_NA,
        },
      };
      const TEST_SKIPPED_RESPONSE = `The lambda deploy for Alexa region "${TEST_ALEXA_REGION_NA}" is same as "${TEST_ALEXA_REGION_DEFAULT}"`;
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      // call
      lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITH_MULTI_REGIONS, (err, res) => {
        // verify
        expect(res.isDeploySkipped).equal(true);
        expect(res.deployRegion).equal(TEST_ALEXA_REGION_DEFAULT);
        expect(res.resultMessage).equal(TEST_SKIPPED_RESPONSE);
        expect(err).equal(null);
        done();
      });
    });

    it("| not primary deployRegion in multi-regions setup but different current deploy state, expect deploy not to be skipped", (done) => {
      // setup
      const TEST_OPTIONS_WITH_MULTI_REGIONS = {
        ...TEST_OPTIONS,
        alexaRegion: TEST_ALEXA_REGION_NA,
        deployState: {
          [TEST_ALEXA_REGION_DEFAULT]: {
            property: "1"
          },
          [TEST_ALEXA_REGION_NA]: {
            property: "2"
          },
        },
        deployRegions: {
          [TEST_ALEXA_REGION_DEFAULT]: TEST_AWS_REGION_DEFAULT,
          [TEST_ALEXA_REGION_NA]: TEST_AWS_REGION_NA,
        },
      };
      const TEST_SUCCESS_RESPONSE = `The lambda deploy succeeded for Alexa region "${TEST_ALEXA_REGION_NA}" \
with output Lambda ARN: ${LAMBDA_ARN}.`;
      const TEST_LAMBDA_RESULT = {
        isAllStepSuccess: true,
        isCodeDeployed: true,
        lambdaResponse: {arn: LAMBDA_ARN},
      };
      sinon.stub(awsUtil, "getAWSProfile").withArgs(TEST_PROFILE).returns(TEST_PROFILE);
      sinon.stub(helper, "loadLambdaInformation").callsArgWith(2, null, TEST_VALIDATED_DEPLOY_STATE);
      sinon.stub(helper, "deployIAMRole").callsArgWith(2, null, TEST_IAM_ROLE_ARN);
      sinon.stub(helper, "deployLambdaFunction").callsArgWith(2, null, TEST_LAMBDA_RESULT);
      // call
      lambdaDeployer.invoke(REPORTER, TEST_OPTIONS_WITH_MULTI_REGIONS, (err, res) => {
        // verify
        console.log(res);
        expect(res.isAllStepSuccess).equal(true);
        expect(res.isCodeDeployed).equal(true);
        expect(res.isDeploySkipped).equal(undefined);
        expect(res.deployRegion).equal(undefined);
        expect(res.resultMessage).equal(TEST_SUCCESS_RESPONSE);
        expect(err).equal(null);
        done();
      });
    });
  });
});
