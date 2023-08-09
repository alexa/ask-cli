const {expect} = require("chai");
const Listr = require("listr");
const sinon = require("sinon");
const path = require("path");
const fs = require("fs-extra");

const httpClient = require("../../../lib/clients/http-client");
const AuthorizationController = require("../../../lib/controllers/authorization-controller");
const SkillMetadataController = require("../../../lib/controllers/skill-metadata-controller");
const CliError = require("../../../lib/exceptions/cli-error");
const CliWarn = require("../../../lib/exceptions/cli-warn");
const Manifest = require("../../../lib/model/manifest");
const ResourcesConfig = require("../../../lib/model/resources-config");
const CONSTANTS = require("../../../lib/utils/constants");
const hashUtils = require("../../../lib/utils/hash-utils");
const zipUtils = require("../../../lib/utils/zip-utils");
const jsonView = require("../../../lib/view/json-view");
const Messenger = require("../../../lib/view/messenger");
const acUtil = require("../../../lib/utils/ac-util");
const { ImportStatusView } = require("../../../lib/view/import-status/import-status-view");
const SmapiClient = require("../../../lib/clients/smapi-client").default;

describe("Controller test - skill metadata controller test", () => {
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

  const TEST_PROFILE = "default"; // test file contains 'default' profile
  const TEST_ROOT_PATH = "root";
  const TEST_VENDOR_ID = "vendorId";
  const TEST_IGNORE_HASH = false;
  const TEST_SKILL_ID = "skillId";
  const TEST_STAGE = "stage";
  const TEST_PATH = "path";
  const TEST_PACKAGE_URL = "packageUrl";
  const TEST_CURRENT_HASH = "currentHash";
  const TEST_UPLOAD_URL = "uploadUrl";
  const TEST_EXPIRES_AT = "expiresAt";
  const TEST_LOCATION_URL = "locationUrl";
  const TEST_IMPORT_ID = "importId";
  const TEST_EXPORT_ID = "exportId";
  const TEST_FILE_CONTENT = "fileContent";
  const TEST_CONFIGURATION = {
    profile: TEST_PROFILE,
    doDebug: false,
  };
  let isAcSkillStub;

  beforeEach(() => {
    new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
    new Manifest(FIXTURE_MANIFEST_FILE_PATH);
    sinon.stub(Listr.prototype, 'run').resolves();
    isAcSkillStub = sinon.stub(acUtil, "isAcSkill").returns(false);
  });

  afterEach(() => {
    ResourcesConfig.dispose();
    Manifest.dispose();
    sinon.restore();
  });

  describe("# inspect correctness for constructor", () => {
    it("| initiate as a SkillMetadataController class", () => {
      const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      expect(skillMetaController).to.be.instanceOf(SkillMetadataController);
    });
  });

  describe("# test class method: deploySkillPackage", () => {
    let skillMetaController;

    beforeEach(() => {
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      sinon.stub(ImportStatusView.prototype, "displaySkillId").returns();
      sinon.stub(ImportStatusView.prototype, "displayImportId").returns();
      sinon.stub(ImportStatusView.prototype, "publishEvent").returns();
    });

    it("| skill package src is empty in ask-resources.json", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, null);
      // call
      skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal("Skill package src is not found in ask-resources.json.");
        done();
      });
    });

    it("| skill package src is not a valid file path", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(fs, "existsSync").withArgs(TEST_PATH).returns(false);
      // call
      skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal(`File ${TEST_PATH} does not exist.`);
        done();
      });
    });

    it("| getHash fails with error", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(fs, "existsSync").withArgs(TEST_PATH).returns(true);
      sinon.stub(hashUtils, "getHash").callsArgWith(1, "hashError", null);
      // call
      skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal("hashError");
        done();
      });
    });

    it("| getHash result same as lastDeployHash, expect quit with warn message", (done) => {
      // setup
      const LAST_DEPLOY = "lastDeploy";
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(fs, "existsSync").withArgs(TEST_PATH).returns(true);
      ResourcesConfig.getInstance().setSkillMetaLastDeployHash(TEST_PROFILE, LAST_DEPLOY);
      sinon.stub(hashUtils, "getHash").callsArgWith(1, null, LAST_DEPLOY);
      // call
      skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
        // verify
        expect(err).equal(
          "The hash of current skill package folder does not change compared to the " +
            "last deploy hash result, CLI will skip the deploy of skill package.",
        );
        expect(res).equal(undefined);
        done();
      });
    });

    it("| hash did not change and ignore hash flag passed, expect resourcesConfig updated correctly", (done) => {
      // setup
      const LAST_DEPLOY = "lastDeploy";
      const IGNORE_HASH = true;
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(fs, "existsSync").withArgs(TEST_PATH).returns(true);
      sinon.stub(hashUtils, "getHash").callsArgWith(1, null, LAST_DEPLOY);
      ResourcesConfig.getInstance().setSkillMetaLastDeployHash(TEST_PROFILE, LAST_DEPLOY);
      sinon.stub(SkillMetadataController.prototype, "putSkillPackage").callsArgWith(3, null, TEST_SKILL_ID);
      ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, TEST_SKILL_ID);
      // call
      skillMetaController.deploySkillPackage(TEST_VENDOR_ID, IGNORE_HASH, (err, res) => {
        // verify
        expect(err).equal(undefined);
        expect(res).equal(undefined);
        done();
      });
    });

    it("| hash does change, skillId exists and putSkillPackage passes, expect resourcesConfig updated correctly", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(fs, "existsSync").withArgs(TEST_PATH).returns(true);
      sinon.stub(hashUtils, "getHash").callsArgWith(1, null, TEST_CURRENT_HASH);
      sinon.stub(SkillMetadataController.prototype, "putSkillPackage").callsArgWith(3, null, TEST_SKILL_ID);
      ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, TEST_SKILL_ID);
      // call
      skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
        // verify
        expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal(TEST_CURRENT_HASH);
        expect(err).equal(undefined);
        expect(res).equal(undefined);
        done();
      });
    });

    it("| hash does change, skillId not exists and putSkillPackage passes, expect resourcesConfig updated correctly", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(fs, "existsSync").withArgs(TEST_PATH).returns(true);
      sinon.stub(hashUtils, "getHash").callsArgWith(1, null, TEST_CURRENT_HASH);
      sinon.stub(SkillMetadataController.prototype, "putSkillPackage").callsArgWith(3, null, TEST_SKILL_ID);
      ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, "");
      // call
      skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
        // verify
        expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal(TEST_CURRENT_HASH);
        expect(ResourcesConfig.getInstance().getSkillId(TEST_PROFILE)).equal(TEST_SKILL_ID);
        expect(err).equal(undefined);
        expect(res).equal(undefined);
        done();
      });
    });

    it("| putSkillPackage fails, expect callback put error message", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(fs, "existsSync").withArgs(TEST_PATH).returns(true);
      sinon.stub(hashUtils, "getHash").callsArgWith(1, null, TEST_CURRENT_HASH);
      sinon.stub(SkillMetadataController.prototype, "putSkillPackage").callsArgWith(3, "putErr");
      ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, TEST_SKILL_ID);
      // call
      skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
        // verify
        expect(err).equal("putErr");
        expect(res).equal(undefined);
        done();
      });
    });
  });

  describe("# test class method enableSkill", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
    });

    it("| callback error when skillId is not provided", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, "");
      // call
      skillMetaController.enableSkill((err, res) => {
        // verify
        expect(err).equal(`[Fatal]: Failed to find the skillId for profile [${TEST_PROFILE}],
 please make sure the skill metadata deployment has succeeded with result of a valid skillId.`);
        expect(res).equal(undefined);
        done();
      });
    });

    it("| return error when domainInfo is not provided", () => {
      // setup
      Manifest.getInstance().setApis({});
      const expectedErrMessage = 'Skill information is not valid. Please make sure "apis" field in the skill.json is not empty.';
      // call
      expect(() => skillMetaController.validateDomain()).to.throw(CliError, expectedErrMessage);
    });

    it("| return error when domainInfo contains more than one domain", () => {
      // setup
      Manifest.getInstance().setApis({
        custom: {},
        smartHome: {},
      });
      const expectedErrMessage = "Skill with multiple api domains cannot be enabled. Skipping the enable process.\n";
      // call
      expect(() => skillMetaController.validateDomain()).to.throw(CliWarn, expectedErrMessage);
    });

    it("| return error when domain cannot be enabled", () => {
      // setup
      Manifest.getInstance().setApis({
        smartHome: {},
      });
      const expectedErrMessage = 'Skill api domain "smartHome" cannot be enabled. Skipping the enable process.\n';
      // call
      expect(() => skillMetaController.validateDomain()).to.throw(CliWarn, expectedErrMessage);
    });

    it("| callback error when getSkillEnablement return error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, "getSkillEnablementError"); // stub smapi request
      skillMetaController.enableSkill((err, res) => {
        // verify
        expect(err).equal("getSkillEnablementError");
        expect(res).equal(undefined);
        done();
      });
    });

    it("| callback error when getSkillEnablement return error", async () => {
      // setup
      const responseBody = {
        Message: "somehow fails",
      };
      const response = {
        statusCode: 300,
        body: responseBody,
      };
      sinon.stub(httpClient, "request").callsArgWith(3, response); // stub smapi request
      await skillMetaController.enableSkill((err, res) => {
        // verify
        expect(err).equal(jsonView.toString(responseBody));
        expect(res).equal(undefined);
      });
    });

    it("| when skill already enabled, can callback skip enablement message", async () => {
      // setup
      const response = {
        statusCode: 200,
      };
      sinon.stub(httpClient, "request").callsArgWith(3, null, response); // stub smapi request
      sinon.stub(Messenger.getInstance(), "info");
      await skillMetaController.enableSkill((err, res) => {
        // verify
        expect(err).equal(undefined);
        expect(res).equal(undefined);
        expect(Messenger.getInstance().info.args[0][0]).equal("The skill is already enabled, skipping skill enablement.\n");
      });
    });

    it("| when skill is not enabled, can callback error when enable skill fail", async () => {
      // setup
      const getEnablementResponse = {
        statusCode: 404,
        body: {},
      };
      const httpClientRequestStub = sinon.stub(httpClient, "request");
      httpClientRequestStub.withArgs(sinon.match.any, "get-skill-enablement").callsArgWith(3, getEnablementResponse); // stub smapi request
      httpClientRequestStub.withArgs(sinon.match.any, "enable-skill").callsArgWith(3, "enableSkillError"); // stub smapi request

      await skillMetaController.enableSkill((err, res) => {
        // verify
        expect(err).equal("enableSkillError");
        expect(res).equal(undefined);
      });
    });

    it("| when skill is not enabled, can callback error when statusCode >= 300", async () => {
      // setup
      const getEnablementResponse = {
        statusCode: 404,
        body: {},
        Message: "not found",
      };
      const enableSkillResponseBody = {
        Message: "somehow fail",
      };
      const enableSkillResponse = {
        statusCode: 300,
        body: enableSkillResponseBody,
        Message: enableSkillResponseBody.Message,
      };
      const httpClientRequestStub = sinon.stub(httpClient, "request");
      httpClientRequestStub.withArgs(sinon.match.any, "get-skill-enablement").callsArgWith(3, getEnablementResponse); // stub smapi request
      httpClientRequestStub.withArgs(sinon.match.any, "enable-skill").callsArgWith(3, enableSkillResponse); // stub smapi request

      await skillMetaController.enableSkill((err, res) => {
        // verify
        expect(err).equal(jsonView.toString(enableSkillResponseBody));
        expect(res).equal(undefined);
      });
    });

    it("| when skill is not enabled, can callback success enable skill message", async () => {
      // setup
      const getEnablementResponse = {
        statusCode: 404,
        body: {},
      };
      const enableSkillResponse = {
        statusCode: 200,
      };
      sinon.stub(Messenger.getInstance(), "info");
      sinon.stub(httpClient, "request").withArgs(sinon.match.any, "get-skill-enablement").callsArgWith(3, getEnablementResponse, null);

      httpClient.request.withArgs(sinon.match.any, "enable-skill").callsArgWith(3, null, enableSkillResponse); // stub smapi request

      await skillMetaController.enableSkill((err, res) => {
        // verify
        expect(err).equal(undefined);
        expect(res).equal(undefined);
        expect(Messenger.getInstance().info.args[0][0]).equal("The skill has been enabled.\n");
      });
    });
  });

  describe("# test class method: putSkillPackage", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
    });


    it("| upload of skill package fails, expect callback with error", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(SkillMetadataController.prototype, "uploadSkillPackage").callsArgWith(1, "uploadErr");
      // call
      skillMetaController.putSkillPackage(TEST_PATH, TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype.uploadSkillPackage.args[0][0]).equal(TEST_PATH);
        expect(res).equal(undefined);
        expect(err).equal("uploadErr");
        done();
      });
    });

    it("| import skill package failed, expect callback with error", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(SkillMetadataController.prototype, "uploadSkillPackage").callsArgWith(1, null, {
        uploadUrl: TEST_UPLOAD_URL,
      });
      sinon.stub(SkillMetadataController.prototype, "_importPackage").callsArgWith(3, "importErr");
      // call
      skillMetaController.putSkillPackage(TEST_PATH, TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype._importPackage.args[0][0]).equal(TEST_SKILL_ID);
        expect(SkillMetadataController.prototype._importPackage.args[0][1]).equal(TEST_VENDOR_ID);
        expect(SkillMetadataController.prototype._importPackage.args[0][2]).equal(TEST_UPLOAD_URL);
        expect(res).equal(undefined);
        expect(err).equal("importErr");
        done();
      });
    });

    it("| poll skill package failed, expect callback with error", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(SkillMetadataController.prototype, "uploadSkillPackage").callsArgWith(1, null, {
        uploadUrl: TEST_UPLOAD_URL,
      });
      sinon.stub(SkillMetadataController.prototype, "_importPackage").callsArgWith(3, null, {
        headers: {location: TEST_LOCATION_URL},
      });
      sinon.stub(SkillMetadataController.prototype, "_pollImportStatus").callsArgWith(1, "pollErr");
      sinon.stub(ImportStatusView.prototype, "displayImportId").returns();

      // call
      skillMetaController.putSkillPackage(TEST_PATH, TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype._pollImportStatus.args[0][0]).equal(TEST_LOCATION_URL);
        expect(res).equal(undefined);
        expect(err).equal("pollErr");
        done();
      });
    });

    it("| poll skill package replies with non succeed result, expect callback with error response", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(SkillMetadataController.prototype, "uploadSkillPackage").callsArgWith(1, null, {
        uploadUrl: TEST_UPLOAD_URL,
      });
      sinon.stub(SkillMetadataController.prototype, "_importPackage").callsArgWith(3, null, {
        headers: {location: TEST_LOCATION_URL},
      });
      sinon.stub(SkillMetadataController.prototype, "_pollImportStatus").callsArgWith(1, null, {
        body: {status: CONSTANTS.SKILL.PACKAGE_STATUS.FAILED},
      });
      // call
      skillMetaController.putSkillPackage(TEST_PATH, TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype._pollImportStatus.args[0][0]).equal(TEST_LOCATION_URL);
        expect(res).equal(undefined);
        expect(err).equal(jsonView.toString({status: CONSTANTS.SKILL.PACKAGE_STATUS.FAILED}));
        done();
      });
    });

    it("| poll skill package finished, expect callback skillId", (done) => {
      // setup
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      sinon.stub(SkillMetadataController.prototype, "uploadSkillPackage").callsArgWith(1, null, {
        uploadUrl: TEST_UPLOAD_URL,
      });
      sinon.stub(SkillMetadataController.prototype, "_importPackage").callsArgWith(3, null, {
        headers: {location: TEST_LOCATION_URL},
      });
      sinon.stub(SkillMetadataController.prototype, "_pollImportStatus").callsArgWith(1, null, {
        body: {
          status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED,
          skill: {skillId: TEST_SKILL_ID},
        },
      });
      // call
      skillMetaController.putSkillPackage(TEST_PATH, TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype._pollImportStatus.args[0][0]).equal(TEST_LOCATION_URL);
        expect(err).equal(null);
        expect(res).equal(TEST_SKILL_ID);
        done();
      });
    });
  });

  describe("# test class method: getSkillPackage", () => {
    let skillMetaController;

    beforeEach(() => {
      ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
    });

    it("| export package request fails, expect callback with error", (done) => {
      // setup
      sinon.stub(SkillMetadataController.prototype, "_exportPackage").callsArgWith(2, "exportErr");
      // call
      skillMetaController.getSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_STAGE, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype._exportPackage.args[0][0]).equal(TEST_SKILL_ID);
        expect(SkillMetadataController.prototype._exportPackage.args[0][1]).equal(TEST_STAGE);
        expect(res).equal(undefined);
        expect(err).equal("exportErr");
        done();
      });
    });

    it("| export package returns exportId but poll status fails, expect callback with error", (done) => {
      // setup
      sinon.stub(SkillMetadataController.prototype, "_exportPackage").callsArgWith(2, null, {
        statusCode: 202,
        headers: {
          location: `${TEST_EXPORT_ID}`,
        },
      });
      sinon.stub(SkillMetadataController.prototype, "_pollExportStatus").callsArgWith(1, "polling error");
      // call
      skillMetaController.getSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_STAGE, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype._pollExportStatus.args[0][0]).equal(TEST_EXPORT_ID);
        expect(res).equal(undefined);
        expect(err).equal("polling error");
        done();
      });
    });

    it("| package exported successfully but unzip fails, expect callback zip error", (done) => {
      // setup
      sinon.stub(SkillMetadataController.prototype, "_exportPackage").callsArgWith(2, null, {
        statusCode: 202,
        headers: {
          location: `${TEST_EXPORT_ID}`,
        },
      });
      sinon.stub(SkillMetadataController.prototype, "_pollExportStatus").callsArgWith(1, null, {
        statusCode: 200,
        body: {
          skill: {
            location: TEST_PACKAGE_URL,
          },
        },
      });
      sinon.stub(zipUtils, "unzipRemoteZipFile").callsArgWith(3, "unzip error");
      // call
      skillMetaController.getSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_STAGE, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype._pollExportStatus.args[0][0]).equal(TEST_EXPORT_ID);
        expect(res).equal(undefined);
        expect(err).equal("unzip error");
        done();
      });
    });

    it("| package exported successfully and unzip works, expect no error returned", (done) => {
      // setup
      sinon.stub(SkillMetadataController.prototype, "_exportPackage").callsArgWith(2, null, {
        statusCode: 202,
        headers: {
          location: `${TEST_EXPORT_ID}`,
        },
      });
      sinon.stub(SkillMetadataController.prototype, "_pollExportStatus").callsArgWith(1, null, {
        statusCode: 200,
        body: {
          skill: {
            location: TEST_PACKAGE_URL,
          },
        },
      });
      sinon.stub(zipUtils, "unzipRemoteZipFile").callsArgWith(3, null);
      // call
      skillMetaController.getSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_STAGE, (err, res) => {
        // verify
        expect(SkillMetadataController.prototype._pollExportStatus.args[0][0]).equal(TEST_EXPORT_ID);
        expect(res).equal(undefined);
        expect(err).equal(null);
        done();
      });
    });
  });

  describe("# test class method: uploadSkillPackage", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
    });

    it("| create upload url fails, expect callback error", (done) => {
      // setup
      sinon.stub(SkillMetadataController.prototype, "_createUploadUrl").callsArgWith(0, "createUploadErr");
      // call
      skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal("createUploadErr");
        done();
      });
    });

    it("| create zip fails, expect callback error", (done) => {
      // setup
      sinon.stub(SkillMetadataController.prototype, "_createUploadUrl").callsArgWith(0, null, {
        uploadUrl: TEST_UPLOAD_URL,
      });
      sinon.stub(zipUtils, "createTempZip").callsArgWith(1, "zipErr");
      // call
      skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
        // verify
        expect(zipUtils.createTempZip.args[0][0]).equal(TEST_PATH);
        expect(res).equal(undefined);
        expect(err).equal("zipErr");
        done();
      });
    });

    it("| upload zip file fails, expect callback error", (done) => {
      // setup
      sinon.stub(fs, "readFileSync").withArgs(TEST_PATH).returns(TEST_FILE_CONTENT);
      sinon.stub(SkillMetadataController.prototype, "_createUploadUrl").callsArgWith(0, null, {
        uploadUrl: TEST_UPLOAD_URL,
      });
      sinon.stub(zipUtils, "createTempZip").callsArgWith(1, null, TEST_PATH);
      sinon.stub(fs, "removeSync");
      sinon.stub(httpClient, "putByUrl").callsArgWith(4, "uploadErr");
      // call
      skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
        // verify
        expect(httpClient.putByUrl.args[0][0]).equal(TEST_UPLOAD_URL);
        expect(httpClient.putByUrl.args[0][1]).equal(TEST_FILE_CONTENT);
        expect(httpClient.putByUrl.args[0][2]).equal("upload-skill-package");
        expect(httpClient.putByUrl.args[0][3]).equal(false);
        expect(res).equal(undefined);
        expect(err).equal("uploadErr");
        done();
      });
    });

    it("| upload zip file meets error, expect callback error", (done) => {
      // setup
      sinon.stub(zipUtils, "createTempZip").callsArgWith(1, null, TEST_PATH);
      sinon.stub(fs, "readFileSync").withArgs(TEST_PATH).returns(TEST_FILE_CONTENT);
      sinon.stub(SkillMetadataController.prototype, "_createUploadUrl").callsArgWith(0, null, {
        uploadUrl: TEST_UPLOAD_URL,
      });
      sinon.stub(fs, "removeSync");
      sinon.stub(httpClient, "putByUrl").callsArgWith(4, null, {
        statusCode: 401,
      });
      // call
      skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
        // verify
        expect(httpClient.putByUrl.args[0][0]).equal(TEST_UPLOAD_URL);
        expect(httpClient.putByUrl.args[0][1]).equal(TEST_FILE_CONTENT);
        expect(httpClient.putByUrl.args[0][2]).equal("upload-skill-package");
        expect(httpClient.putByUrl.args[0][3]).equal(false);
        expect(res).equal(undefined);
        expect(err).equal("[Error]: Upload of skill package failed. Please try again with --debug to see more details.");
        done();
      });
    });

    it("| upload skill package succeeds, expect callback upload result", (done) => {
      // setup
      sinon.stub(zipUtils, "createTempZip").callsArgWith(1, null, TEST_PATH);
      sinon.stub(fs, "readFileSync").withArgs(TEST_PATH).returns(TEST_FILE_CONTENT);
      sinon.stub(SkillMetadataController.prototype, "_createUploadUrl").callsArgWith(0, null, {
        uploadUrl: TEST_UPLOAD_URL,
      });
      sinon.stub(fs, "removeSync");
      sinon.stub(httpClient, "putByUrl").callsArgWith(4, null, {statusCode: 202});
      // call
      skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
        // verify
        expect(httpClient.putByUrl.args[0][0]).equal(TEST_UPLOAD_URL);
        expect(httpClient.putByUrl.args[0][1]).equal(TEST_FILE_CONTENT);
        expect(httpClient.putByUrl.args[0][2]).equal("upload-skill-package");
        expect(httpClient.putByUrl.args[0][3]).equal(false);
        expect(err).equal(null);
        expect(res).deep.equal({
          uploadUrl: TEST_UPLOAD_URL,
        });
        done();
      });
    });
  });

  describe("# test class method: getInteractionModelLocales", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
    });

    it("| returns the correct list when there is no file in the model folder", () => {
      // setup
      sinon.stub(path, "join").returns("");
      sinon.stub(fs, "readdirSync").returns([]);
      // call & verify
      expect(skillMetaController.getInteractionModelLocales()).deep.equal({});
    });

    it("| returns the correct result when some locale exist some do not", () => {
      // setup
      sinon.stub(fs, "readdirSync").returns(["a/b/en-US.json", "/d/e/en.json", "/f/g/en-US", "en-US", "de-DE.json"]);
      // call & verify
      expect(skillMetaController.getInteractionModelLocales()["en-US"].endsWith(path.join("a", "b", "en-US.json"))).equal(true);
      expect(skillMetaController.getInteractionModelLocales()["de-DE"].endsWith("de-DE.json")).equal(true);
    });
  });

  describe("# test class method: _createUploadUrl", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
    });

    it("| skillPackageSrc create upload fails, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, "createUploadErr"); // stub smapi request
      // call
      skillMetaController._createUploadUrl((err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal("createUploadErr");
        done();
      });
    });

    it("| skillPackageSrc create upload returns error response, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, null, {
        statusCode: 403,
        body: {
          error: "message",
        },
      }); // stub smapi request
      // call
      skillMetaController._createUploadUrl((err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal(jsonView.toString({error: "message"}));
        done();
      });
    });

    it("| skillPackageSrc create upload succeeds, expect callback with createUpload response", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, null, {
        statusCode: 200,
        headers: {},
        body: {
          uploadUrl: TEST_UPLOAD_URL,
          expiresAt: TEST_EXPIRES_AT,
        },
      }); // stub smapi request
      // call
      skillMetaController._createUploadUrl((err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).deep.equal({
          uploadUrl: TEST_UPLOAD_URL,
          expiresAt: TEST_EXPIRES_AT,
        });
        done();
      });
    });
  });

  describe("# test class method: _importPackage", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
    });

    it("| import package fails, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, "importErr"); // stub smapi request
      // call
      skillMetaController._importPackage(TEST_SKILL_ID, TEST_VENDOR_ID, TEST_LOCATION_URL, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal("importErr");
        done();
      });
    });

    it("| import package returns error response, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, null, {
        statusCode: 403,
        body: {
          error: "message",
        },
      }); // stub smapi request
      // call
      skillMetaController._importPackage(TEST_SKILL_ID, TEST_VENDOR_ID, TEST_LOCATION_URL, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal(jsonView.toString({error: "message"}));
        done();
      });
    });

    it("| import package succeeds, expect callback with createUpload response", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, null, {
        statusCode: 200,
        headers: {},
        body: {
          response: "response",
        },
      }); // stub smapi request
      // call
      skillMetaController._importPackage(TEST_SKILL_ID, TEST_VENDOR_ID, TEST_LOCATION_URL, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).deep.equal({
          statusCode: 200,
          headers: {},
          body: {
            response: "response",
          },
        });
        done();
      });
    });
  });

  describe("# test class method: _exportPackage", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
    });

    it("| export package fails, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, "exportErr"); // stub smapi request
      // call
      skillMetaController._exportPackage(TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal("exportErr");
        done();
      });
    });

    it("| export package returns error response, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, null, {
        statusCode: 403,
        body: {
          error: "message",
        },
      }); // stub smapi request
      // call
      skillMetaController._exportPackage(TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal(jsonView.toString({error: "message"}));
        done();
      });
    });

    it("| export package succeeds, expect callback with export response", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, null, {
        statusCode: 200,
        headers: {},
        body: {
          response: "response",
        },
      }); // stub smapi request
      // call
      skillMetaController._exportPackage(TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).deep.equal({
          statusCode: 200,
          headers: {},
          body: {
            response: "response",
          },
        });
        done();
      });
    });
  });

  describe("# test class method: _pollImportStatus", () => {
    const smapiImportStatusResponse200 = {
      statusCode: 200,
      body: {
        status: "SUCCEEDED",
        skill: {
          resources: [
            {
              name: "InteractionModel.en-US",
              status: "SUCCEEDED",
            },
            {
              name: "InteractionModel.en-CA",
              status: "SUCCEEDED",
            },
            {
              name: "Manifest",
              status: "SUCCEEDED",
            },
          ],
          skillId: TEST_SKILL_ID,
        },
      },
      headers: {},
    };
    const smapiImportStatusResponseInProgress = {
      statusCode: 200,
      body: {
        status: "IN_PROGRESS",
        skill: {
          resources: [
            {
              name: "InteractionModel.en-US",
              status: "IN_PROGRESS",
            },
            {
              name: "InteractionModel.en-CA",
              status: "IN_PROGRESS",
            },
            {
              name: "Manifest",
              status: "IN_PROGRESS",
            },
          ],
          skillId: TEST_SKILL_ID,
        },
      },
      headers: {},
    };
    const smapiImportStatusResponse200Failed = {
      statusCode: 200,
      body: {
        status: "FAILED",
        skill: {
          resources: [
            {
              name: "InteractionModel.en-US",
              status: "FAILED",
            },
            {
              name: "InteractionModel.en-CA",
              status: "FAILED",
            },
            {
              name: "Manifest",
              status: "FAILED",
            },
          ],
          skillId: TEST_SKILL_ID,
        },
      },
      headers: {},
    };
    const smapiImportStatusResponse403 = {
      statusCode: 403,
      body: {
        error: "message",
      },
    };
    const smapiImportStatusResponse200EmptyResources = {
      statusCode: 200,
      body: {
        status: "SUCCEEDED",
        skill: {
          resources: [],
          skillId: TEST_SKILL_ID,
        },
      },
      headers: {},
    };
    const smapiImportStatusResponseWithWarningsInProgress = {
      statusCode: 200,
      body: {
        status: "IN_PROGRESS",
        skill: {
          resources: [
            {
              name: "InteractionModel.en-US",
              status: "IN_PROGRESS",
            },
          ],
          skillId: TEST_SKILL_ID,
        },
        warnings: [
          {
            message: "test-warning",
          },
        ],
      },
      headers: {},
    };
    const smapiImportStatusResponseWithWarnings200 = {
      statusCode: 200,
      body: {
        status: "SUCCEEDED",
        skill: {
          resources: [
            {
              name: "InteractionModel.en-US",
              status: "SUCCEEDED",
            },
          ],
          skillId: TEST_SKILL_ID,
        },
        warnings: [
          {
            message: "test-warning",
          },
        ],
      },
      headers: {},
    };
    let requestStub;
    let importStatusStub;
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
      sinon.stub(ImportStatusView.prototype, "displayImportId").returns();
      requestStub = sinon.stub(httpClient, "request");
    });

    it("| poll status with getImportStatus fails, expect callback error", (done) => {
      // setup
      requestStub.callsArgWith(3, "pollErr"); // stub smapi request
      // call
      skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
        // verify
        expect(res).equal(null);
        expect(err).equal("pollErr");
        done();
      });
    }).timeout(20000);

    it("| poll status with getImportStatus return error response, expect callback error", (done) => {
      // setup
      requestStub.callsArgWith(3, null, {
        statusCode: 403,
        body: {
          error: "message",
        },
      }); // stub smapi request
      // call
      skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
        // verify
        expect(res).equal(null);
        expect(err).equal(jsonView.toString({error: "message"}));
        done();
      });
    }).timeout(20000);

    it("| poll status with getImportStatus return success, expect callback with getImportStatus response", (done) => {
      // setup
      requestStub.callsArgWith(3, null, {
        statusCode: 200,
        body: {
          status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED,
        },
        headers: {},
      }); // stub smapi request
      // call
      skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).deep.equal({
          statusCode: 200,
          body: {
            status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED,
          },
          headers: {},
        });
        done();
      });
    }).timeout(20000);

    it("| poll status with getImportStatus warnings, expect warnings logged", (done) => {
      // setup
      requestStub.callsArgWith(3, null, smapiImportStatusResponseWithWarnings200);

      // call
      skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).deep.equal(smapiImportStatusResponseWithWarnings200);
        done();
      });
    }).timeout(3000);

    it("| poll status retries with getImportStatus warnings, expects warnings logged once", (done) => {
      // setup
      sinon.useFakeTimers().tickAsync(CONSTANTS.CONFIGURATION.RETRY.MAX_RETRY_INTERVAL);
      requestStub
        .onCall(0)
        .callsArgWith(3, null, smapiImportStatusResponseWithWarningsInProgress)
        .onCall(1)
        .callsArgWith(3, null, smapiImportStatusResponseWithWarnings200);

      // call
      skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).deep.equal(smapiImportStatusResponseWithWarnings200);
        done();
      });
    }).timeout(3000);

    describe("for Alexa Conversation builds ", () => {
      const smapiSkillStatusResponse200 = {
        statusCode: 200,
        body: {
          interactionModel: {
            "en-US": {
              lastUpdateRequest: {
                status: "SUCCEEDED",
                buildDetails: {
                  steps: [
                    {
                      name: "LANGUAGE_MODEL_QUICK_BUILD",
                      status: "SUCCEEDED",
                    },
                    {
                      name: "LANGUAGE_MODEL_FULL_BUILD",
                      status: "SUCCEEDED",
                    },
                    {
                      name: "ALEXA_CONVERSATIONS_QUICK_BUILD",
                      status: "SUCCEEDED",
                    },
                    {
                      name: "ALEXA_CONVERSATIONS_FULL_BUILD",
                      status: "SUCCEEDED",
                    },
                  ],
                },
              },
            },
          },
        },
        headers: {},
      };
      const smapiSkillStatusResponse200QuickBuildSucceeded = {
        statusCode: 200,
        body: {
          interactionModel: {
            "en-US": {
              lastUpdateRequest: {
                status: "IN_PROGRESS",
                buildDetails: {
                  steps: [
                    {
                      name: "ALEXA_CONVERSATIONS_QUICK_BUILD",
                      status: "SUCCEEDED",
                    },
                    {
                      name: "ALEXA_CONVERSATIONS_FULL_BUILD",
                    },
                  ],
                },
              },
            },
          },
        },
        headers: {},
      };
      const smapiSkillStatusResponse200InProgress = {
        statusCode: 200,
        body: {
          interactionModel: {
            "en-US": {
              lastUpdateRequest: {
                status: "IN_PROGRESS",
                buildDetails: {
                  steps: [
                    {
                      name: "ALEXA_CONVERSATIONS_QUICK_BUILD",
                      status: "IN_PROGRESS",
                    },
                  ],
                },
              },
            },
          },
        },
        headers: {},
      };
      const smapiSkillStatusResponse200BothLocalesInProgress = {
        statusCode: 200,
        body: {
          interactionModel: {
            "en-US": {
              lastUpdateRequest: {
                status: "IN_PROGRESS",
                buildDetails: {
                  steps: [
                    {
                      name: "ALEXA_CONVERSATIONS_QUICK_BUILD",
                      status: "IN_PROGRESS",
                    },
                  ],
                },
              },
            },
            "en-CA": {
              lastUpdateRequest: {
                status: "IN_PROGRESS",
                buildDetails: {
                  steps: [
                    {
                      name: "ALEXA_CONVERSATIONS_QUICK_BUILD",
                      status: "IN_PROGRESS",
                    },
                  ],
                },
              },
            },
          },
        },
        headers: {},
      };
      const smapiSkillStatusResponse200Failed = {
        statusCode: 200,
        body: {
          interactionModel: {
            "en-US": {
              lastUpdateRequest: {
                status: "FAILED",
                buildDetails: {
                  steps: [
                    {
                      name: "LANGUAGE_MODEL_QUICK_BUILD",
                      status: "SUCCEEDED",
                    },
                    {
                      name: "LANGUAGE_MODEL_FULL_BUILD",
                      status: "FAILED",
                    },
                    {
                      name: "ALEXA_CONVERSATIONS_QUICK_BUILD",
                      status: "SUCCEEDED",
                    },
                    {
                      name: "ALEXA_CONVERSATIONS_FULL_BUILD",
                      status: "FAILED",
                    },
                  ],
                },
              },
            },
            "en-CA": {
              lastUpdateRequest: {
                status: "FAILED",
                buildDetails: {
                  steps: [
                    {
                      name: "LANGUAGE_MODEL_QUICK_BUILD",
                      status: "FAILED",
                    },
                    {
                      name: "LANGUAGE_MODEL_FULL_BUILD",
                      status: "FAILED",
                    },
                    {
                      name: "ALEXA_CONVERSATIONS_QUICK_BUILD",
                      status: "FAILED",
                    },
                    {
                      name: "ALEXA_CONVERSATIONS_FULL_BUILD",
                      status: "FAILED",
                    },
                  ],
                },
              },
            },
          },
        },
        headers: {},
      };
      const smapiSkillStatusNoACBuildResponse200 = {
        statusCode: 200,
        body: {
          interactionModel: {
            "en-US": {
              lastUpdateRequest: {
                status: "SUCCEEDED",
                buildDetails: {
                  steps: [
                    {
                      name: "LANGUAGE_MODEL_QUICK_BUILD",
                      status: "SUCCEEDED",
                    },
                    {
                      name: "LANGUAGE_MODEL_FULL_BUILD",
                      status: "SUCCEEDED",
                    },
                  ],
                },
              },
            },
          },
        },
        headers: {},
      };
      const smapiImportStatusResponse200EmptySkillID = {
        statusCode: 200,
        body: {
          status: "SUCCEEDED",
          skill: {
            resources: [
              {
                name: "InteractionModel.en-US",
                status: "SUCCEEDED",
              },
              {
                name: "InteractionModel.en-CA",
                status: "SUCCEEDED",
              },
            ],
            skillId: "",
          },
        },
        headers: {},
      };
      let skillStatusStub;

      beforeEach(() => {
        isAcSkillStub.returns(true);
      });

      it("| poll import status with skill status with no AC Build information, expect callback with no AC Build information", (done) => {
        // setup
        skillStatusStub = requestStub.withArgs(sinon.match.any, "get-skill-status");
        importStatusStub = requestStub.withArgs(sinon.match.any, "get-import-status");
        skillStatusStub.callsArgWith(3, null, smapiSkillStatusNoACBuildResponse200);
        importStatusStub.callsArgWith(3, null, smapiImportStatusResponse200);
        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(err).equal(null);
          expect(res).deep.equal(smapiImportStatusResponse200);
          done();
        });
      });

      it("| poll import status with skill status with AC Build In Progress, expect callback with no AC Build information", (done) => {
        // setup
        skillStatusStub = requestStub.withArgs(sinon.match.any, "get-skill-status");
        importStatusStub = requestStub.withArgs(sinon.match.any, "get-import-status");
        skillStatusStub.callsArgWith(3, null, smapiSkillStatusResponse200InProgress);
        importStatusStub.callsArgWith(3, null, smapiImportStatusResponse200);
        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(err).equal(null);
          expect(res).deep.equal(smapiImportStatusResponse200);
          done();
        });
      });

      it("| poll import status with multiple retries, expect callback with correct response", (done) => {
        // setup
        sinon.useFakeTimers().tickAsync(CONSTANTS.CONFIGURATION.RETRY.MAX_RETRY_INTERVAL);
        requestStub
          .onCall(0)
          .callsArgWith(3, null, smapiImportStatusResponseInProgress)
          .onCall(1)
          .callsArgWith(3, null, smapiSkillStatusResponse200QuickBuildSucceeded)
          .onCall(2)
          .callsArgWith(3, null, smapiImportStatusResponse200)
          .onCall(3)
          .callsArgWith(3, null, smapiSkillStatusResponse200);
        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(err).equal(null);
          expect(res).deep.equal(smapiImportStatusResponse200);
          done();
        });
      }).timeout(20000000);

      it("| poll status with getImportStatus return error response, expect callback error", (done) => {
        // setup
        skillStatusStub = requestStub.withArgs(sinon.match.any, "get-skill-status");
        importStatusStub = requestStub.withArgs(sinon.match.any, "get-import-status");
        skillStatusStub.callsArgWith(3, null, smapiSkillStatusResponse200);
        importStatusStub.callsArgWith(3, null, smapiImportStatusResponse403);
        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(res).equal(null);
          expect(err).equal(jsonView.toString({error: "message"}));
          expect(skillStatusStub.called).equal(false);
          done();
        });
      });

      it("| poll import status with getSkillStatus fails, expect callback error", (done) => {
        // setup
        skillStatusStub = requestStub.withArgs(sinon.match.any, "get-skill-status");
        importStatusStub = requestStub.withArgs(sinon.match.any, "get-import-status");
        skillStatusStub.callsArgWith(3, "skillStatusErr");
        importStatusStub.callsArgWith(3, null, smapiImportStatusResponse200);
        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(res).equal(null);
          expect(err).equal("skillStatusErr");
          done();
        });
      });

      it("| poll import status with getSkillStatus build failures", (done) => {
        // setup
        sinon.useFakeTimers().tickAsync(CONSTANTS.CONFIGURATION.RETRY.MAX_RETRY_INTERVAL);
        requestStub
          .onCall(0)
          .callsArgWith(3, null, smapiImportStatusResponseInProgress)
          .onCall(1)
          .callsArgWith(3, null, smapiSkillStatusResponse200BothLocalesInProgress)
          .onCall(2)
          .callsArgWith(3, null, smapiImportStatusResponse200Failed)
          .onCall(3)
          .callsArgWith(3, null, smapiSkillStatusResponse200Failed);

        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(err).equal(null);
          expect(res).deep.equal(smapiImportStatusResponse200Failed);
          done();
        });
      }).timeout(3000);

      it("| poll status smapi calls return success, expect GetSkillStatus calls", (done) => {
        // setup
        sinon.useFakeTimers().tickAsync(CONSTANTS.CONFIGURATION.RETRY.MAX_RETRY_INTERVAL);
        requestStub
          .onCall(0)
          .callsArgWith(3, null, smapiImportStatusResponseInProgress)
          .onCall(1)
          .callsArgWith(3, null, smapiSkillStatusResponse200InProgress)
          .onCall(2)
          .callsArgWith(3, null, smapiImportStatusResponse200)
          .onCall(3)
          .callsArgWith(3, null, smapiSkillStatusResponse200);
        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(err).equal(null);
          expect(res).deep.equal(smapiImportStatusResponse200);
          done();
        });
      }).timeout(3000);

      it("| poll status smapi calls return empty SkillID, expect no GetSkillStatus calls", (done) => {
        // setup
        sinon.useFakeTimers().tickAsync(CONSTANTS.CONFIGURATION.RETRY.MAX_RETRY_INTERVAL);
        requestStub
          .onCall(0)
          .callsArgWith(3, null, smapiImportStatusResponse200EmptySkillID)
          .onCall(1)
          .callsArgWith(3, null, smapiSkillStatusResponse200InProgress)
          .onCall(2)
          .callsArgWith(3, null, smapiImportStatusResponse200EmptySkillID)
          .onCall(3)
          .callsArgWith(3, null, smapiSkillStatusResponse200);

        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(err).equal(null);
          expect(res).deep.equal(smapiImportStatusResponse200EmptySkillID);
          expect(requestStub.callCount).equals(1);
          done();
        });
      });

      it("| poll status smapi calls doesn't print any messages if the import status doesn't go to in progress", (done) => {
        // setup
        skillStatusStub = requestStub.withArgs(sinon.match.any, "get-skill-status");
        importStatusStub = requestStub.withArgs(sinon.match.any, "get-import-status");
        skillStatusStub.callsArgWith(3, null, smapiSkillStatusResponse200);
        importStatusStub.callsArgWith(3, null, smapiImportStatusResponse200EmptyResources);

        // call
        skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
          // verify
          expect(err).equal(null);
          expect(res).deep.equal(smapiImportStatusResponse200EmptyResources);
          expect(requestStub.callCount).equals(2);
          done();
        });
      }).timeout(20000);
    });
  });

  describe("# test class method: _pollExportStatus", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
    });

    it("| poll status with getExportStatus fails, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, "pollErr"); // stub smapi request
      // call
      skillMetaController._pollExportStatus(TEST_EXPORT_ID, (err, res) => {
        // verify
        expect(res).equal(null);
        expect(err).equal("pollErr");
        done();
      });
    });

    it("| poll status with getExportStatus return error response, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, null, {
        statusCode: 403,
        body: {
          error: "message",
        },
      }); // stub smapi request
      // call
      skillMetaController._pollExportStatus(TEST_EXPORT_ID, (err, res) => {
        // verify
        expect(res).equal(null);
        expect(err).equal(jsonView.toString({error: "message"}));
        done();
      });
    });

    it("| poll status with getExportStatus return success, expect callback with getExportStatus response", (done) => {
      // setup
      const response = {
        statusCode: 200,
        body: {
          status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED,
        },
        headers: {},
      };
      sinon.stub(httpClient, "request").callsArgWith(3, null, response); // stub smapi request
      // call
      skillMetaController._pollExportStatus(TEST_EXPORT_ID, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).deep.equal(response);
        done();
      });
    });
  });

  describe("# test class method: updateSkillManifest", () => {
    let skillMetaController;

    beforeEach(() => {
      skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
      ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, null);
    });

    it("| smapi update manifest fails, expect callback error", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, "smapiError");

      // call
      skillMetaController.updateSkillManifest((err, res) => {
        // verify
        expect(res).equal(undefined);
        expect(err).equal("smapiError");
        done();
      });
    });

    it("| update manifest callback with error when poll skill status fails", (done) => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, null, {});
      sinon.stub(SkillMetadataController.prototype, "_pollSkillManifestStatus").callsArgWith(1, "TEST_ERROR");

      // call
      skillMetaController.updateSkillManifest((err, res) => {
        // verify
        expect(err).equal("TEST_ERROR");
        done();
      });
    });

    it("| update manifest callsback with error when poll status is failed", (done) => {
      // setup
      const pollResponse = {
        body: {
          manifest: {
            lastUpdateRequest: {
              status: "FAILED",
            },
          },
        },
      };

      sinon.stub(SkillMetadataController.prototype, "_pollSkillManifestStatus").callsArgWith(1, undefined, pollResponse);
      sinon.stub(httpClient, "request").callsArgWith(3, null, {});

      // call
      skillMetaController.updateSkillManifest((err, res) => {
        // verify
        expect(err).equal("[Error]: Updating skill manifest but received non-success message from SMAPI: FAILED");
        done();
      });
    });

    it("| update manifest calls back when poll skill status succeeds", (done) => {
      // setup
      const pollResponse = {
        body: {
          manifest: {
            lastUpdateRequest: {
              status: CONSTANTS.SKILL.SKILL_STATUS.SUCCEEDED,
            },
          },
        },
      };

      sinon.stub(SkillMetadataController.prototype, "_pollSkillManifestStatus").callsArgWith(1, undefined, pollResponse);
      sinon.stub(httpClient, "request").callsArgWith(3, null, {});

      // call
      skillMetaController.updateSkillManifest((err, res) => {
        // verify
        expect(err).equal(undefined);
        done();
      });
    });
  });
});
