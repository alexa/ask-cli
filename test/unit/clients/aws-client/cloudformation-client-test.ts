import {expect} from "chai";
import sinon from "sinon";
import {
  CloudFormationClient as _CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
  DescribeStackEventsCommand,
  DescribeStackResourceCommand,
  DescribeStackResourcesCommand,
  UpdateStackCommand,
} from "@aws-sdk/client-cloudformation";

import CloudformationClient from "../../../../lib/clients/aws-client/cloudformation-client";

describe("Clients test - cloudformation client test", () => {
  const TEST_AWS_PROFILE = "AWS_PROFILE";
  const TEST_AWS_REGION = "AWS_REGION";
  const TEST_CLIENT_ERROR = new Error("CLIENT_ERR");
  const TEST_CLIENT_RESPONSE = "CLIENT_RESPONSE";
  const TEST_STACK_ID = "TEST_STACK_ID";
  const TEST_CONFIGURATION = {
    awsProfile: TEST_AWS_PROFILE,
    awsRegion: TEST_AWS_REGION,
  };
  const TEST_CREATE_RESPONSE = {
    StackId: TEST_STACK_ID,
  };
  const TEST_UPDATE_RESPONSE = {
    StackId: TEST_STACK_ID,
  };
  let cfnClient: CloudformationClient, sendCommandStub: sinon.SinonStub;

  beforeEach(() => {
    cfnClient = new CloudformationClient(TEST_CONFIGURATION);
    sendCommandStub = sinon.stub(_CloudFormationClient.prototype, "send");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Check correctness for constructor function", () => {
    it("| inspect correctness for constructor when awsRegion is set in configuration", () => {
      expect(cfnClient).to.be.instanceof(CloudformationClient);
      expect(cfnClient.credentials).to.be.a("function");
      expect(cfnClient.profile).equal(TEST_AWS_PROFILE);
      expect(cfnClient.region).equal(TEST_AWS_REGION);
    });

    it("| throw error when awsProfile or awsRegion is not passed in", () => {
      expect(() => new CloudformationClient({})).to.throw("Invalid awsProfile or Invalid awsRegion");
    });
  });

  describe("Test client method - createStack()", () => {
    const TEST_STACK_NAME = "STACK";
    const TEST_TEMPLATE = "TEMPLATE_CONTENT";
    const TEST_PARAMETERS = [{ParameterKey: "key", ParameterValue: "value"}];
    const TEST_CAPABILITIES = ["CAPABILITY_IAM"];

    it("| call aws-sdk createStack command with same params from input", () => {
      // setup
      sendCommandStub.resolves();
      // call
      cfnClient.createStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS, TEST_CAPABILITIES);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(CreateStackCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        StackName: TEST_STACK_NAME,
        TemplateBody: TEST_TEMPLATE,
        Capabilities: TEST_CAPABILITIES,
        Parameters: TEST_PARAMETERS,
      });
    });

    it("| call aws-sdk createStack command with same params from input without parameters", () => {
      // setup
      sendCommandStub.resolves();
      // call
      cfnClient.createStack(TEST_STACK_NAME, TEST_TEMPLATE, [], TEST_CAPABILITIES);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(CreateStackCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        StackName: TEST_STACK_NAME,
        TemplateBody: TEST_TEMPLATE,
        Capabilities: TEST_CAPABILITIES,
      });
    });

    it("| createStack returns response when client request succeeds", (done) => {
      // setup
      sendCommandStub.resolves(TEST_CREATE_RESPONSE);
      // call
      cfnClient.createStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS, TEST_CAPABILITIES).then((res) => {
        // verify
        expect(res).eql(TEST_STACK_ID);
        done();
      });
    });
  });

  describe("Test client method - updateStack()", () => {
    const TEST_STACK_NAME = "STACK";
    const TEST_TEMPLATE = "TEMPLATE_CONTENT";
    const TEST_PARAMETERS = [{ParameterKey: "key", ParameterValue: "value"}];
    const TEST_CAPABILITIES = ["CAPABILITY_IAM"];

    it("| call aws-sdk updateStackCommand with same params from input", () => {
      // setup
      sendCommandStub.resolves();
      // call
      cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS, TEST_CAPABILITIES);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(UpdateStackCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        StackName: TEST_STACK_NAME,
        TemplateBody: TEST_TEMPLATE,
        Capabilities: TEST_CAPABILITIES,
        Parameters: TEST_PARAMETERS,
      });
    });

    it("| call aws-sdk updateStackCommand with same params from input without parameters", () => {
      // setup
      sendCommandStub.resolves();
      // call
      cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, [], TEST_CAPABILITIES);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(UpdateStackCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        StackName: TEST_STACK_NAME,
        TemplateBody: TEST_TEMPLATE,
        Capabilities: TEST_CAPABILITIES,
      });
    });

    it("| updateStack method returns error when client request fails", (done) => {
      // setup
      sendCommandStub.rejects(TEST_CLIENT_ERROR);
      // call
      cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS, TEST_CAPABILITIES).catch((err) => {
        // verify
        expect(err).eql(TEST_CLIENT_ERROR);
        done();
      });
    });

    it("| updateStack returns with no response when no update to be performed", (done) => {
      // setup
      const NO_UPDATE_ERROR = {
        name: "ValidationError",
        message: "No updates are to be performed.",
      };
      sendCommandStub.rejects(NO_UPDATE_ERROR);
      // call
      cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS, TEST_CAPABILITIES).then((res) => {
        // verify
        expect(res).to.be.undefined;
        done();
      });
    });

    it("| updateStack returns response when client request succeeds", (done) => {
      // setup
      sendCommandStub.resolves(TEST_UPDATE_RESPONSE);
      // call
      cfnClient.updateStack(TEST_STACK_NAME, TEST_TEMPLATE, TEST_PARAMETERS, TEST_CAPABILITIES).then((res) => {
        // verify
        expect(res).eql(TEST_STACK_ID);
        done();
      });
    });
  });

  describe("Test client method - stackExists()", () => {
    it("| returns false when stack id is undefined", (done) => {
      // call
      cfnClient.stackExists(undefined).then((res) => {
        // verify
        expect(res).eql(false);
        done();
      });
    });

    it("| returns false when stack status is delete complete", (done) => {
      // setup
      sendCommandStub.resolves({Stacks: [{StackStatus: "DELETE_COMPLETE"}]});
      // call
      cfnClient.stackExists("someId").then((res) => {
        // verify
        expect(res).eql(false);
        done();
      });
    });

    it("| returns false when when no stack information available", (done) => {
      // setup
      sendCommandStub.resolves({});
      // call
      cfnClient.stackExists("someId").then((res) => {
        // verify
        expect(res).eql(false);
        done();
      });
    });

    it("| returns false when when getting stack status fails", (done) => {
      // setup
      sendCommandStub.rejects();
      // call
      cfnClient.stackExists("someId").then((res) => {
        // verify
        expect(res).eql(false);
        done();
      });
    });

    it("| returns true when request succeeds", (done) => {
      // setup
      sendCommandStub.resolves({Stacks: [{StackStatus: "test"}]});
      // call
      cfnClient.stackExists("someId").then((res) => {
        // verify
        expect(res).eql(true);
        done();
      });
    });
  });

  describe("Test client method - getStack()", () => {
    const TEST_STACK_NAME = "STACK";
    const TEST_DESCRIBE_RESPONSE = {
      Stacks: [TEST_CLIENT_RESPONSE],
    };

    it("| call aws-sdk describeStacksCommand with same params from input", () => {
      // setup
      sendCommandStub.resolves(TEST_DESCRIBE_RESPONSE);
      // call
      cfnClient.getStack(TEST_STACK_NAME);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(DescribeStacksCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        StackName: TEST_STACK_NAME,
      });
    });

    it("| getStack method callback with error when client request fails", (done) => {
      // setup
      sendCommandStub.rejects(TEST_CLIENT_ERROR);
      // call
      cfnClient.getStack(TEST_STACK_NAME).catch((err) => {
        // verify
        expect(err).equal(TEST_CLIENT_ERROR);
        done();
      });
    });

    it("| getStack method callback with response when client request succeeds", (done) => {
      // setup
      sendCommandStub.resolves(TEST_DESCRIBE_RESPONSE);
      // call
      cfnClient.getStack(TEST_STACK_NAME).then((res) => {
        // verify
        expect(res).equal(TEST_CLIENT_RESPONSE);
        done();
      });
    });
  });

  describe("Test client method - getStackEvents()", () => {
    const TEST_STACK_NAME = "STACK";
    const TEST_DESCRIBE_RESPONSE = {
      StackEvents: TEST_CLIENT_RESPONSE,
    };

    it("| call aws-sdk describeStackEventsCommand with same params from input", () => {
      // setup
      sendCommandStub.resolves(TEST_DESCRIBE_RESPONSE);
      // call
      cfnClient.getStackEvents(TEST_STACK_NAME);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(DescribeStackEventsCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        StackName: TEST_STACK_NAME,
      });
    });

    it("| getStackEvents method callback error when client request fails", (done) => {
      // setup
      sendCommandStub.rejects(TEST_CLIENT_ERROR);
      // call
      cfnClient.getStackEvents(TEST_STACK_NAME).catch((err) => {
        // verify
        expect(err).equal(TEST_CLIENT_ERROR);
        done();
      });
    });

    it("| getStackEvents method callback response when client request succeeds", (done) => {
      // setup
      sendCommandStub.resolves(TEST_DESCRIBE_RESPONSE);
      // call
      cfnClient.getStackEvents(TEST_STACK_NAME).then((res) => {
        // verify
        expect(res).equal(TEST_CLIENT_RESPONSE);
        done();
      });
    });
  });

  describe("Test client method - getStackResource()", () => {
    const TEST_STACK_NAME = "STACK";
    const TEST_LOGICAL_ID = "LOGICAL_ID";
    const TEST_DESCRIBE_RESPONSE = {
      StackResourceDetail: TEST_CLIENT_RESPONSE,
    };

    it("| call aws-sdk describeStackResourceCommand with same params from input", () => {
      // setup
      sendCommandStub.resolves(TEST_DESCRIBE_RESPONSE);
      // call
      cfnClient.getStackResource(TEST_STACK_NAME, TEST_LOGICAL_ID);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(DescribeStackResourceCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        StackName: TEST_STACK_NAME,
        LogicalResourceId: TEST_LOGICAL_ID,
      });
    });

    it("| getStackResource method callback error when client request fails", (done) => {
      // setup
      sendCommandStub.rejects(TEST_CLIENT_ERROR);
      // call
      cfnClient.getStackResource(TEST_STACK_NAME, TEST_LOGICAL_ID).catch((err) => {
        // verify
        expect(err).equal(TEST_CLIENT_ERROR);
        done();
      });
    });

    it("| getStackResource method callback response when client request succeeds", (done) => {
      // setup
      sendCommandStub.resolves(TEST_DESCRIBE_RESPONSE);
      // call
      cfnClient.getStackResource(TEST_STACK_NAME, TEST_LOGICAL_ID).then((res) => {
        // verify
        expect(res).equal(TEST_CLIENT_RESPONSE);
        done();
      });
    });
  });

  describe("Test client method - getStackResources()", () => {
    const TEST_STACK_NAME = "STACK";
    const TEST_DESCRIBE_RESPONSE = {
      StackResources: TEST_CLIENT_RESPONSE,
    };

    it("| call aws-sdk describeStackResourcesCommand with same params from input", () => {
      // setup
      sendCommandStub.resolves(TEST_DESCRIBE_RESPONSE);
      // call
      cfnClient.getStackResources(TEST_STACK_NAME);
      // verify
      expect(sendCommandStub.args[0][0]).to.be.instanceof(DescribeStackResourcesCommand);
      expect(sendCommandStub.args[0][0].input).to.deep.equal({
        StackName: TEST_STACK_NAME,
      });
    });

    it("| getStackResources method callback error when client request fails", (done) => {
      // setup
      sendCommandStub.rejects(TEST_CLIENT_ERROR);
      // call
      cfnClient.getStackResources(TEST_STACK_NAME).catch((err) => {
        // verify
        expect(err).equal(TEST_CLIENT_ERROR);
        done();
      });
    });

    it("| getStackResources method callback response when client request succeeds", (done) => {
      // setup
      sendCommandStub.resolves(TEST_DESCRIBE_RESPONSE);
      // call
      cfnClient.getStackResources(TEST_STACK_NAME).then((res) => {
        // verify
        expect(res).equal(TEST_CLIENT_RESPONSE);
        done();
      });
    });
  });
});
