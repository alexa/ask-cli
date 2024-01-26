import {expect} from "chai";
import path from "path";
import sinon from "sinon";
import AuthorizationController from "../../../../lib/controllers/authorization-controller";
import RunCommand from "../../../../lib/commands/run";
import optionModel from "../../../../lib/commands/option-model.json";
import Messenger from "../../../../lib/view/messenger";
import ResourcesConfig from "../../../../lib/model/resources-config";
import profileHelper from "../../../../lib/utils/profile-helper";
import CONSTANTS from "../../../../lib/utils/constants";
import * as helper from "../../../../lib/commands/run/helper";
import SmapiClient from "../../../../lib/clients/smapi-client";
import {OptionModel} from "../../../../lib/commands/option-validator";

const TEST_PROFILE = "default";
const TEST_CMD = {
  profile: TEST_PROFILE,
};
const RESOURCE_CONFIG_FIXTURE_PATH = path.join(process.cwd(), "test", "unit", "fixture", "model", "regular-proj");
const INVALID_RESOURCES_CONFIG_JSON_PATH = path.join(RESOURCE_CONFIG_FIXTURE_PATH, "random-json-config.json");
const VALID_RESOURCES_CONFIG_JSON_PATH = path.join(RESOURCE_CONFIG_FIXTURE_PATH, "ask-resources.json");

describe("Commands Run test - command class test", () => {
  const TEST_ERROR = "error";
  let errorStub: sinon.SinonStub;
  let infoStub: sinon.SinonStub;
  beforeEach(() => {
    errorStub = sinon.stub();
    infoStub = sinon.stub();
    sinon.stub(Messenger, "getInstance").returns({
      error: errorStub,
      info: infoStub,
    });
    sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").yields();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("| validate command information is set correctly", () => {
    const instance = new RunCommand(optionModel as OptionModel);
    expect(instance.name()).eq("run");
    expect(instance.description()).eq(
      "Starts a local instance of your project as the skill endpoint." +
        " Automatically re-routes development requests and responses between the Alexa service and your local instance.",
    );
    expect(instance.requiredOptions()).deep.eq([]);
    expect(instance.optionalOptions()).deep.eq(["debug-port", "wait-for-attach", "watch", "region", "profile", "debug"]);
  });
  describe("# validate command handle", () => {
    let instance: RunCommand;

    beforeEach(() => {
      instance = new RunCommand(optionModel as OptionModel);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| no resources config file found", async () => {
      // setup
      const TEST_CMD_WITH_VALUES = {};
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      sinon.stub(path, "join").returns("fooPath");
      // call
      await expect(instance.handle(TEST_CMD_WITH_VALUES)).rejectedWith(
        "File fooPath not exists. If this is a skill project managed by v1 ask-cli, " +
          "please run 'ask util upgrade-project' then try the command again.",
      );
    });

    it("| unable to fetch skillId from resources config file", async () => {
      // setup
      const TEST_CMD_WITH_VALUES = {};
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      sinon.stub(path, "join").returns(INVALID_RESOURCES_CONFIG_JSON_PATH);
      // call
      await expect(instance.handle(TEST_CMD_WITH_VALUES)).rejectedWith(
        `Failed to obtain skill-id for the given profile - ${TEST_PROFILE}. Please deploy your skill project first.`,
      );
    });

    it("| error while getting access token", async () => {
      // setup
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      sinon.stub(path, "join").returns(VALID_RESOURCES_CONFIG_JSON_PATH);
      sinon.stub(ResourcesConfig.prototype, "getSkillId").returns("TestSkillId");
      sinon.stub(RunCommand.prototype, "_getAccessTokenForProfile").rejects(new Error(TEST_ERROR));

      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);

      // verify
      expect(errorStub.args[0][0].message).eq(TEST_ERROR);
    });

    it("| error while getting debug flow", async () => {
      // setup
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      sinon.stub(path, "join").returns(VALID_RESOURCES_CONFIG_JSON_PATH);
      sinon.stub(ResourcesConfig.prototype, "getSkillId").returns("TestSkillId");
      sinon.stub(RunCommand.prototype, "_getAccessTokenForProfile").resolves("");
      sinon.stub(RunCommand.prototype, "_getSkillRunFlow").rejects(new Error(TEST_ERROR));
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      expect(errorStub.args[0][0].message).eq(TEST_ERROR);
    });
  });
  describe("_getSkillRunFlow test", () => {
    let instance: RunCommand;

    beforeEach(() => {
      instance = new RunCommand(optionModel as OptionModel);
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("run flow for non-hosted skill", () => {
      beforeEach(() => {
        sinon.stub(ResourcesConfig.prototype, "getSkillInfraType").returns(CONSTANTS.DEPLOYER_TYPE.CFN.NAME);
      });
      afterEach(() => {
        sinon.restore();
      });
      it("| getSkillCodeFolderName error", async () => {
        sinon.stub(helper, "getSkillCodeFolderName").throws(new Error(TEST_ERROR));

        await expect(
          instance._getSkillRunFlow(
            "fooSkillId",
            "fooProfile",
            CONSTANTS.ALEXA.REGION.DEFAULT,
            false,
            false,
            false,
            CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
            "fooToken",
            CONSTANTS.ALEXA.REGION.NA,
          ),
        ).rejectedWith(TEST_ERROR);
      });

      it("| no user config", async () => {
        sinon.stub(helper, "getSkillCodeFolderName").returns("fooSkillFolderName");
        sinon.stub(ResourcesConfig.prototype, "getSkillInfraUserConfig").returns(undefined);

        await expect(
          instance._getSkillRunFlow(
            "fooSkillId",
            "fooProfile",
            CONSTANTS.ALEXA.REGION.DEFAULT,
            false,
            false,
            false,
            CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
            "fooToken",
            CONSTANTS.ALEXA.REGION.NA,
          ),
        ).rejectedWith("Failed to obtain userConfig from project " + `resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`);
      });

      it("| empty user config", async () => {
        sinon.stub(helper, "getSkillCodeFolderName").returns("fooSkillFolderName");
        sinon.stub(ResourcesConfig.prototype, "getSkillInfraUserConfig").returns({});

        await expect(
          instance._getSkillRunFlow(
            "fooSkillId",
            "fooProfile",
            CONSTANTS.ALEXA.REGION.DEFAULT,
            false,
            false,
            false,
            CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
            "fooToken",
            CONSTANTS.ALEXA.REGION.NA,
          ),
        ).rejectedWith(`Failed to obtain runtime from userConfig in project resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`);
      });

      it("| error in getting skill flow instance", async () => {
        sinon.stub(helper, "getSkillCodeFolderName").returns("fooSkillFolderName");
        sinon.stub(ResourcesConfig.prototype, "getSkillInfraUserConfig").returns({runtime: CONSTANTS.RUNTIME.JAVA, handler: "fooHandler"});
        sinon.stub(helper, "getSkillFlowInstance").throws(new Error(TEST_ERROR));

        await expect(
          instance._getSkillRunFlow(
            "fooSkillId",
            "fooProfile",
            CONSTANTS.ALEXA.REGION.DEFAULT,
            false,
            false,
            false,
            CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
            "fooToken",
            CONSTANTS.ALEXA.REGION.NA,
          ),
        ).rejectedWith(TEST_ERROR);
      });
    });
    describe("run flow for hosted skill", () => {
      beforeEach(() => {
        sinon.stub(ResourcesConfig.prototype, "getSkillInfraType").returns(CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME);
      });

      it("| error in getting hosted skill runtime", async () => {
        sinon.stub(RunCommand.prototype, "_getHostedSkillRuntime").rejects(new Error(TEST_ERROR));

        await expect(
          instance._getSkillRunFlow(
            "fooSkillId",
            "fooProfile",
            CONSTANTS.ALEXA.REGION.DEFAULT,
            false,
            false,
            false,
            CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
            "fooToken",
            CONSTANTS.ALEXA.REGION.NA,
          ),
        ).rejectedWith(TEST_ERROR);
      });

      it("| error in getting skill flow instance", async () => {
        sinon.stub(RunCommand.prototype, "_getHostedSkillRuntime").resolves("fooRuntime");
        sinon.stub(helper, "getSkillFlowInstance").throws(new Error(TEST_ERROR));

        await expect(
          instance._getSkillRunFlow(
            "fooSkillId",
            "fooProfile",
            CONSTANTS.ALEXA.REGION.DEFAULT,
            false,
            false,
            false,
            CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
            "fooToken",
            CONSTANTS.ALEXA.REGION.NA,
          ),
        ).rejectedWith(TEST_ERROR);
      });
    });
  });

  describe("_getHostedSkillRuntime test", () => {
    let instance: RunCommand;

    beforeEach(() => {
      instance = new RunCommand(optionModel as OptionModel);
    });
    afterEach(() => {
      sinon.restore();
    });
    const smapiClient = new SmapiClient({
      profile: TEST_PROFILE,
      doDebug: false,
    });
    it("| getAlexaHostedSkillMetadata error", async () => {
      sinon.stub(smapiClient.skill.alexaHosted, "getAlexaHostedSkillMetadata").yields(new Error(TEST_ERROR));
      await expect(instance._getHostedSkillRuntime(smapiClient, "fooSkillId")).rejectedWith(TEST_ERROR);
    });

    it("| getAlexaHostedSkillMetadata empty response", async () => {
      sinon.stub(smapiClient.skill.alexaHosted, "getAlexaHostedSkillMetadata").yields(null, {});
      await expect(instance._getHostedSkillRuntime(smapiClient, "fooSkillId")).rejectedWith(
        "Received an empty response body from getAlexaHostedSkillMetadata",
      );
    });

    it("| getAlexaHostedSkillMetadata empty runtime value", async () => {
      sinon.stub(smapiClient.skill.alexaHosted, "getAlexaHostedSkillMetadata").yields(null, {
        body: {
          alexaHosted: {
            runtime: "",
          },
        },
      });
      await expect(instance._getHostedSkillRuntime(smapiClient, "fooSkillId")).rejectedWith(
        "Unable to determine runtime of the hosted skill - fooSkillId",
      );
    });
  });
});
