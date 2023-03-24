const {expect} = require("chai");
const inquirer = require("inquirer");
const sinon = require("sinon");

const Messenger = require("../../../../../lib/view/messenger");
const acUtils = require("../../../../../lib/utils/ac-util");
const ui = require("../../../../../lib/commands/skill/add-locales/ui");

function validateInquirerConfig(stub, expectedConfig) {
  const {message, type, choices} = expectedConfig;
  expect(stub.message).equal(message);
  expect(stub.type).equal(type);
  if (choices) {
    expect(stub.choices).deep.equal(choices);
  }
}

describe("Commands add-locales - UI test", () => {
  describe("# validate method selectLocales", () => {
    const TEST_LOCALES = ["1", "2", "3"];
    const TEST_SELECTED_LOCALES = ["1"];
    const TEST_ERROR = "error";

    beforeEach(() => {
      sinon.stub(inquirer, "prompt");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| select locales with error throw, expect error called back", (done) => {
      // setup
      inquirer.prompt.rejects(TEST_ERROR);
      // call
      ui.selectLocales(TEST_LOCALES, (err, results) => {
        // verify
        validateInquirerConfig(inquirer.prompt.args[0][0][0], {
          message: "Please select at least one locale to add:",
          type: "checkbox",
          choices: TEST_LOCALES,
        });
        expect(results).equal(undefined);
        expect(err.name).equal(TEST_ERROR);
        done();
      });
    });

    it("| select locales successfully, expect result list called back", (done) => {
      // setup
      inquirer.prompt.resolves({localeList: TEST_SELECTED_LOCALES});
      // call
      ui.selectLocales(TEST_LOCALES, (err, results) => {
        // verify
        expect(err).equal(null);
        expect(results).deep.equal(TEST_SELECTED_LOCALES);
        done();
      });
    });
  });

  describe("# validate method displayAddLocalesResult", () => {
    new Messenger({});
    let infoStub;
    const TEST_PROFILE = "profile1";
    let isACSkillStub;

    beforeEach(() => {
      infoStub = sinon.stub();
      sinon.stub(Messenger, "getInstance").returns({
        info: infoStub,
      });
      isACSkillStub = sinon.stub(acUtils, "isAcSkill");
      isACSkillStub.returns(false);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| display info message when all locales exist", () => {
      // setup
      const TEST_MAP = new Map();
      const TEST_LIST = ["1", "2", "3"];
      // call
      ui.displayAddLocalesResult(TEST_LIST, TEST_MAP, TEST_PROFILE);
      // verify
      expect(infoStub.args[0][0]).equal("Locale 1.json already exists");
      expect(infoStub.args[1][0]).equal("Locale 2.json already exists");
      expect(infoStub.args[2][0]).equal("Locale 3.json already exists");
    });

    it("| display info message when all selected locales are added for IM skill", () => {
      // setup
      const TEST_MAP = new Map([
        ["1", {uri: "file1.json", canCopy: true}],
        ["2", {uri: "file2.json", canCopy: false}],
      ]);
      const TEST_LIST = ["1", "2", "3"];
      // call
      ui.displayAddLocalesResult(TEST_LIST, TEST_MAP, TEST_PROFILE);
      // verify
      expect(infoStub.args[0][0]).equal("Locale 3.json already exists");
      expect(infoStub.args[1][0]).equal("");
      expect(infoStub.args[2][0]).equal("The following skill locale(s) have been added according to your local project:");
      expect(infoStub.args[3][0]).equal("  Added locale 1.json from file1's interactionModel");
      expect(infoStub.args[4][0]).equal("  Added locale 2.json from the template of interactionModel");
      expect(infoStub.args[5][0]).equal('Please check the added files above, and run "ask deploy" to deploy the changes.');
    });


    it("| display info message when all selected locales are added for AC skill", () => {
      // setup
      const TEST_MAP = new Map([
        ["1", {uri: "file1.json", canCopy: true}],
        ["2", {uri: "file2.json", canCopy: false}],
      ]);
      const TEST_LIST = ["1", "2", "3"];
      isACSkillStub.returns(false);
      // call
      ui.displayAddLocalesResult(TEST_LIST, TEST_MAP, TEST_PROFILE);
      // verify
      expect(infoStub.args[0][0]).equal("Locale 3.json already exists");
      expect(infoStub.args[1][0]).equal("");
      expect(infoStub.args[2][0]).equal("The following skill locale(s) have been added according to your local project:");
      expect(infoStub.args[3][0]).equal("  Added locale 1.json from file1's interactionModel");
      expect(infoStub.args[4][0]).equal("  Added locale 2.json from the template of interactionModel");
      expect(infoStub.args[5][0]).equal('Please check the added files above, and run "ask deploy" to deploy the changes.');
    });
  });
});
