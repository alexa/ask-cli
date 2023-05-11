import {expect} from "chai";
import fs from "fs-extra";
import path from "path";
import sinon, { SinonStub } from "sinon";

import GitClient from "../../../../lib/clients/git-client";
import SkillInfrastructureController from "../../../../lib/controllers/skill-infrastructure-controller";
import * as helper from "../../../../lib/commands/new/helper";
import ResourcesConfig from "../../../../lib/model/resources-config";
import Manifest from "../../../../lib/model/manifest";
import stringUtils from "../../../../lib/utils/string-utils";
import {FILE_PATH, DEPLOYER_TYPE} from "../../../../lib/utils/constants";

describe("Commands new test - helper test", () => {
  const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(
    process.cwd(),
    "test",
    "unit",
    "fixture",
    "model",
    "regular-proj",
    "ask-resources.json",
  );
  const FIXTURE_MANIFEST_FILE_PATH = path.join(process.cwd(), "test", "unit", "fixture", "model", "manifest.json");
  const TEST_PROFILE = "default";
  const TEST_DO_DEBUG = false;
  const TEST_INFRA_PATH = "infraPath";
  const TEST_DEPLOYMENT_TYPE = "deployer";
  const TEST_TEMPLATE_URL = "value";
  const TEST_SKILL_FOLDER_NAME = "skillFolderName";
  const TEST_SKILL_NAME = "skillName";
  const TEST_SKILL_REGION = "us-west-2";
  const TEST_USER_INPUT: {projectFolderName: string; templateInfo: {templateBranch?: string; templateUrl: string}} = {
    projectFolderName: "projectName",
    templateInfo: {
      templateUrl: TEST_TEMPLATE_URL,
    },
  };

  describe("# test helper method - initializeDeployDelegate", () => {
    beforeEach(() => {
      new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
    });

    afterEach(() => {
      ResourcesConfig.dispose();
      sinon.restore();
    });

    it("| ui select deploy delegate pass and selection is opt-out, expect quit process", (done) => {
      // setup
      // call
      helper.initializeDeployDelegate(undefined, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal(null);
        done();
      });
    });

    it("| ui select Self hosted deploy delegate, expect quit process", (done) => {
      // setup
      // call
      helper.initializeDeployDelegate(DEPLOYER_TYPE.SELF_HOSTED.NAME, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal(null);
        done();
      });
    });

    it("| deployer is set in the template and same as what user wants, expect skip bootstrap", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillInfraType(TEST_PROFILE, TEST_DEPLOYMENT_TYPE);
      // call
      helper.initializeDeployDelegate(TEST_DEPLOYMENT_TYPE, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
        // verify
        expect(res).equal(TEST_DEPLOYMENT_TYPE);
        expect(err).equal(null);
        done();
      });
    });

    it("| bootstrap fails, expect throw error", (done) => {
      // setup
      const TEST_SELECTED_TYPE = "@ask-cli/test!!!@ ";
      ResourcesConfig.getInstance().setSkillInfraType(TEST_PROFILE, "");
      const fsEnsureDirSyncStub = sinon.stub(fs, "ensureDirSync");
      sinon.stub(SkillInfrastructureController.prototype, "bootstrapInfrastructures").callsArgWith(1, "error");
      // call
      helper.initializeDeployDelegate(TEST_SELECTED_TYPE, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
        // verify
        expect(fsEnsureDirSyncStub.args[0][0]).equal(path.join(TEST_INFRA_PATH, "infrastructure/test"));
        expect(res).equal(undefined);
        expect(err).equal("error");
        done();
      });
    });

    it("| bootstrap pass, expect return deployType", (done) => {
      // setup
      const TEST_SELECTED_TYPE = "  !!!test^^^  ";
      ResourcesConfig.getInstance().setSkillInfraType(TEST_PROFILE, "");
      const fsEnsureDirSyncStub = sinon.stub(fs, "ensureDirSync");
      sinon.stub(SkillInfrastructureController.prototype, "bootstrapInfrastructures").callsArgWith(1);
      // call
      helper.initializeDeployDelegate(TEST_SELECTED_TYPE, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
        // verify
        expect(fsEnsureDirSyncStub.args[0][0]).equal(path.join(TEST_INFRA_PATH, "infrastructure/test"));
        expect(res).equal(TEST_SELECTED_TYPE);
        expect(err).equal(null);
        done();
      });
    });
  });

  describe("# test helper method - downloadTemplateFromGit", () => {
    afterEach(() => {
      sinon.restore();
    });

    it("| git clone pass, expect return folder path", (done) => {
      // setup
      const TEST_FOLDER_PATH = "TEST_FOLDER_PATH";
      sinon.stub(path, "join").returns(TEST_FOLDER_PATH);
      const cloneStub = sinon.stub(GitClient.prototype, "clone");
      // call
      helper.downloadTemplateFromGit(TEST_USER_INPUT, TEST_DO_DEBUG, (err, res) => {
        // verify
        expect(cloneStub.args[0][0]).equal(TEST_TEMPLATE_URL);
        expect(res).equal(TEST_FOLDER_PATH);
        expect(err).equal(null);
        done();
      });
    });
    it("| git clone with custom branch, expect return folder path", (done) => {
      // setup
      const TEST_FOLDER_PATH = "TEST_FOLDER_PATH";
      const TEST_TEMPLATE_BRANCH = "test-branch";
      TEST_USER_INPUT.templateInfo.templateBranch = TEST_TEMPLATE_BRANCH;
      sinon.stub(path, "join").returns(TEST_FOLDER_PATH);
      const cloneStub = sinon.stub(GitClient.prototype, "clone");
      // call
      helper.downloadTemplateFromGit(TEST_USER_INPUT, TEST_DO_DEBUG, (err, res) => {
        // verify
        expect(cloneStub.args[0][0]).equal(TEST_TEMPLATE_URL);
        expect(cloneStub.args[0][1]).equal(TEST_TEMPLATE_BRANCH);
        expect(res).equal(TEST_FOLDER_PATH);
        expect(err).equal(null);
        done();
      });
    });
  });

  describe("# test helper method - loadSkillProjectModel", () => {
    const TEST_SKILLMETA_SRC = "./skillPackage";
    let pathJoinStub: SinonStub;

    beforeEach(() => {
      pathJoinStub = sinon
        .stub(path, "join");
      pathJoinStub.withArgs(TEST_SKILL_FOLDER_NAME, FILE_PATH.ASK_RESOURCES_JSON_CONFIG)
        .returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
      pathJoinStub.withArgs(TEST_SKILL_FOLDER_NAME, TEST_SKILLMETA_SRC)
        .returns(TEST_SKILLMETA_SRC);
      pathJoinStub.withArgs(TEST_SKILLMETA_SRC, "skill.json")
        .returns(FIXTURE_MANIFEST_FILE_PATH);
      pathJoinStub.callThrough();
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| new resources config fails, expect throw error", (done) => {
      // setup
      const fsExistsSyncStub = sinon.stub(fs, "existsSync");
      fsExistsSyncStub.withArgs(FIXTURE_RESOURCES_CONFIG_FILE_PATH).returns(false);
      fsExistsSyncStub.callThrough();
      // call
      try {
        helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
      } catch (e: any) {
        // verify
        expect(e?.message).includes(`File ${FIXTURE_RESOURCES_CONFIG_FILE_PATH} not exists.`);
        expect(e?.message).includes("please run 'ask util upgrade-project'");
        done();
      }
    });

    it("| skill metadata src does not exist, expect throw error", (done) => {
      // setup
      sinon.stub(stringUtils, "isNonBlankString").returns(false);
      // call
      try {
        helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
      } catch (e: any) {
        // verify
        expect(e?.message).equal('[Error]: Invalid skill project structure. Please set the "src" field in skillMetadata resource.');
        done();
      }
    });

    it("| skill meta src is absolue & skill package src does not exist, expect throw error", (done) => {
      // setup
      sinon.stub(stringUtils, "isNonBlankString").returns(true);
      sinon.stub(path, "isAbsolute").returns(true);
      const fsExistsSyncStub = sinon.stub(fs, "existsSync");
      fsExistsSyncStub.withArgs(TEST_SKILLMETA_SRC).returns(false);
      fsExistsSyncStub.callThrough();
      // call
      try {
        helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
      } catch (e: any) {
        // verify
        expect(e?.message).equal(`[Error]: Invalid skill package src. Attempt to get the skill package but doesn't exist: \
${ResourcesConfig.getInstance().getSkillMetaSrc(TEST_PROFILE)}.`);
        done();
      }
    });

    it("| skill meta src is not absolue & skill package src does not exist, expect throw error", (done) => {
      // setup
      sinon.stub(stringUtils, "isNonBlankString").returns(true);
      sinon.stub(path, "isAbsolute").returns(false);
      const fsExistsSyncStub = sinon.stub(fs, "existsSync")
      fsExistsSyncStub.withArgs(TEST_SKILLMETA_SRC).returns(false);
      fsExistsSyncStub.callThrough();
      // call
      try {
        helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
      } catch (e: any) {
        // verify
        expect(e?.message).equal(`[Error]: Invalid skill package src. Attempt to get the skill package but doesn't exist: \
${TEST_SKILLMETA_SRC}.`);
        done();
      }
    });

    it("| skill package manifest file does not exist, expect throw error", (done) => {
      // setup
      const fsExistsSyncStub = sinon.stub(fs, "existsSync");
      sinon.stub(stringUtils, "isNonBlankString").returns(true);
      sinon.stub(path, "isAbsolute").returns(true);
      fsExistsSyncStub.withArgs(TEST_SKILLMETA_SRC).returns(true);
      fsExistsSyncStub.withArgs(FIXTURE_MANIFEST_FILE_PATH).returns(false);
      fsExistsSyncStub.callThrough();
      // call
      try {
        helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
      } catch (e: any) {
        // verify FIXTURE_MANIFEST_FILE_PATH
        expect(e?.message).equal(`[Error]: Invalid skill project structure. Please make sure skill.json exists in ${TEST_SKILLMETA_SRC}.`);
        done();
      }
    });

    it("| new manifest file fails, expect throw error", (done) => {
      // setup
      const fsExistsSyncStub = sinon.stub(fs, "existsSync");
      sinon.stub(stringUtils, "isNonBlankString").returns(true);
      sinon.stub(path, "isAbsolute").returns(true);
      pathJoinStub.withArgs(TEST_SKILLMETA_SRC, "skill.json").returns("invalidPath");
      fsExistsSyncStub.withArgs(TEST_SKILLMETA_SRC).returns(true);
      fsExistsSyncStub.withArgs("invalidPath").returns(true);
      fsExistsSyncStub.callThrough();
      // call
      try {
        helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
      } catch (e: any) {
        // verify
        expect(e?.message).equal("No access to read/write file invalidPath.");
        done();
      }
    });

    it("| skill package structure passes the validation, expect no error", () => {
      // setup
      const fsExistsSyncStub = sinon.stub(fs, "existsSync");
      pathJoinStub.withArgs(TEST_SKILL_FOLDER_NAME, "ask-resources.json").returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
      sinon.stub(stringUtils, "isNonBlankString").returns(true);
      sinon.stub(path, "isAbsolute").returns(true);
      fsExistsSyncStub.withArgs(TEST_SKILLMETA_SRC).returns(true);
      fsExistsSyncStub.withArgs(FIXTURE_MANIFEST_FILE_PATH).returns(true);
      fsExistsSyncStub.callThrough();
      // call
      try {
        helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
      } catch (e: any) {
        // verify
        expect(e).equal(undefined);
      }
    });
  });

  describe("# test helper method - updateSkillProjectWithUserSettings", () => {
    beforeEach(() => {
      new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
      new Manifest(FIXTURE_MANIFEST_FILE_PATH);
    });

    afterEach(() => {
      Manifest.dispose();
      ResourcesConfig.dispose();
      sinon.restore();
    });

    it("| expect refresh skill project to update skill name and remove .git folder", () => {
      // setup
      const fsExistsSyncStub = sinon.stub(fs, "removeSync");
      // call
      helper.updateSkillProjectWithUserSettings(TEST_SKILL_NAME, TEST_SKILL_REGION, TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
      // verify
      expect(Manifest.getInstance().getSkillName()).equal(TEST_SKILL_NAME);
      expect(ResourcesConfig.getInstance().getProfile(TEST_PROFILE)).not.equal(null);
      expect(ResourcesConfig.getInstance().getSkillInfraUserConfig(TEST_PROFILE).awsRegion).equal(TEST_SKILL_REGION);
      expect(fsExistsSyncStub.args[0][0]).equal(path.join(TEST_SKILL_FOLDER_NAME, ".git"));
    });
  });
});
