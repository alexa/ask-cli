import {expect} from "chai";
import sinon from "sinon";
import path from "path";
import NewCommand from "../../../../lib/commands/new";
import * as helper from "../../../../lib/commands/new/helper";
import * as hostedHelper from "../../../../lib/commands/new/hosted-skill-helper";
import optionModel from "../../../../lib/commands/option-model.json";
import ResourcesConfig from "../../../../lib/model/resources-config";
import Manifest from "../../../../lib/model/manifest";
import Messenger from "../../../../lib/view/messenger";
import profileHelper from "../../../../lib/utils/profile-helper";
import * as wizardHelper from "../../../../lib/commands/new/wizard-helper";
import CONSTANTS from "../../../../lib/utils/constants";
import {OptionModel} from "../../../../lib/commands/option-validator";

describe("Commands new test - command class test", () => {
  const FIXTURE_BASE_PATH = path.join(process.cwd(), "test", "unit", "fixture", "model");
  const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(FIXTURE_BASE_PATH, "regular-proj", "ask-resources.json");
  const FIXTURE_MANIFEST_FILE_PATH = path.join(FIXTURE_BASE_PATH, "manifest.json");
  const FIXTURE_HOSTED_RESOURCES_CONFIG_FILE_PATH = path.join(FIXTURE_BASE_PATH, "hosted-proj", "ask-resources.json");
  const TEST_PROFILE = "default";
  const TEST_VENDOR_ID = "vendorId";
  const TEST_SKILL_ID = "TEST_SKILL_ID";
  const TEST_SKILL_NAME = "skillName";
  const TEST_PROJECT_PATH = "projectPath";
  const TEST_ERROR = Error("TEST_ERROR");
  const TEST_DEPLOYMENT_TYPE = "@ask-cli/cfn-deployer";
  const TEST_HOSTED_DEPLOYMENT = "@ask-cli/hosted-skill-deployer";
  const TEST_CMD = {
    profile: TEST_PROFILE,
  };

  let infoStub: sinon.SinonStub;
  let errorStub: sinon.SinonStub;
  let warnStub: sinon.SinonStub;

  beforeEach(() => {
    infoStub = sinon.stub();
    errorStub = sinon.stub();
    warnStub = sinon.stub();
    sinon.stub(Messenger, "getInstance").returns({
      info: infoStub,
      error: errorStub,
      warn: warnStub,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("| validate command information is set correctly", () => {
    const instance = new NewCommand(optionModel as OptionModel);
    expect(instance.name()).equal("new");
    expect(instance.description()).equal("create a new skill project from Alexa skill templates");
    expect(instance.requiredOptions()).deep.equal([]);
    expect(instance.optionalOptions()).deep.equal(["templateUrl", "templateBranch", "profile", "debug", "ac"]);
  });

  describe("validate command handle", () => {
    describe("command handle - collect user creation Project Info", () => {
      let instance: NewCommand;
      let profileRuntimeProfileStub: sinon.SinonStub;
      let wizardHelperStub: sinon.SinonStub;

      beforeEach(() => {
        instance = new NewCommand(optionModel as OptionModel);
        profileRuntimeProfileStub = sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(profileHelper, "resolveVendorId").returns(TEST_PROFILE);
        wizardHelperStub = sinon.stub(wizardHelper, "collectUserCreationProjectInfo");
        sinon.stub(hostedHelper, "validateUserQualification");
      });

      afterEach(() => {
        sinon.restore();
      });

      it("| when profile is not correct, expect throw error", async () => {
        // setup
        profileRuntimeProfileStub.throws(TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| wizard helper collectUserCreationProjectInfo fails, expect error thrown", async () => {
        // setup
        wizardHelperStub.callsArgWith(1, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).calledOnceWith("Please follow the wizard to start your Alexa skill project ->");
        expect(warnStub).not.called;
      });

      it("| wizard helper collectUserCreationProjectInfo without user input, expect error thrown", async () => {
        // setup
        wizardHelperStub.callsArgWith(1, null, null);
        // call

        await expect(instance.handle(TEST_CMD)).fulfilled;
        // verify
        expect(warnStub).not.called;
      });
    });

    describe("command handle - create hosted skill", () => {
      let instance: NewCommand;
      let wizardHelperStub: sinon.SinonStub;
      let hostedHelperStub: sinon.SinonStub;
      let hostedHelperCreateHostedStub: sinon.SinonStub;

      beforeEach(() => {
        instance = new NewCommand(optionModel as OptionModel);
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(profileHelper, "resolveVendorId").returns(TEST_PROFILE);
        wizardHelperStub = sinon.stub(wizardHelper, "collectUserCreationProjectInfo");
        hostedHelperStub = sinon.stub(hostedHelper, "validateUserQualification");
        hostedHelperCreateHostedStub = sinon.stub(hostedHelper, "createHostedSkill");
        new ResourcesConfig(FIXTURE_HOSTED_RESOURCES_CONFIG_FILE_PATH);
      });

      afterEach(() => {
        sinon.restore();
        ResourcesConfig.dispose();
      });

      it("| hosted helper validate user qualification fails, expect error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {
          deploymentType: TEST_HOSTED_DEPLOYMENT,
        };
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        hostedHelperStub.callsArgWith(2, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(warnStub).not.called;
      });

      it("| hosted helper create hosted skill fails, expect error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {
          deploymentType: TEST_HOSTED_DEPLOYMENT,
        };
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        hostedHelperStub.callsArgWith(2, null);
        hostedHelperCreateHostedStub.callsArgWith(3, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(warnStub).not.called;
      });

      it("| hosted helper create hosted skill succeed, expect correct response", async () => {
        // setup
        const TEST_USER_INPUT = {
          deploymentType: TEST_HOSTED_DEPLOYMENT,
        };
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        hostedHelperStub.callsArgWith(2, null);
        hostedHelperCreateHostedStub.callsArgWith(3, null, TEST_SKILL_ID);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(errorStub).not.called;
        expect(infoStub.getCall(0)).calledWith("Please follow the wizard to start your Alexa skill project ->");
        expect(infoStub.getCall(1)).calledWith(`Hosted skill provisioning finished. Skill-Id: ${TEST_SKILL_ID}`);
        expect(infoStub.getCall(2)).calledWith(
          `Please follow the instructions at ${CONSTANTS.GIT_USAGE_HOSTED_SKILL_DOCUMENTATION}` +
            ' to learn more about the usage of "git" for Hosted skill.',
        );
        expect(warnStub).not.called;
      });
    });

    describe("command handle - create non hosted skill", () => {
      let instance: NewCommand;
      let wizardHelperStub: sinon.SinonStub;
      let helperLoadSkillStub: sinon.SinonStub;
      let helperDownloadSkillStub: sinon.SinonStub;
      let helperUploadSkill: sinon.SinonStub;
      let helperInitialize: sinon.SinonStub;

      beforeEach(() => {
        instance = new NewCommand(optionModel as OptionModel);
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(profileHelper, "resolveVendorId").returns(TEST_VENDOR_ID);
        helperLoadSkillStub = sinon.stub(helper, "loadSkillProjectModel");
        helperDownloadSkillStub = sinon.stub(helper, "downloadTemplateFromGit");
        helperInitialize = sinon.stub(helper, "initializeDeployDelegate");
        wizardHelperStub = sinon.stub(wizardHelper, "collectUserCreationProjectInfo");
        helperUploadSkill = sinon.stub(helper, "updateSkillProjectWithUserSettings");
        new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        new Manifest(FIXTURE_MANIFEST_FILE_PATH);
      });

      afterEach(() => {
        sinon.restore();
        ResourcesConfig.dispose();
        Manifest.dispose();
      });

      it("| download template From git fails, expect error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {};
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        helperDownloadSkillStub.callsArgWith(2, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(warnStub).not.called;
      });

      it("| load skill project model fails, expect error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {};
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        helperDownloadSkillStub.callsArgWith(2, null);
        helperLoadSkillStub.throws(TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(warnStub).not.called;
      });

      it("| update skill project with user settings fails, expect error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {};
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        helperDownloadSkillStub.callsArgWith(2, null);
        helperUploadSkill.throws(TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(warnStub).not.called;
      });

      it("| initialize Deploy Delegate fails, expect error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {};
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        helperDownloadSkillStub.callsArgWith(2, null);
        helperInitialize.callsArgWith(4, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(warnStub).not.called;
      });

      it("| create Non Hosted Skill succeed, expect correct response", async () => {
        // setup
        const TEST_USER_INPUT = {
          skillName: TEST_SKILL_NAME,
        };
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        helperDownloadSkillStub.callsArgWith(2, null, TEST_PROJECT_PATH);
        helperInitialize.callsArgWith(4, null, TEST_DEPLOYMENT_TYPE);
        // call
        await instance.handle(TEST_CMD);

        expect(infoStub.getCall(0)).calledWith("Please follow the wizard to start your Alexa skill project ->");
        expect(infoStub.getCall(1)).calledWith(`Project for skill "${TEST_SKILL_NAME}" is successfully created at ${TEST_PROJECT_PATH}\n`);
        expect(infoStub.getCall(2)).calledWith(`Project initialized with deploy delegate "${TEST_DEPLOYMENT_TYPE}" successfully.`);
        expect(warnStub).not.called;
      });

      it("| create Non Hosted Skill without deployment type succeed, expect correct response", async () => {
        // setup
        const TEST_USER_INPUT = {
          skillName: TEST_SKILL_NAME,
        };
        wizardHelperStub.callsArgWith(1, null, TEST_USER_INPUT);
        helperDownloadSkillStub.callsArgWith(2, null, TEST_PROJECT_PATH);
        helperInitialize.callsArgWith(4, null, null);
        // call
        await instance.handle(TEST_CMD);

        expect(infoStub.getCall(0)).calledWith("Please follow the wizard to start your Alexa skill project ->");
        expect(infoStub.getCall(1)).calledWith(`Project for skill "${TEST_SKILL_NAME}" is successfully created at ${TEST_PROJECT_PATH}\n`);
        expect(infoStub.getCall(2)).calledWith("Project initialized successfully.");
        expect(warnStub).not.called;
      });
    });
  });
});
