import {expect} from "chai";
import sinon from "sinon";
import path from "path";
import fs from "fs-extra";
import jsonfile from "jsonfile";
import ConfigureCommand from "../../../../lib/commands/configure";
import helper from "../../../../lib/commands/configure/helper";
import messages from "../../../../lib/commands/configure/messages";
import ui from "../../../../lib/commands/configure/ui";
import optionModel from "../../../../lib/commands/option-model.json";
import AppConfig from "../../../../lib/model/app-config";
import stringUtils from "../../../../lib/utils/string-utils";
import Messenger from "../../../../lib/view/messenger";
import {OptionModel} from "../../../../lib/commands/option-validator";

describe("Commands Configure test - command class test", () => {
  const TEST_APP_CONFIG_FILE_PATH = path.join(process.cwd(), "test", "unit", "fixture", "model", "cli_config");
  const TEST_PROFILE = "default";
  const TEST_CMD = {
    profile: TEST_PROFILE,
  };
  const TEST_INVALID_PROFILE = "&@%$&%@$^";
  const TEST_ERROR_MESSAGE = "error";
  const TEST_AWS_PROFILE = "awsProfile";
  const TEST_VENDOR_ID = "vendorId";
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
    const instance = new ConfigureCommand(optionModel as OptionModel);
    expect(instance.name()).eq("configure");
    expect(instance.description()).eq(
      "helps to configure the credentials that ask-cli uses to authenticate the user to Amazon developer services",
    );
    expect(instance.requiredOptions()).deep.eq([]);
    expect(instance.optionalOptions()).deep.eq(["no-browser", "profile", "debug"]);
  });

  describe("validate command handle - ensure AppConfig initiated", () => {
    let instance: ConfigureCommand;
    const INVALID_FILE_PATH = "/invalid/path";

    beforeEach(() => {
      instance = new ConfigureCommand(optionModel as OptionModel);
    });

    afterEach(() => {
      sinon.restore();
      AppConfig.dispose();
    });

    it("| AppConfig creation, expect throw error", async () => {
      // setup
      sinon.stub(path, "join").returns(INVALID_FILE_PATH);
      sinon.stub(fs, "existsSync").returns(true);

      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(`No access to read/write file ${INVALID_FILE_PATH}.`);

      // verify
      expect(infoStub).calledOnceWith(messages.ASK_CLI_CONFIGURATION_MESSAGE);
    });

    it("| returns error, invalid profile entered by user", async () => {
      // setup
      sinon.stub(path, "join").returns(TEST_APP_CONFIG_FILE_PATH);
      const existsSyncStub = sinon.stub(fs, "existsSync");
      existsSyncStub.onCall(0).returns(false);
      existsSyncStub.onCall(1).returns(true);
      sinon.stub(fs, "ensureDirSync");
      sinon.stub(jsonfile, "writeFileSync");
      sinon.stub(stringUtils, "validateSyntax").returns(false);
      const getProfileListStub = sinon.stub().returns([]);
      sinon.stub(AppConfig, "getInstance").returns({
        getProfilesList: getProfileListStub,
      });

      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(messages.PROFILE_NAME_VALIDATION_ERROR);

      // verify
      expect(infoStub).calledOnceWith(messages.ASK_CLI_CONFIGURATION_MESSAGE);
      expect(fs.ensureDirSync).calledOnce;
      expect(jsonfile.writeFileSync).calledOnce;
    });

    describe("# existing profiles", () => {
      beforeEach(() => {
        instance = new ConfigureCommand(optionModel as OptionModel);
        sinon.stub(path, "join").returns(TEST_APP_CONFIG_FILE_PATH);
        const existsSyncStub = sinon.stub(fs, "existsSync");
        existsSyncStub.onCall(0).returns(false);
        existsSyncStub.onCall(1).returns(true);
        sinon.stub(fs, "ensureDirSync");
        sinon.stub(jsonfile, "writeFileSync");
        const getProfileListStub = sinon.stub().returns([TEST_INVALID_PROFILE]);
        const getAwsProfileStub = sinon.stub().returns(TEST_AWS_PROFILE);
        const getVendorIdStub = sinon.stub().returns(TEST_VENDOR_ID);
        sinon.stub(AppConfig, "getInstance").returns({
          getProfilesList: getProfileListStub,
          getAwsProfile: getAwsProfileStub,
          getVendorId: getVendorIdStub,
        });
      });

      it("| returns error, existing profiles but user enters invalid profile name", async () => {
        // setup
        sinon.stub(stringUtils, "validateSyntax").returns(false);

        // call
        await expect(instance.handle({profile: TEST_INVALID_PROFILE})).rejectedWith(messages.PROFILE_NAME_VALIDATION_ERROR);

        // verify
        expect(infoStub).calledOnceWith(messages.ASK_CLI_CONFIGURATION_MESSAGE);
        expect(fs.ensureDirSync).calledOnce;
        expect(jsonfile.writeFileSync).calledOnce;
      });

      it("| returns error, existing profiles and valid profile name, setup fails", async () => {
        // setup
        sinon.stub(stringUtils, "validateSyntax").returns(true);
        sinon.stub(helper, "initiateAskProfileSetup").callsArgWith(1, TEST_ERROR_MESSAGE);

        // call
        await expect(instance.handle({profile: TEST_INVALID_PROFILE})).rejectedWith(TEST_ERROR_MESSAGE);

        // verify
        expect(infoStub).calledOnceWith(messages.ASK_CLI_CONFIGURATION_MESSAGE);
        expect(fs.ensureDirSync).calledOnce;
        expect(jsonfile.writeFileSync).calledOnce;
      });

      it("| returns error, existing profiles and invalid profile name, ask for creation of new profile fails", async () => {
        // setup
        sinon.stub(stringUtils, "validateSyntax").returns(true);
        sinon.stub(ui, "createOrUpdateProfile").callsArgWith(1, TEST_ERROR_MESSAGE);

        // call
        await expect(instance.handle({})).rejectedWith(TEST_ERROR_MESSAGE);

        // verify
        expect(infoStub).calledOnceWith(messages.ASK_CLI_CONFIGURATION_MESSAGE);
        expect(fs.ensureDirSync).calledOnce;
        expect(jsonfile.writeFileSync).calledOnce;
      });

      it("| returns error, existing profiles and invalid profile name, setup fails", async () => {
        // setup
        sinon.stub(stringUtils, "validateSyntax").returns(true);
        sinon.stub(ui, "createOrUpdateProfile").callsArgWith(1, null, TEST_PROFILE);
        sinon.stub(helper, "initiateAskProfileSetup").callsArgWith(1, TEST_ERROR_MESSAGE);

        // call
        await expect(instance.handle({profile: TEST_INVALID_PROFILE})).rejectedWith(TEST_ERROR_MESSAGE);

        // verify
        expect(infoStub).calledOnceWith(messages.ASK_CLI_CONFIGURATION_MESSAGE);
        expect(fs.ensureDirSync).calledOnce;
        expect(jsonfile.writeFileSync).calledOnce;
      });

      it("| successfully configured profiles", async () => {
        // setup
        sinon.stub(stringUtils, "validateSyntax").returns(true);
        sinon.stub(ui, "createOrUpdateProfile").callsArgWith(1, null, TEST_PROFILE);
        sinon.stub(helper, "initiateAskProfileSetup").callsArgWith(1, null, TEST_PROFILE);

        // call
        await instance.handle({profile: TEST_INVALID_PROFILE});

        // verify
        expect(infoStub.getCall(0).args[0]).equal(messages.ASK_CLI_CONFIGURATION_MESSAGE);
        expect(infoStub.getCall(1).args[0]).equal(messages.CONFIGURE_SETUP_SUCCESS_MESSAGE);
        expect(infoStub.getCall(2).args[0]).equal(`ASK Profile: ${TEST_PROFILE}`);
        expect(infoStub.getCall(3).args[0]).equal(`AWS Profile: ${TEST_AWS_PROFILE}`);
        expect(infoStub.getCall(4).args[0]).equal(`Vendor ID: ${TEST_VENDOR_ID}`);
        expect(fs.ensureDirSync).calledOnce;
        expect(jsonfile.writeFileSync).calledOnce;
      });
    });
  });
});
