import {expect} from "chai";
import sinon from "sinon";
import {IAMClient as _IAMClient, AttachRolePolicyCommand, CreateRoleCommand, GetRoleCommand} from "@aws-sdk/client-iam";

import IAMClient from "../../../../lib/clients/aws-client/iam-client";
import CONSTANTS from "../../../../lib/utils/constants";

describe("Clients test - iam client test", () => {
  const TEST_AWS_PROFILE = "TEST_AWS_PROFILE";
  const TEST_AWS_REGION = "TEST_AWS_REGION";
  const TEST_CONFIGURATION = {
    awsProfile: TEST_AWS_PROFILE,
    awsRegion: TEST_AWS_REGION,
  };
  const TEST_ROLE_ARN = "iam_role_arn";
  const TEST_ROLE_NAME = "iam_role_name";
  let iamClient: IAMClient, sendCommandStub: sinon.SinonStub;

  beforeEach(() => {
    iamClient = new IAMClient(TEST_CONFIGURATION);
    sendCommandStub = sinon.stub(_IAMClient.prototype, "send");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("# constructor tests", () => {
    it("| inspect correctness for constructor when awsRegion is set in configuration.", () => {
      expect(iamClient).to.be.instanceof(IAMClient);
      expect(iamClient.credentials).to.be.a("function");
      expect(iamClient.profile).equal(TEST_AWS_PROFILE);
      expect(iamClient.region).equal(TEST_AWS_REGION);
    });

    it("| inspect an error for constructor when awsRegion is null in configuration.", () => {
      const configuration = {
        awsProfile: TEST_AWS_PROFILE,
        awsRegion: undefined,
      };
      expect(() => new IAMClient(configuration)).to.throw("Invalid awsProfile or Invalid awsRegion");
    });

    it("| inspect an error for constructor when awsRegion is blank in configuration.", () => {
      const configuration = {
        awsProfile: "    ",
        awsRegion: TEST_AWS_REGION,
      };
      expect(() => new IAMClient(configuration)).to.throw("Invalid awsProfile or Invalid awsRegion");
    });
  });

  describe("# function getIAMRole tests", () => {
    it("| call aws-sdk getRoleCommand with same params from input", () => {
      // setup
      sendCommandStub.resolves();
      // call
      iamClient.getIAMRole(`role/${TEST_ROLE_ARN}`);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(GetRoleCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        RoleName: TEST_ROLE_ARN,
      });
    });

    it("| get IAM role request fails, expect an error return.", (done) => {
      // setup
      const TEST_GET_ROLE_ERR = new Error("GET_ROLE_ERROR");
      sendCommandStub.rejects(TEST_GET_ROLE_ERR);
      // call
      iamClient.getIAMRole(TEST_ROLE_ARN).catch((err) => {
        // verify
        expect(err).equal(TEST_GET_ROLE_ERR);
        done();
      });
    });

    it("| get IAM role request passes, expect role data return.", (done) => {
      // setup
      const TEST_GET_ROLE_RESPONSE = {
        Role: {
          Arn: TEST_ROLE_ARN,
        },
      };
      sendCommandStub.resolves(TEST_GET_ROLE_RESPONSE);
      // call
      iamClient.getIAMRole(TEST_ROLE_ARN).then((role) => {
        // verify
        expect(role?.Arn).equal(TEST_ROLE_ARN);
        done();
      });
    });
  });

  describe("# function createBasicLambdaRole tests", () => {
    it("| call aws-sdk CreateRoleCommand with same params from input", () => {
      // setup
      const policy = CONSTANTS.AWS.IAM.ROLE.LAMBDA_BASIC_ROLE.POLICY;
      sendCommandStub.resolves();
      // call
      iamClient.createBasicLambdaRole(TEST_ROLE_ARN);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(CreateRoleCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        RoleName: TEST_ROLE_ARN,
        AssumeRolePolicyDocument: JSON.stringify(policy),
      });
    });

    it("| create basic Lambda role request fails, expect an error return.", (done) => {
      // setup
      const TEST_CREATE_ROLE_ERR = new Error("CREATE_ROLE_ERROR");
      sendCommandStub.rejects(TEST_CREATE_ROLE_ERR);
      // call
      iamClient.createBasicLambdaRole(TEST_ROLE_ARN).catch((err) => {
        // verify
        expect(err).equal(TEST_CREATE_ROLE_ERR);
        done();
      });
    });

    it("| create basic Lambda role request passes, expect role data return.", (done) => {
      // setup
      const TEST_CREATE_ROLE_RESPONSE = {
        Role: {
          Arn: TEST_ROLE_ARN,
        },
      };
      sendCommandStub.resolves(TEST_CREATE_ROLE_RESPONSE);
      // call
      iamClient.createBasicLambdaRole(TEST_ROLE_NAME).then((role) => {
        // verify
        expect(role?.Arn).equal(TEST_ROLE_ARN);
        done();
      });
    });
  });

  describe("# function attachBasicLambdaRolePolicy tests", () => {
    it("| call aws-sdk AttachRolePolicyCommand with same params from input", () => {
      // call
      iamClient.attachBasicLambdaRolePolicy(TEST_ROLE_ARN);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(AttachRolePolicyCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        PolicyArn: CONSTANTS.AWS.IAM.ROLE.LAMBDA_BASIC_ROLE.POLICY_ARN,
        RoleName: TEST_ROLE_ARN,
      });
    });

    it("| attach basic Lambda role policy request fails, expect an error return.", (done) => {
      // setup
      const TEST_ATTACH_POLICY_ERR = new Error("ATTACH_POLICY_ERROR");
      sendCommandStub.rejects(TEST_ATTACH_POLICY_ERR);
      // call
      iamClient.attachBasicLambdaRolePolicy(TEST_ROLE_ARN).catch((err) => {
        // verify
        expect(err).equal(TEST_ATTACH_POLICY_ERR);
        done();
      });
    });

    it("| attach basic Lambda role policy request passes, expect a response.", (done) => {
      // setup
      const TEST_ATTACH_POLICY_RESPONSE = "TEST_ATTACH_POLICY_RESPONSE";
      sendCommandStub.resolves(TEST_ATTACH_POLICY_RESPONSE);
      // call
      iamClient.attachBasicLambdaRolePolicy(TEST_ROLE_ARN).then((res) => {
        // verify
        expect(res).equal(TEST_ATTACH_POLICY_RESPONSE);
        done();
      });
    });
  });
});
