import {expect} from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

import CONSTANTS from "../../../../lib/utils/constants";
import {AwsClientConfiguration} from "../../../../lib/clients/aws-client/abstract-aws-client";

describe("Clients test - abstract client test", () => {
  const TEST_AWS_PROFILE = "TEST_AWS_PROFILE";
  const TEST_AWS_REGION = "TEST_AWS_REGION";
  const TEST_CREDS_FROM_ENV = "TEST_CREDS_FROM_ENV";
  const TEST_CREDS_FROM_INI = "TEST_CREDS_FROM_INI";
  let configuration: AwsClientConfiguration, fromEnvStub: sinon.SinonStub, fromIniStub: sinon.SinonStub, AbstractAwsClient: any;

  beforeEach(() => {
    configuration = {
      awsProfile: TEST_AWS_PROFILE,
      awsRegion: TEST_AWS_REGION,
    };
    fromEnvStub = sinon.stub().returns(TEST_CREDS_FROM_ENV);
    fromIniStub = sinon.stub().returns(TEST_CREDS_FROM_INI);
    AbstractAwsClient = proxyquire("../../../../lib/clients/aws-client/abstract-aws-client", {
      "@aws-sdk/credential-providers": {
        fromEnv: fromEnvStub,
        fromIni: fromIniStub,
      },
    }).default;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("# constructor tests", () => {
    it("| should set region and credentials profile", () => {
      const client = new AbstractAwsClient(configuration);
      expect(client).to.be.instanceof(AbstractAwsClient);
      expect(client.credentials).eql(TEST_CREDS_FROM_INI);
      expect(client.profile).eql(TEST_AWS_PROFILE);
      expect(client.region).eql(TEST_AWS_REGION);
      expect(fromEnvStub.called).to.be.false;
      expect(fromIniStub.args[0][0]).to.deep.equal({
        profile: TEST_AWS_PROFILE,
      });
    });

    it("| should not set credentials profile since using env variables", () => {
      configuration.awsProfile = CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS;
      const client = new AbstractAwsClient(configuration);
      expect(client).to.be.instanceof(AbstractAwsClient);
      expect(client.credentials).eql(TEST_CREDS_FROM_ENV);
      expect(client.profile).eql(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
      expect(client.region).eql(TEST_AWS_REGION);
      expect(fromEnvStub.called).to.be.true;
      expect(fromIniStub.called).to.be.false;
    });

    it("| should throw error when aws profile is not specified ", () => {
      delete configuration.awsProfile;
      expect(() => new AbstractAwsClient(configuration)).to.throw("Invalid awsProfile or Invalid awsRegion");
    });

    it("| should throw error when aws region is not specified ", () => {
      delete configuration.awsRegion;
      expect(() => new AbstractAwsClient(configuration)).to.throw("Invalid awsProfile or Invalid awsRegion");
    });
  });
});
