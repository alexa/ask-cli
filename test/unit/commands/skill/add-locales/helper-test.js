const {expect} = require("chai");
const sinon = require("sinon");
const fs = require("fs-extra");
const path = require("path");

const httpClient = require("../../../../../lib/clients/http-client");
const SkillMetadataController = require("../../../../../lib/controllers/skill-metadata-controller");
const helper = require("../../../../../lib/commands/skill/add-locales/helper");
const Manifest = require("../../../../../lib/model/manifest");
const ResourcesConfig = require("../../../../../lib/model/resources-config");
const stringUtils = require("../../../../../lib/utils/string-utils");

describe("Commands add-locales - helper test", () => {
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
  const TEST_PROFILE = "profile";
  const TEST_DEBUG = false;

  describe("# unit test for method initiateModels", () => {
    beforeEach(() => {
      sinon.stub(path, "join").onFirstCall().returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH).onSecondCall().returns(FIXTURE_MANIFEST_FILE_PATH);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| skill package source is not set, expect throw error", () => {
      // setup
      sinon.stub(stringUtils, "isNonBlankString").returns(false);
      // call & verify
      expect(() => helper.initiateModels(TEST_PROFILE)).to.throw("Skill package src is not found in ask-resources.json.");
    });

    it("| skill package source does not exist, expect throw error", () => {
      // setup
      sinon.stub(stringUtils, "isNonBlankString").returns(true);
      sinon.stub(fs, "existsSync").returns(false);
      // call & verify
      expect(() => helper.initiateModels(TEST_PROFILE)).to.throw(/The skillMetadata src file/);
    });

    it("| project model intiated successfully", () => {
      // setup
      sinon.stub(stringUtils, "isNonBlankString").returns(true);
      sinon.stub(fs, "existsSync").returns(true);
      // call
      expect(() => helper.initiateModels(TEST_PROFILE)).not.to.throw();
    });
  });

  describe("# unit test for method addLocales", () => {
    const TEST_ERROR = "error";
    const TEST_MODEL_PATH = "filepath";
    const TEST_SKILL_META_SRC = "skillmetasrc";
    const TEST_PATH = "pathdoesnotmatter";
    const TEST_TEMPLATE_BODY = {body: "template"};
    const TEST_TEMPLATE_MAP = {
      statusCode: 200,
      body: {
        INTERACTION_MODEL_BY_LANGUAGE: {
          es: "TEST_ES_URL",
          en: "TEST_EN_URL",
        },
      },
    };
    new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
    new Manifest(FIXTURE_MANIFEST_FILE_PATH);

    beforeEach(() => {
      sinon.stub(path, "join").returns(TEST_PATH);
      sinon.stub(httpClient, "request");
      sinon.stub(SkillMetadataController.prototype, "getInteractionModelLocales");
      sinon.stub(ResourcesConfig.prototype, "getSkillMetaSrc").returns(TEST_SKILL_META_SRC);
      sinon.stub(fs, "existsSync");
      sinon.stub(fs, "copySync");
      sinon.stub(fs, "writeFileSync");
      sinon.stub(Manifest.prototype, "write");
      sinon.stub(Manifest.prototype, "getPublishingLocale").returns({dummy: "dummy"});
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| fail to get the template map with http error", (done) => {
      // setup
      httpClient.request.onFirstCall().callsArgWith(3, TEST_ERROR);
      // call
      helper.addLocales(["en-US"], TEST_PROFILE, TEST_DEBUG, (err, result) => {
        expect(err).equal("Failed to retrieve the interaction model map template list.\nError: \"error\"");
        expect(result).equal(undefined);
        done();
      });
    });

    it("| fail to get the template map with statusCode not correct", (done) => {
      // setup
      httpClient.request.onFirstCall().callsArgWith(3, {statusCode: 401});
      // call
      helper.addLocales(["en-US"], TEST_PROFILE, TEST_DEBUG, (err, result) => {
        expect(err).equal(`Failed to retrieve the interaction model map template list.\nError: ${JSON.stringify({statusCode: 401}, null, 2)}`);
        expect(result).equal(undefined);
        done();
      });
    });

    it("| selected locale is same as local file", (done) => {
      // setup
      httpClient.request.onFirstCall().callsArgWith(3, undefined, TEST_TEMPLATE_MAP);
      SkillMetadataController.prototype.getInteractionModelLocales.returns({"en-US": TEST_MODEL_PATH});
      // call
      helper.addLocales(["en-US"], TEST_PROFILE, TEST_DEBUG, (err, result) => {
        expect(err).equal(undefined);
        expect(result.size).equal(0);
        done();
      });
    });

    it("| selected locale has same language as the local file", (done) => {
      // setup
      httpClient.request.onFirstCall().callsArgWith(3, undefined, TEST_TEMPLATE_MAP);
      SkillMetadataController.prototype.getInteractionModelLocales.returns({"en-XX": TEST_MODEL_PATH});
      fs.existsSync.returns(true);
      // call
      helper.addLocales(["en-US"], TEST_PROFILE, TEST_DEBUG, (err, result) => {
        expect(fs.copySync.args[0][0]).equal(TEST_MODEL_PATH);
        expect(err).equal(undefined);
        expect(result.size).equal(1);
        expect(result.get("en-US")).deep.equal({uri: TEST_MODEL_PATH, canCopy: true});
        done();
      });
    });

    it("| interaction model for the selected locale can only be provided by official template, http fails", (done) => {
      // setup
      httpClient.request.onFirstCall().callsArgWith(3, undefined, TEST_TEMPLATE_MAP);
      SkillMetadataController.prototype.getInteractionModelLocales.returns({"es-US": TEST_MODEL_PATH});
      fs.existsSync.returns(false);
      httpClient.request.onSecondCall().callsArgWith(3, TEST_ERROR);
      // call
      helper.addLocales(["en-US"], TEST_PROFILE, TEST_DEBUG, (err, result) => {
        expect(err).equal(`Failed to retrieve the template list.\n${TEST_ERROR}`);
        expect(result).equal(undefined);
        done();
      });
    });

    it("| interaction model for the selected locale can only be provided by official template, http returns with 4xx", (done) => {
      // setup
      httpClient.request.onFirstCall().callsArgWith(3, undefined, TEST_TEMPLATE_MAP);
      SkillMetadataController.prototype.getInteractionModelLocales.returns({"es-US": TEST_MODEL_PATH});
      fs.existsSync.returns(false);
      httpClient.request.onSecondCall().callsArgWith(3, {statusCode: 401}, null);
      // call
      helper.addLocales(["en-US"], TEST_PROFILE, TEST_DEBUG, (err, result) => {
        expect(err).equal(`Failed to retrieve the template list, please see the details from the error response.
{
  "statusCode": 401
}`);
        expect(result).equal(undefined);
        done();
      });
    });

    it("| interaction model for the selected locale can only be provided by official template, http request passes", (done) => {
      // setup
      httpClient.request.onFirstCall().callsArgWith(3, undefined, TEST_TEMPLATE_MAP);
      SkillMetadataController.prototype.getInteractionModelLocales.returns({"es-US": TEST_MODEL_PATH});
      fs.existsSync.returns(false);
      httpClient.request.onSecondCall().callsArgWith(3, null, TEST_TEMPLATE_BODY);
      // call
      helper.addLocales(["en-US"], TEST_PROFILE, TEST_DEBUG, (err, result) => {
        expect(fs.writeFileSync.args[0][1]).equal(TEST_TEMPLATE_BODY.body);
        expect(result.size).equal(1);
        expect(result.get("en-US")).deep.equal({uri: "TEST_EN_URL", canCopy: false});
        expect(err).equal(undefined);
        done();
      });
    });
  });
});
