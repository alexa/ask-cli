import {expect} from "chai";
import path from "path";
import sinon from "sinon";
import UpgradeProjectCommand from "../../../../../lib/commands/util/upgrade-project/index";
import helper from "../../../../../lib/commands/util/upgrade-project/helper";
import hostedSkillHelper from "../../../../../lib/commands/util/upgrade-project/hosted-skill-helper";
import optionModel from "../../../../../lib/commands/option-model.json";
import CLiError from "../../../../../lib/exceptions/cli-error";
import Messenger from "../../../../../lib/view/messenger";
import profileHelper from "../../../../../lib/utils/profile-helper";
import CONSTANTS from "../../../../../lib/utils/constants";
import {OptionModel} from "../../../../../lib/commands/option-validator";

describe("Commands upgrade project test - command class test", () => {
  const FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG = path.join(
    process.cwd(),
    "test",
    "unit",
    "fixture",
    "model",
    "hosted-proj",
    "ask-resources.json",
  );
  const TEST_PROFILE = "default";
  const TEST_ERROR = "upgrade project error";
  const TEST_SKILL_ID = "skillId";
  const TEST_V1_CONFIG = {};
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
    const instance = new UpgradeProjectCommand(optionModel as OptionModel);
    expect(instance.name()).equal("upgrade-project");
    expect(instance.description()).equal("upgrade the v1 ask-cli skill project to v2 structure");
    expect(instance.requiredOptions()).deep.equal([]);
    expect(instance.optionalOptions()).deep.equal(["profile", "debug"]);
  });

  describe("validate command handle", () => {
    const TEST_CMD = {
      profile: TEST_PROFILE,
    };

    describe("command handle - pre upgrade check", () => {
      let instance: UpgradeProjectCommand;
      let profileHelperRuntimeProfileStub: sinon.SinonStub;
      let helperLoadV1ProjConfigStub: sinon.SinonStub;
      let helperAttemptUpgradeUndeployedProjectStub: sinon.SinonStub;

      beforeEach(() => {
        instance = new UpgradeProjectCommand(optionModel as OptionModel);
        profileHelperRuntimeProfileStub = sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        helperLoadV1ProjConfigStub = sinon.stub(helper, "loadV1ProjConfig").returns({
          isDeployed: true,
          v1Config: TEST_V1_CONFIG,
        });
        helperAttemptUpgradeUndeployedProjectStub = sinon.stub(helper, "attemptUpgradeUndeployedProject");
      });

      afterEach(() => {
        sinon.restore();
      });

      it("| when profile is not correct, expect throw error", async () => {
        // setup
        profileHelperRuntimeProfileStub.throws(new Error(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when loadV1ProjConfig throws, expect error displayed", async () => {
        // setup
        helperLoadV1ProjConfigStub.throws(new Error(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when attemptUpgradeUndeployedProject throws, expect error displayed", async () => {
        // setup
        helperLoadV1ProjConfigStub.returns({isDeployed: false});
        helperAttemptUpgradeUndeployedProjectStub.throws(new Error(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when project is undeployed project, expect project will get updated directly", async () => {
        // setup
        helperLoadV1ProjConfigStub.returns({isDeployed: false});
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(infoStub).calledOnceWith("Template project migration finished.");
        expect(errorStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when extract upgrade information fails, expect throw error", async () => {
        // setup
        sinon.stub(helper, "extractUpgradeInformation").throws(new CLiError(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| helper preview upgrade fails, expect throw error", async () => {
        // setup
        sinon.stub(helper, "extractUpgradeInformation");
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| helper preview Upgrade without previewConfirm, expect throw information", async () => {
        // setup
        sinon.stub(helper, "extractUpgradeInformation");
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, null);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(infoStub).calledOnceWith("Command upgrade-project aborted.");
        expect(errorStub).not.called;
        expect(warnStub).not.called;
      });
    });

    describe("command handle - create V2 hosted skill project", () => {
      let instance: UpgradeProjectCommand;

      beforeEach(() => {
        instance = new UpgradeProjectCommand(optionModel as OptionModel);
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(helper, "loadV1ProjConfig").returns({
          isDeployed: true,
          v1Config: TEST_V1_CONFIG,
        });
      });

      afterEach(() => {
        sinon.restore();
      });

      it("| hostedSkillHelper check If Dev Branch Clean fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          isHosted: true,
          skillId: TEST_SKILL_ID,
          gitRepoUrl: undefined,
          lambdaResources: {},
        } as any;
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(hostedSkillHelper, "checkIfDevBranchClean").throws(new CLiError(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| helper move old project to legacy folder fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          isHosted: true,
          skillId: TEST_SKILL_ID,
          gitRepoUrl: "",
        };
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(hostedSkillHelper, "checkIfDevBranchClean");
        sinon.stub(helper, "moveOldProjectToLegacyFolder").throws(new CLiError(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| hostedSkillHelper create V2 project skeleton fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          isHosted: true,
          skillId: TEST_SKILL_ID,
          gitRepoUrl: "",
        };
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(hostedSkillHelper, "checkIfDevBranchClean");
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(hostedSkillHelper, "createV2ProjectSkeletonAndLoadModel").throws(new CLiError(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| hostedSkillHelper download skill package fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          isHosted: true,
          skillId: TEST_SKILL_ID,
          gitRepoUrl: "",
        };
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(hostedSkillHelper, "checkIfDevBranchClean");
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(hostedSkillHelper, "createV2ProjectSkeletonAndLoadModel");
        const pathStub = sinon
          .stub(path, "join")
          .withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG)
          .returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
        pathStub.callThrough();
        sinon.stub(hostedSkillHelper, "downloadSkillPackage").callsArgWith(5, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| hostedSkillHelper handle existing Lambda code fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          isHosted: true,
          skillId: TEST_SKILL_ID,
          gitRepoUrl: "",
        };
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(hostedSkillHelper, "checkIfDevBranchClean");
        sinon.stub(hostedSkillHelper, "postUpgradeGitSetup");
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(hostedSkillHelper, "createV2ProjectSkeletonAndLoadModel");
        const pathStub = sinon
          .stub(path, "join")
          .withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG)
          .returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
        pathStub.callThrough();
        sinon.stub(hostedSkillHelper, "downloadSkillPackage").callsArgWith(5, null);
        sinon.stub(hostedSkillHelper, "handleExistingLambdaCode").throws(new CLiError(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| hostedSkillHelper post Upgrade Git Setup fails , expect no error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {
          isHosted: true,
          skillId: TEST_SKILL_ID,
          gitRepoUrl: "",
        };
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(hostedSkillHelper, "checkIfDevBranchClean");
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(hostedSkillHelper, "createV2ProjectSkeletonAndLoadModel");
        sinon.stub(path, "join").returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
        sinon.stub(hostedSkillHelper, "downloadSkillPackage").callsArgWith(5, null);
        sinon.stub(hostedSkillHelper, "handleExistingLambdaCode");
        sinon.stub(hostedSkillHelper, "postUpgradeGitSetup").callsArgWith(5, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| hosted skill project migration succeeds , expect no error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {
          isHosted: true,
          skillId: TEST_SKILL_ID,
          gitRepoUrl: "",
        };
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(hostedSkillHelper, "checkIfDevBranchClean");
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(hostedSkillHelper, "createV2ProjectSkeletonAndLoadModel");
        const pathStub = sinon
          .stub(path, "join")
          .withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG)
          .returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
        pathStub.callThrough();
        sinon.stub(hostedSkillHelper, "downloadSkillPackage").callsArgWith(5, null);
        sinon.stub(hostedSkillHelper, "handleExistingLambdaCode");
        sinon.stub(hostedSkillHelper, "postUpgradeGitSetup").callsArgWith(5, null);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(infoStub).calledOnceWith("Project migration finished.");
        expect(errorStub).not.called;
        expect(warnStub).not.called;
      });
    });

    describe("command handle - create V2 Non hosted skill project", () => {
      let instance: UpgradeProjectCommand;

      beforeEach(() => {
        instance = new UpgradeProjectCommand(optionModel as OptionModel);
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(helper, "loadV1ProjConfig").returns({
          isDeployed: true,
          v1Config: TEST_V1_CONFIG,
        });
      });

      afterEach(() => {
        sinon.restore();
      });

      it("| helper move old project to legacy folder fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          skillId: TEST_SKILL_ID,
          lambdaResources: undefined,
        } as any;
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(helper, "moveOldProjectToLegacyFolder").throws(new CLiError(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| helper create V2 project skeleton fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          skillId: TEST_SKILL_ID,
          lambdaResources: undefined,
        } as any;
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(helper, "createV2ProjectSkeletonAndLoadModel").throws(new CLiError(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| helper download skill package fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          skillId: TEST_SKILL_ID,
          lambdaResources: undefined,
        } as any;
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(helper, "createV2ProjectSkeletonAndLoadModel");
        const pathStub = sinon
          .stub(path, "join")
          .withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG)
          .returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
        pathStub.callThrough();
        sinon.stub(helper, "downloadSkillPackage").callsArgWith(5, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| hostedSkillHelper handle existing Lambda code fails, expect throw error", async () => {
        // setup
        const TEST_USER_INPUT = {
          skillId: TEST_SKILL_ID,
          lambdaResources: undefined,
        } as any;
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(helper, "createV2ProjectSkeletonAndLoadModel");
        const pathStub = sinon
          .stub(path, "join")
          .withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG)
          .returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
        pathStub.callThrough();
        sinon.stub(helper, "downloadSkillPackage").callsArgWith(5, null);
        sinon.stub(helper, "handleExistingLambdaCode").throws(new CLiError(TEST_ERROR));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| hosted skill project migration succeeds , expect no error thrown", async () => {
        // setup
        const TEST_USER_INPUT = {
          skillId: TEST_SKILL_ID,
          lambdaResources: undefined,
        } as any;
        sinon.stub(helper, "extractUpgradeInformation").returns(TEST_USER_INPUT);
        sinon.stub(helper, "previewUpgrade").callsArgWith(1, null, true);
        sinon.stub(helper, "moveOldProjectToLegacyFolder");
        sinon.stub(helper, "createV2ProjectSkeletonAndLoadModel");
        const pathStub = sinon
          .stub(path, "join")
          .withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG)
          .returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
        pathStub.callThrough();
        sinon.stub(helper, "downloadSkillPackage").callsArgWith(5, null);
        sinon.stub(helper, "handleExistingLambdaCode");
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(infoStub).calledOnceWith("Project migration finished.");
        expect(errorStub).not.called;
        expect(warnStub).not.called;
      });
    });
  });
});
