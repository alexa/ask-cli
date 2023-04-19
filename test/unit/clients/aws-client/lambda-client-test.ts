import {expect} from "chai";
import sinon from "sinon";
import {
  LambdaClient as _LambdaClient,
  AddPermissionCommand,
  CreateFunctionCommand,
  GetFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";

import LambdaClient from "../../../../lib/clients/aws-client/lambda-client";

describe("Clients test - lambda client test", () => {
  const TEST_AWS_PROFILE = "TEST_AWS_PROFILE";
  const TEST_AWS_REGION = "TEST_AWS_REGION";
  const TEST_CONFIGURATION = {
    awsProfile: TEST_AWS_PROFILE,
    awsRegion: TEST_AWS_REGION,
  };
  const TEST_FUNCTION_ARN = "function_arn";
  const TEST_SKILL_ID = "skill_id";
  const TEST_REVISION_ID = "revision_id";
  const TEST_ZIPFILE = Buffer.from("zipfile");
  const TEST_FUNCTION_NAME = "function_name";
  const TEST_FUNCTION_RUNTIME = "function_runtime";
  const TEST_FUNCTION_HANDLER = "function_handler";
  const TEST_FUNCTION_MEMORY_SIZE = 512;
  const TEST_FUNCTION_TIMEOUT = 15;
  const TEST_FUNCTION_DESCRIPTION = "function_description";
  const TEST_FUNCTION_ENV_VARS = {TEST_ENV_1: "function_env_1"};
  const TEST_FUNCTION_CONFIG = {
    runtime: TEST_FUNCTION_RUNTIME,
    handler: TEST_FUNCTION_HANDLER,
    memorySize: TEST_FUNCTION_MEMORY_SIZE,
    timeout: TEST_FUNCTION_TIMEOUT,
    description: TEST_FUNCTION_DESCRIPTION,
    environmentVariables: TEST_FUNCTION_ENV_VARS,
  };
  let lambdaClient: LambdaClient, sendCommandStub: sinon.SinonStub;

  beforeEach(() => {
    lambdaClient = new LambdaClient(TEST_CONFIGURATION);
    sendCommandStub = sinon.stub(_LambdaClient.prototype, "send");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("# constructor tests", () => {
    it("| inspect correctness for constructor when awsRegion is set in configuration.", () => {
      expect(lambdaClient).to.be.instanceOf(LambdaClient);
      expect(lambdaClient.credentials).to.be.a("function");
      expect(lambdaClient.profile).equal(TEST_AWS_PROFILE);
      expect(lambdaClient.region).equal(TEST_AWS_REGION);
    });

    it("| inspect an error for constructor when awsRegion is null in configuration.", () => {
      const configuration = {
        awsProfile: TEST_AWS_PROFILE,
        awsRegion: undefined,
      };
      expect(() => new LambdaClient(configuration)).to.throw("Invalid awsProfile or Invalid awsRegion");
    });

    it("| inspect an error for constructor when awsRegion is blank in configuration.", () => {
      const configuration = {
        awsProfile: "    ",
        awsRegion: TEST_AWS_REGION,
      };
      expect(() => new LambdaClient(configuration)).to.throw("Invalid awsProfile or Invalid awsRegion");
    });
  });

  describe("# function createLambdaFunction tests", () => {
    const TEST_IAM_ROLE = "iam_role";

    it("| call aws-sdk createFunctionCommand with same params from input", () => {
      // call
      lambdaClient.createLambdaFunction(TEST_FUNCTION_NAME, TEST_FUNCTION_CONFIG, TEST_IAM_ROLE, TEST_ZIPFILE);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(CreateFunctionCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        Code: {
          ZipFile: TEST_ZIPFILE,
        },
        FunctionName: TEST_FUNCTION_NAME,
        Handler: TEST_FUNCTION_HANDLER,
        MemorySize: TEST_FUNCTION_MEMORY_SIZE,
        Role: TEST_IAM_ROLE,
        Runtime: TEST_FUNCTION_RUNTIME,
        Timeout: TEST_FUNCTION_TIMEOUT,
        Description: TEST_FUNCTION_DESCRIPTION,
        Environment: {
          Variables: TEST_FUNCTION_ENV_VARS,
        },
      });
    });

    it("| create Lambda function request fails, expect an error return.", (done) => {
      // setup
      const TEST_CREATE_FUNCTION_ERR = new Error("create_function_error");
      sendCommandStub.rejects(TEST_CREATE_FUNCTION_ERR);
      // call
      lambdaClient.createLambdaFunction(TEST_FUNCTION_NAME, TEST_FUNCTION_CONFIG, TEST_IAM_ROLE, TEST_ZIPFILE).catch((err) => {
        // verify
        expect(err).equal(TEST_CREATE_FUNCTION_ERR);
        done();
      });
    });

    it("| create Lambda function request passes, expect lambda data return.", (done) => {
      // setup
      const TEST_CREATE_FUNCTION_RESPONSE = {
        FunctionArn: TEST_FUNCTION_ARN,
      };
      sendCommandStub.resolves(TEST_CREATE_FUNCTION_RESPONSE);
      // call
      lambdaClient.createLambdaFunction(TEST_FUNCTION_NAME, TEST_FUNCTION_CONFIG, TEST_IAM_ROLE, TEST_ZIPFILE).then((res) => {
        // verify
        expect(res.FunctionArn).equal(TEST_FUNCTION_ARN);
        done();
      });
    });
  });

  describe("# function addAlexaPermissionByDomain tests", () => {
    it("| call aws-sdk addPermissionCommand with same params from input", () => {
      // setup
      const TEST_DOMAIN = "custom";
      const now = Date.now();
      sinon.useFakeTimers(now);
      // call
      lambdaClient.addAlexaPermissionByDomain(TEST_DOMAIN, TEST_SKILL_ID, TEST_FUNCTION_ARN);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(AddPermissionCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        FunctionName: TEST_FUNCTION_ARN,
        StatementId: now.toString(),
        Action: "lambda:InvokeFunction",
        Principal: "alexa-appkit.amazon.com",
        EventSourceToken: TEST_SKILL_ID,
      });
    });

    it("| add Alexa permission by custom domain request fails, expect an error return.", (done) => {
      // setup
      const TEST_DOMAIN = "custom";
      const TEST_ADD_PERMISSION_ERR = new Error("ADD_PERMISSION_ERROR");
      sendCommandStub.rejects(TEST_ADD_PERMISSION_ERR);
      // call
      lambdaClient.addAlexaPermissionByDomain(TEST_DOMAIN, TEST_SKILL_ID, TEST_FUNCTION_ARN).catch((err) => {
        // verify
        expect(err).equal(TEST_ADD_PERMISSION_ERR);
        done();
      });
    });

    it("| add Alexa permission by smartHome domain request fails, expect an error return.", (done) => {
      // setup
      const TEST_DOMAIN = "smartHome";
      const TEST_ADD_PERMISSION_ERR = new Error("ADD_PERMISSION_ERROR");
      sendCommandStub.rejects(TEST_ADD_PERMISSION_ERR);
      // call
      lambdaClient.addAlexaPermissionByDomain(TEST_DOMAIN, TEST_SKILL_ID, TEST_FUNCTION_ARN).catch((err) => {
        // verify
        expect(err).equal(TEST_ADD_PERMISSION_ERR);
        done();
      });
    });

    it("| add Alexa permission by video domain request passes, expect a response.", (done) => {
      // setup
      const TEST_DOMAIN = "video";
      const TEST_ADD_PERMISSION_RESPOSNE = "ADD_PERMISSION_RESPOSNE";
      sendCommandStub.resolves(TEST_ADD_PERMISSION_RESPOSNE);
      // call
      lambdaClient.addAlexaPermissionByDomain(TEST_DOMAIN, TEST_SKILL_ID, TEST_FUNCTION_ARN).then((res) => {
        // verify
        expect(res).equal(TEST_ADD_PERMISSION_RESPOSNE);
        done();
      });
    });

    it("| add Alexa permission by invlid domain request fails, expect an error return.", (done) => {
      // setup
      const TEST_DOMAIN = "non-existing";
      const TEST_ADD_PERMISSION_ERR = new Error("ADD_PERMISSION_ERROR");
      sendCommandStub.rejects(TEST_ADD_PERMISSION_ERR);
      // call
      lambdaClient.addAlexaPermissionByDomain(TEST_DOMAIN, TEST_SKILL_ID, TEST_FUNCTION_ARN).catch((err) => {
        // verify
        expect(err).equal(TEST_ADD_PERMISSION_ERR);
        done();
      });
    });
  });

  describe("# function getFunction tests", () => {
    it("| call aws-sdk getFunctionCommand with same params from input", () => {
      // call
      lambdaClient.getFunction(TEST_FUNCTION_ARN);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(GetFunctionCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        FunctionName: TEST_FUNCTION_ARN,
      });
    });

    it("| get Function request fails, expect an error return.", (done) => {
      // setup
      const TEST_GET_FUNCTION_ERR = new Error("GET_FUNCTION_ERROR");
      sendCommandStub.rejects(TEST_GET_FUNCTION_ERR);
      // call
      lambdaClient.getFunction(TEST_FUNCTION_ARN).catch((err) => {
        // verify
        expect(err).equal(TEST_GET_FUNCTION_ERR);
        done();
      });
    });

    it("| get Function request passes, expect a revision id return.", (done) => {
      // setup
      const TEST_GET_FUNCTION_RESPONSE = {
        Configuration: {
          RevisionId: TEST_REVISION_ID,
        },
      };
      sendCommandStub.resolves(TEST_GET_FUNCTION_RESPONSE);
      // call
      lambdaClient.getFunction(TEST_FUNCTION_ARN).then((res) => {
        // verify
        expect(res.Configuration?.RevisionId).equal(TEST_REVISION_ID);
        done();
      });
    });
  });

  describe("# function updateFunctionCode tests", () => {
    it("| call aws-sdk updateFunctionCodeCommand with same params from input", () => {
      // call
      lambdaClient.updateFunctionCode(TEST_FUNCTION_ARN, TEST_ZIPFILE, TEST_REVISION_ID);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(UpdateFunctionCodeCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        FunctionName: TEST_FUNCTION_ARN,
        ZipFile: TEST_ZIPFILE,
        RevisionId: TEST_REVISION_ID,
      });
    });

    it("| update function code request fails, expect an error return.", (done) => {
      // setup
      const TEST_UPDATE_CODE_ERR = new Error("UPDATE_CODE_ERROR");
      sendCommandStub.rejects(TEST_UPDATE_CODE_ERR);
      // call
      lambdaClient.updateFunctionCode(TEST_FUNCTION_ARN, TEST_ZIPFILE, TEST_REVISION_ID).catch((err) => {
        // verify
        expect(err).equal(TEST_UPDATE_CODE_ERR);
        done();
      });
    });

    it("| update function code request passes, expect function data return.", (done) => {
      // setup
      const TEST_UPDATE_CODE_RESPONSE = {
        FunctionArn: TEST_FUNCTION_ARN,
      };
      sendCommandStub.resolves(TEST_UPDATE_CODE_RESPONSE);
      // call
      lambdaClient.updateFunctionCode(TEST_FUNCTION_ARN, TEST_ZIPFILE, TEST_REVISION_ID).then((res) => {
        // verify
        expect(res.FunctionArn).equal(TEST_FUNCTION_ARN);
        done();
      });
    });
  });

  describe("# function update function configuration tests", () => {
    it("| call aws-sdk updateFunctionConfigurationCommand with same params from input", () => {
      // call
      lambdaClient.updateFunctionConfiguration(TEST_FUNCTION_ARN, TEST_FUNCTION_CONFIG, TEST_REVISION_ID);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(UpdateFunctionConfigurationCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        FunctionName: TEST_FUNCTION_ARN,
        Handler: TEST_FUNCTION_HANDLER,
        MemorySize: TEST_FUNCTION_MEMORY_SIZE,
        RevisionId: TEST_REVISION_ID,
        Runtime: TEST_FUNCTION_RUNTIME,
        Timeout: TEST_FUNCTION_TIMEOUT,
        Description: TEST_FUNCTION_DESCRIPTION,
        Environment: {
          Variables: TEST_FUNCTION_ENV_VARS,
        },
      });
    });

    it("| update function configuration request fails, expect an error return.", (done) => {
      // setup
      const TEST_UPDATE_CONFIG_ERR = new Error("UPDATE_CONFIG_ERROR");
      sendCommandStub.rejects(TEST_UPDATE_CONFIG_ERR);
      // call
      lambdaClient.updateFunctionConfiguration(TEST_FUNCTION_ARN, TEST_FUNCTION_CONFIG, TEST_REVISION_ID).catch((err) => {
        // verify
        expect(err).equal(TEST_UPDATE_CONFIG_ERR);
        done();
      });
    });

    it("| update function configuration request passes, expect null error return.", (done) => {
      // setup
      const TEST_UPDATE_CONFIG_RESPONSE = {
        RevisionId: TEST_REVISION_ID,
      };
      sendCommandStub.resolves(TEST_UPDATE_CONFIG_RESPONSE);
      // call
      lambdaClient.updateFunctionConfiguration(TEST_FUNCTION_ARN, TEST_FUNCTION_CONFIG, TEST_REVISION_ID).then((res) => {
        // verify
        expect(res.RevisionId).equal(TEST_REVISION_ID);
        done();
      });
    });
  });
});
