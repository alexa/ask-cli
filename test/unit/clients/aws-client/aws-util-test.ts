import {expect} from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import fs from "fs-extra";

import CONSTANTS from "../../../../lib/utils/constants";

describe("Clients test - aws util test", () => {
  const TEST_ASK_PROFILE = "TEST_ASK_PROFILE";
  const TEST_AWS_PROFILE = "TEST_AWS_PROFILE";
  const TEST_AWS_DEFAULT_PROFILE = "TEST_AWS_DEFAULT_PROFILE";
  let awsUtil: any, parseKnownFilesStub: sinon.SinonStub;

  beforeEach(() => {
    parseKnownFilesStub = sinon.stub();
    awsUtil = proxyquire("../../../../lib/clients/aws-client/aws-util", {
      "@aws-sdk/shared-ini-file-loader": {
        DEFAULT_PROFILE: TEST_AWS_DEFAULT_PROFILE,
        parseKnownFiles: parseKnownFilesStub,
      },
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("# function getAWSProfile tests", () => {
    afterEach(() => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
    });

    it("| enviroment variable ask profile with undefined aws enviroment variables, expect error return.", () => {
      // setup
      const TEST_ASK_PROFILE = CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
      const TEST_GET_AWS_PROFILE_ERR = "Environmental variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY not defined.";
      // call/verify
      expect(() => awsUtil.getAWSProfile(TEST_ASK_PROFILE)).throw(TEST_GET_AWS_PROFILE_ERR);
    });

    it("| enviroment variable ask profile, expect enviroment variable aws profile return.", () => {
      // setup
      const TEST_ASK_PROFILE = CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
      process.env.AWS_ACCESS_KEY_ID = "TEST_AWS_REGION_KEY_ID";
      process.env.AWS_SECRET_ACCESS_KEY = "TEST_AWS_SECRET_ACCESS_KEY";
      // call/verify
      expect(awsUtil.getAWSProfile(TEST_ASK_PROFILE)).equal(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
    });

    it("| standard ask profile with invalid ask cli config, expect error return.", () => {
      // setup
      const TEST_GET_AWS_PROFILE_ERR = new Error("Parse error");
      sinon.stub(fs, "readJSONSync").throws(TEST_GET_AWS_PROFILE_ERR);
      // call/verify
      expect(() => awsUtil.getAWSProfile(TEST_ASK_PROFILE)).throw(TEST_GET_AWS_PROFILE_ERR);
    });

    it("| standard ask profile unconfigured, expect undefined profile return.", () => {
      // setup
      const TEST_ASK_CONFIG = {
        profiles: {},
      };
      sinon.stub(fs, "readJSONSync").returns(TEST_ASK_CONFIG);
      // call/verify
      expect(awsUtil.getAWSProfile(TEST_ASK_PROFILE)).to.be.undefined;
    });

    it("| standard ask profile, expect ask cli config aws profile return.", () => {
      // setup
      const TEST_ASK_CONFIG = {
        profiles: {
          [TEST_ASK_PROFILE]: {
            aws_profile: TEST_AWS_PROFILE,
          },
        },
      };
      sinon.stub(fs, "readJSONSync").returns(TEST_ASK_CONFIG);
      // call/verify
      expect(awsUtil.getAWSProfile(TEST_ASK_PROFILE)).equal(TEST_AWS_PROFILE);
    });
  });

  describe("# function getCLICompatibleDefaultRegion tests", () => {
    const TEST_AWS_REGION = "TEST_AWS_REGION";

    afterEach(() => {
      delete process.env.AWS_REGION;
    });

    it("| defined enviroment variable region, expect enviroment variable region return.", async () => {
      // setup
      process.env.AWS_REGION = TEST_AWS_REGION;
      // call
      const region = await awsUtil.getCLICompatibleDefaultRegion(TEST_AWS_PROFILE);
      // verify
      expect(region).equal(TEST_AWS_REGION);
      expect(parseKnownFilesStub.called).to.be.false;
    });

    it("| undefined enviroment variable region, expect aws config file region return.", async () => {
      // setup
      const TEST_AWS_CONFIG = {
        [TEST_AWS_PROFILE]: {
          region: TEST_AWS_REGION,
        },
      };
      parseKnownFilesStub.resolves(TEST_AWS_CONFIG);
      // call
      const region = await awsUtil.getCLICompatibleDefaultRegion(TEST_AWS_PROFILE);
      // verify
      expect(region).equal(TEST_AWS_REGION);
      expect(parseKnownFilesStub.called).to.be.true;
    });

    it("| undefined enviroment variable region and undefined aws profile, expect default region return.", async () => {
      // setup
      parseKnownFilesStub.rejects();
      // call
      const region = await awsUtil.getCLICompatibleDefaultRegion();
      // verify
      expect(region).equal(CONSTANTS.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION);
      expect(parseKnownFilesStub.called).to.be.true;
    });
  });
});
