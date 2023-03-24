import {expect} from "chai";
import sinon from "sinon";
import AddLocalesCommand from "../../../../../lib/commands/skill/add-locales";
import helper from "../../../../../lib/commands/skill/add-locales/helper";
import optionModel from "../../../../../lib/commands/option-model.json";
import ui from "../../../../../lib/commands/skill/add-locales/ui";
import profileHelper from "../../../../../lib/utils/profile-helper";
import Messenger from "../../../../../lib/view/messenger";
import {OptionModel} from "../../../../../lib/commands/option-validator";

describe("Commands add-locales test - command class test", () => {
  const TEST_DEBUG = false;

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
    const instance = new AddLocalesCommand(optionModel as OptionModel);
    expect(instance.name()).equal("add-locales");
    expect(instance.description()).equal("add new locale(s) from existing locale or from the template");
    expect(instance.requiredOptions()).deep.equal([]);
    expect(instance.optionalOptions()).deep.equal(["profile", "debug"]);
  });

  describe("validate command handle", () => {
    const TEST_ERROR = Error("command error");
    const TEST_PROFILE = "profile";
    const TEST_LOCALES_LIST = ["1", "2", "3"];
    const TEST_LOCALES_SOURCE_MAP = new Map([
      ["1", "file1"],
      ["2", "file2"],
      ["3", "file3"],
    ]);
    let instance: AddLocalesCommand;

    beforeEach(() => {
      instance = new AddLocalesCommand(optionModel as OptionModel);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| profile fails to get the runtime profile, expect error message error out", async () => {
      // setup
      const TEST_CMD = {
        debug: TEST_DEBUG,
      };
      sinon.stub(profileHelper, "runtimeProfile").throws(TEST_ERROR);
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      // verify
      expect(errorStub).calledWith(TEST_ERROR);
      expect(infoStub).not.called;
      expect(warnStub).not.called;
    });

    it("| helper fails to initiate proj models, expect error message error out", async () => {
      // setup
      const TEST_CMD = {
        debug: TEST_DEBUG,
      };
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      sinon.stub(helper, "initiateModels").throws(TEST_ERROR);
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      // verify
      expect(errorStub).calledWith(TEST_ERROR);
      expect(infoStub).not.called;
      expect(warnStub).not.called;
    });

    it("| select locales fails with error, expect error message error out", async () => {
      // setup
      const TEST_CMD = {
        debug: TEST_DEBUG,
      };
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      sinon.stub(helper, "initiateModels").returns(null as any);
      sinon.stub(ui, "selectLocales").callsArgWith(1, TEST_ERROR);
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      // verify
      expect(errorStub).calledWith(TEST_ERROR);
      expect(infoStub).not.called;
      expect(warnStub).not.called;
    });

    it("| add locales fails with error, expect error message error out", async () => {
      // setup
      const TEST_CMD = {
        debug: TEST_DEBUG,
      };
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      sinon.stub(helper, "initiateModels").returns(null as any);
      sinon.stub(ui, "selectLocales").callsArgWith(1, undefined, TEST_LOCALES_LIST);
      sinon.stub(helper, "addLocales").callsArgWith(3, TEST_ERROR);
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      // verify
      expect(errorStub).calledWith(TEST_ERROR);
      expect(infoStub).not.called;
      expect(warnStub).not.called;
    });

    it("| cmd executes without error, expect callback without error", async () => {
      // setup
      const TEST_CMD = {
        debug: TEST_DEBUG,
      };
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      sinon.stub(helper, "initiateModels").returns(null as any);
      sinon.stub(ui, "selectLocales").callsArgWith(1, undefined, TEST_LOCALES_LIST);
      sinon.stub(helper, "addLocales").callsArgWith(3, undefined, TEST_LOCALES_SOURCE_MAP);
      sinon.stub(ui, "displayAddLocalesResult").returns(null as any);
      // call
      await expect(instance.handle(TEST_CMD)).not.rejected;
      // verify
      expect(errorStub).not.called;
      expect(infoStub).not.called;
      expect(warnStub).not.called;
    });
  });
});
