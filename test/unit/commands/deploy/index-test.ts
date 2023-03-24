import {expect} from "chai";
import sinon from "sinon";
import path from "path";
import fs from "fs";
import fse from "fs-extra";
import DeployCommand from "../../../../lib/commands/deploy";
import helper from "../../../../lib/commands/deploy/helper";
import optionModel from "../../../../lib/commands/option-model.json";
import CliWarn from "../../../../lib/exceptions/cli-warn";
import ResourcesConfig from "../../../../lib/model/resources-config";
import Messenger from "../../../../lib/view/messenger";
import profileHelper from "../../../../lib/utils/profile-helper";
import stringUtils from "../../../../lib/utils/string-utils";
import CONSTANTS from "../../../../lib/utils/constants";
import {OptionModel} from "../../../../lib/commands/option-validator";
import CliError from "../../../../lib/exceptions/cli-error";
import acUtils from "../../../../lib/utils/ac-util";
import ui from "../../../../lib/commands/deploy/ui";

describe("Commands deploy test - command class test", () => {
  const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(
    process.cwd(),
    "test",
    "unit",
    "fixture",
    "model",
    "regular-proj",
    "ask-resources.json",
  );
  const FIXTURE_MANIFEST_FILE = path.join(process.cwd(), "test", "unit", "fixture", "model", "manifest.json");
  const TEST_PROFILE = "default";
  const TEST_DEBUG = false;
  const TEST_IGNORE_HASH = false;

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
    const instance = new DeployCommand(optionModel as OptionModel);
    expect(instance.name()).equal("deploy");
    expect(instance.description()).equal("deploy the skill project");
    expect(instance.requiredOptions()).deep.equal([]);
    expect(instance.optionalOptions()).deep.equal(["ignore-hash", "target", "profile", "debug"]);
  });

  describe("validate command handle", () => {
    const TEST_CMD = {
      profile: TEST_PROFILE,
      debug: TEST_DEBUG,
      ignoreHash: TEST_IGNORE_HASH,
    };
    const TEST_SKILL_METADATA_SRC = "./skillPackage";
    let instance: DeployCommand;
    let pathStub: sinon.SinonStub;
    let profileHelperRuntimeProfile: sinon.SinonStub;

    beforeEach(() => {
      profileHelperRuntimeProfile = sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      pathStub = sinon.stub(path, "join");
      pathStub.withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG).returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
      pathStub.withArgs(TEST_SKILL_METADATA_SRC, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST).returns(FIXTURE_MANIFEST_FILE);
      pathStub.callThrough();
      instance = new DeployCommand(optionModel as OptionModel);
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("command handle - before deploy resources", () => {
      it("| when profile is not correct, expect throw error", async () => {
        // setup
        profileHelperRuntimeProfile.throws(new CliError("error"));
        // call
        await expect(instance.handle(TEST_CMD)).eventually.be.rejected.and.be.instanceOf(CliError);
        // verify
        expect(errorStub).calledOnceWith("error");
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when ResourcesConfig initiation fails, expect throw error", async () => {
        // setup
        pathStub.withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG).returns("invalidPath");
        // call
        await expect(instance.handle(TEST_CMD)).rejected;
        // verify
        expect(warnStub).calledOnce;
        expect(infoStub).not.called;
        expect(errorStub).not.called;
      });

      it("| when deployer is alexa-hosted-deployer, expect throw warning", async () => {
        // setup
        sinon.stub(ResourcesConfig.prototype, "getSkillInfraType").returns(CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME);
        // call
        await expect(instance.handle(TEST_CMD)).eventually.rejected.instanceOf(CliWarn);
        // verify
        expect(warnStub).calledOnce;
        expect(infoStub).calledTwice;
        expect(errorStub).not.called;
      });

      it("| when skillPackage src is not set, expect throw error", async () => {
        // setup
        sinon.stub(stringUtils, "isNonBlankString").returns(false);
        // call
        await expect(instance.handle(TEST_CMD)).eventually.rejected.property(
          "message",
          "Skill package src is not found in ask-resources.json.",
        );
        // verify
        expect(errorStub).calledOnceWith("Skill package src is not found in ask-resources.json.");
        expect(infoStub).calledTwice;
        expect(warnStub).not.called;
      });

      it("| when skillPackage src does not exist, expect throw error", async () => {
        // setup
        sinon.stub(fse, "existsSync").withArgs("./skillPackage").returns(false);
        // call
        await expect(instance.handle(TEST_CMD)).eventually.rejected.property(
          "message",
          "The skillMetadata src file ./skillPackage does not exist.",
        );
        // verify
        expect(errorStub).calledOnceWith("The skillMetadata src file ./skillPackage does not exist.");
        expect(infoStub).calledTwice;
        expect(warnStub).not.called;
      });

      it("| when Manifest initiation fails, expect throw error", async () => {
        // setup
        const fseExistsSync = sinon.stub(fse, "existsSync").withArgs("./skillPackage").returns(true);
        fseExistsSync.withArgs("invalidPath").returns(false);
        sinon.stub(stringUtils, "isNonBlankString").returns(true);
        pathStub.withArgs("./skillPackage", CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST).returns("invalidPath");
        // call
        await expect(instance.handle(TEST_CMD)).eventually.rejected.property("message", "File invalidPath not exists.");
        // verify
        expect(warnStub).calledOnce;
        expect(infoStub).calledTwice;
        expect(errorStub).not.called;
      });
    });

    describe("command handle - deploy skill metadata", () => {
      beforeEach(() => {
        sinon.stub(fse, "existsSync").returns(true);
      });

      it("| helper deploy skill metadata fails, expect throw error", async () => {
        // setup
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1, "error");
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith("error");
        // verify
        expect(errorStub).calledOnceWith("error");
        expect(infoStub.getCall(0)).calledWith("Deploy configuration loaded from ask-resources.json");
        expect(infoStub.getCall(1)).calledWith(`Deploy project for profile [${TEST_PROFILE}]\n`);
        expect(infoStub.getCall(2)).calledWith("==================== Deploy Skill Metadata ====================");
        expect(warnStub).not.called;
      });

      it("| helper deploy skill metadata with same hash skip result, expect display the message and continue", async () => {
        // setup
        sinon
          .stub(helper, "deploySkillMetadata")
          .callsArgWith(
            1,
            "The hash of current skill package folder does not change compared to the last deploy hash result, " +
              "CLI will skip the deploy of skill package.",
          );
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, "error");
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith("error");
        // verify
        expect(errorStub).calledOnceWith("error");
        expect(infoStub.getCall(2)).calledWith("==================== Deploy Skill Metadata ====================");
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. Normally it takes a few minutes...");
        expect(infoStub.getCall(4).args[0]).contains("Skill ID:");
        expect(warnStub).calledOnce;
      });

      it("| helper deploy skill metadata and no skillCode portion of work, expect quit with no error", async () => {
        // setup
        sinon
          .stub(helper, "deploySkillMetadata")
          .callsArgWith(
            1,
            "The hash of current skill package folder does not change compared to the last deploy hash result, " +
              "CLI will skip the deploy of skill package.",
          );
        sinon.stub(ResourcesConfig.prototype, "getCodeRegions").returns([]);
        sinon.stub(helper, "enableSkill").callsArgWith(2);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(errorStub).not.called;
        expect(infoStub.getCall(2)).calledWith("==================== Deploy Skill Metadata ====================");
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. Normally it takes a few minutes...");
        expect(infoStub.getCall(4).args[0]).contains("Skill ID:");
        expect(warnStub).calledOnce;
      });

      it("| helper deploy skill with skill metadata target, expect skip deploy metadata and skip build and infra deploy", async () => {
        // setup
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "enableSkill").callsArgWith(2);
        const cmd = {...TEST_CMD, target: CONSTANTS.DEPLOY_TARGET.SKILL_METADATA};

        // call
        await instance.handle(cmd);
        // verify
        expect(errorStub).not.called;
        expect(infoStub.getCall(2)).calledWith("==================== Deploy Skill Metadata ====================");
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. Normally it takes a few minutes...");
        expect(infoStub.getCall(4).args[0]).contains("Skill package deployed and all models built successfully.");
        expect(infoStub.getCall(5).args[0]).contains("Skill ID:");
        expect(warnStub).not.called;
      });

      it("| helper deploy skill, expect error if non supported value provided for the target flag", async () => {
        // setup
        const target = "some-non-supported-target";
        const cmd = {...TEST_CMD, target};

        // call
        await expect(instance.handle(cmd)).rejectedWith(
          `Target ${target} is not supported. Supported targets: ${Object.values(CONSTANTS.DEPLOY_TARGET)}.`,
        );
      });
    });

    describe("command handle - build skill code", () => {
      beforeEach(() => {
        sinon.stub(fse, "existsSync").returns(true);
      });

      it("| helper build skill code fails, expect throw error", async () => {
        // setup
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, "error");
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith("error");
        // verify
        expect(errorStub).calledOnceWith("error");
        expect(infoStub.getCall(2)).calledWith("==================== Deploy Skill Metadata ====================");
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. Normally it takes a few minutes...");
        expect(infoStub.getCall(4).args[0]).equal("Skill package deployed and all models built successfully.");
        expect(infoStub.getCall(5).args[0]).contains("Skill ID:");
        expect(infoStub.getCall(6).args[0]).equal("\n==================== Build Skill Code ====================");
        expect(warnStub).not.called;
      });
    });

    describe("command handle - deploy skill infrastructure", () => {
      const TEST_CODE_BUILD_RESULT = [
        {
          src: "codeSrc",
          build: {
            file: "buildFile",
            folder: "buildFolder",
          },
          buildFlow: "build-flow",
          regionsList: ["default", "NA"],
        },
      ];
      const TEST_CODE_SRC_BASENAME = "base";

      beforeEach(() => {
        sinon.stub(fse, "existsSync").returns(true);
      });

      it("| helper deploy skill infra without infraType, expect skip the flow by calling back", async () => {
        // setup
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
        sinon.stub(helper, "deploySkillInfrastructure").callsArgWith(2, "error");
        sinon.stub(helper, "enableSkill").callsArgWith(2);
        const stringUtilsIsNonBlankString = sinon.stub(stringUtils, "isNonBlankString").returns(true);
        stringUtilsIsNonBlankString.withArgs("@ask-cli/cfn-deployer").returns(false);
        sinon.stub(path, "resolve").returns(TEST_CODE_SRC_BASENAME);
        sinon.stub(fs, "statSync").returns({
          isDirectory: () => true,
        } as any);
        pathStub.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(errorStub).not.called;
        expect(infoStub.getCall(2).args[0]).equals("==================== Deploy Skill Metadata ====================");
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. Normally it takes a few minutes...");
        expect(infoStub.getCall(4).args[0]).equals("Skill package deployed and all models built successfully.");
        expect(infoStub.getCall(5).args[0]).contains("Skill ID:");
        expect(infoStub.getCall(6).args[0]).equals("\n==================== Build Skill Code ====================");
        expect(infoStub.getCall(7).args[0]).equals("Skill code built successfully.");
        expect(infoStub.getCall(8).args[0])
          .equals(`Code for region default+NA built to ${TEST_CODE_BUILD_RESULT[0].build.file} successfully \
with build flow ${TEST_CODE_BUILD_RESULT[0].buildFlow}.`);
        expect(warnStub).not.called;
      });

      it("| helper deploy skill with infrastructure target, expect skip skill metadata; build code and deploy infrastructure", async () => {
        // setup
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        const enabledStub = sinon.stub(helper, "enableSkill").callsArgWith(2);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
        sinon.stub(helper, "deploySkillInfrastructure").callsArgWith(3);
        sinon.stub(path, "resolve").returns(TEST_CODE_SRC_BASENAME);
        sinon.stub(fs, "statSync").returns({
          isDirectory: () => true,
        } as any);
        pathStub.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
        const cmd = {...TEST_CMD, target: CONSTANTS.DEPLOY_TARGET.SKILL_INFRASTRUCTURE};

        // call
        await instance.handle(cmd);
        // verify
        expect(errorStub).not.called;
        expect(infoStub.getCall(2).args[0]).equals("\n==================== Build Skill Code ====================");
        expect(infoStub.getCall(3).args[0]).equals("Skill code built successfully.");
        expect(infoStub.getCall(4).args[0])
          .equals(`Code for region default+NA built to ${TEST_CODE_BUILD_RESULT[0].build.file} successfully \
with build flow ${TEST_CODE_BUILD_RESULT[0].buildFlow}.`);
        expect(infoStub.getCall(5).args[0]).equals("\n==================== Deploy Skill Infrastructure ====================");
        expect(infoStub.getCall(6).args[0]).equals("\nSkill infrastructures deployed successfully through @ask-cli/cfn-deployer.");
        expect(warnStub).not.called;
        expect(enabledStub).not.calledOnce;
      });

      it("| helper deploy skill with infrastructure target, expect throw error when skill id does not exist", async () => {
        // setup
        sinon.stub(ResourcesConfig.prototype, "getSkillId").returns(undefined);
        const cmd = {...TEST_CMD, target: CONSTANTS.DEPLOY_TARGET.SKILL_INFRASTRUCTURE};

        // call
        await expect(instance.handle(cmd))
          .eventually.rejected.property("message")
          .include("the skillId has not been created yet. Please deploy your skillMetadata first");
      });

      it("| helper deploy skill infra fails, expect throw error", async () => {
        // setup
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
        sinon.stub(helper, "deploySkillInfrastructure").callsArgWith(3, "error");
        sinon.stub(helper, "enableSkill").callsArgWith(2);
        sinon.stub(path, "resolve").returns(TEST_CODE_SRC_BASENAME);
        sinon.stub(fs, "statSync").returns({
          isDirectory: () => true,
        } as any);
        pathStub.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith("error");
        // verify
        expect(errorStub).calledWith("error");
        expect(infoStub.getCall(2).args[0]).equals("==================== Deploy Skill Metadata ====================");
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. Normally it takes a few minutes...");
        expect(infoStub.getCall(4).args[0]).equals("Skill package deployed and all models built successfully.");
        expect(infoStub.getCall(5).args[0]).contains("Skill ID:");
        expect(infoStub.getCall(6).args[0]).equals("\n==================== Build Skill Code ====================");
        expect(infoStub.getCall(7).args[0]).equals("Skill code built successfully.");
        expect(infoStub.getCall(8).args[0])
          .equals(`Code for region default+NA built to ${TEST_CODE_BUILD_RESULT[0].build.file} successfully \
with build flow ${TEST_CODE_BUILD_RESULT[0].buildFlow}.`);
        expect(infoStub.getCall(9).args[0]).equals("\n==================== Deploy Skill Infrastructure ====================");
        expect(warnStub).not.called;
      });

      it("| deploy skill all pass, expect deploy succeeds and enableSkill get called", async () => {
        // setup
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
        sinon.stub(helper, "deploySkillInfrastructure").callsArgWith(3);
        const enabledSkillStub = sinon.stub(helper, "enableSkill").callsArgWith(2);
        sinon.stub(path, "resolve").returns(TEST_CODE_SRC_BASENAME);
        sinon.stub(fs, "statSync").returns({
          isDirectory: () => true,
        } as any);
        pathStub.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(errorStub).not.called;
        expect(infoStub.getCall(2).args[0]).equals("==================== Deploy Skill Metadata ====================");
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. Normally it takes a few minutes...");
        expect(infoStub.getCall(4).args[0]).equals("Skill package deployed and all models built successfully.");
        expect(infoStub.getCall(5).args[0]).contains("Skill ID:");
        expect(infoStub.getCall(6).args[0]).equals("\n==================== Build Skill Code ====================");
        expect(infoStub.getCall(7).args[0]).equals("Skill code built successfully.");
        expect(infoStub.getCall(8).args[0])
          .equals(`Code for region default+NA built to ${TEST_CODE_BUILD_RESULT[0].build.file} successfully \
with build flow ${TEST_CODE_BUILD_RESULT[0].buildFlow}.`);
        expect(infoStub.getCall(9).args[0]).equals("\n==================== Deploy Skill Infrastructure ====================");
        expect(infoStub.getCall(10).args[0]).equals("\nSkill infrastructures deployed successfully through @ask-cli/cfn-deployer.");
        expect(warnStub).not.called;
        expect(enabledSkillStub).calledOnce;
      });

      it("| deploy skill succeeds for ac skill, expect ask states lastDeployType is AC", async () => {
        // setup
        const setLastDeployTypeStub = sinon.spy(ResourcesConfig.prototype, "setSkillMetaLastDeployType");
        sinon.stub(acUtils, "isAcSkill").returns(true);
        sinon.stub(ui, "confirmDeploymentIfNeeded").callsArgWith(1, null, true);
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
        sinon.stub(helper, "deploySkillInfrastructure").callsArgWith(3);
        const enabledSkillStub = sinon.stub(helper, "enableSkill").callsArgWith(2);
        sinon.stub(path, "resolve").returns(TEST_CODE_SRC_BASENAME);
        sinon.stub(fs, "statSync").returns({
          isDirectory: () => true,
        } as any);
        pathStub.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);

        // call
        await instance.handle(TEST_CMD);

        // verify
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. For Alexa Conversations it can take 20-60 minutes...");
        expect(infoStub.getCall(10).args[0]).equals("\nSkill infrastructures deployed successfully through @ask-cli/cfn-deployer.");
        expect(errorStub).not.called;
        expect(warnStub).calledOnceWith(CONSTANTS.ACDL_BETA_MESSAGE + "\n");
        expect(enabledSkillStub).calledOnce;
        expect(setLastDeployTypeStub).calledOnceWith(TEST_PROFILE, CONSTANTS.DEPLOYMENT_TYPE.ALEXA_CONVERSATIONS);
      });

      it("| deploy skill succeeds for IM skill, expect ask states lastDeployType is IM", async () => {
        // setup
        const setLastDeployTypeStub = sinon.stub(ResourcesConfig.prototype, "setSkillMetaLastDeployType");
        sinon.stub(acUtils, "isAcSkill").returns(false);
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
        sinon.stub(helper, "deploySkillInfrastructure").callsArgWith(3);
        const enabledSkillStub = sinon.stub(helper, "enableSkill").callsArgWith(2);
        sinon.stub(path, "resolve").returns(TEST_CODE_SRC_BASENAME);
        sinon.stub(fs, "statSync").returns({
          isDirectory: () => true,
        } as any);
        pathStub.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
        // call
        await instance.handle(TEST_CMD);

        // verify
        expect(infoStub.getCall(3).args[0]).contains("Uploading the entire skill package and building the models. Normally it takes a few minutes...");
        expect(infoStub.getCall(10).args[0]).equals("\nSkill infrastructures deployed successfully through @ask-cli/cfn-deployer.");
        expect(errorStub).not.called;
        expect(warnStub).not.called;
        expect(enabledSkillStub).calledOnce;
        expect(setLastDeployTypeStub).calledOnceWith(TEST_PROFILE, CONSTANTS.DEPLOYMENT_TYPE.INTERACTION_MODEL);
      });
    });

    describe("command handle - enable skill", () => {
      const TEST_CODE_BUILD_RESULT = [
        {
          src: "codeSrc",
          build: {
            file: "buildFile",
            folder: "buildFolder",
          },
          buildFlow: "build-flow",
          regionsList: ["default", "NA"],
        },
      ];

      beforeEach(() => {
        sinon.stub(fse, "existsSync").returns(true);
      });

      it("| can callback warn when enable fails with CliWarn class", async () => {
        // setup
        const TEST_WARN = new CliWarn("warn");
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
        sinon.stub(helper, "deploySkillInfrastructure").callsArgWith(3);
        sinon.stub(helper, "enableSkill").callsArgWith(2, TEST_WARN);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(warnStub).calledWith(TEST_WARN);
      });

      it("| can callback error when enable fails", async () => {
        // setup
        const TEST_ERROR = "error";
        sinon.stub(helper, "deploySkillMetadata").callsArgWith(1);
        sinon.stub(helper, "buildSkillCode").callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
        sinon.stub(helper, "deploySkillInfrastructure").callsArgWith(3);
        sinon.stub(helper, "enableSkill").callsArgWith(2, "error");
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledWith(TEST_ERROR);
      });
    });
  });
});
