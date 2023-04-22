import {expect} from "chai";
import sinon from "sinon";
import path from "path";

import AuthorizationController from "../../../../lib/controllers/authorization-controller";
import {DialogCommand} from "../../../../lib/commands/dialog";
import DialogReplayFile from "../../../../lib/model/dialog-replay-file";
import * as helper from "../../../../lib/commands/dialog/helper";
import * as httpClient from "../../../../lib/clients/http-client";
import {InteractiveMode} from "../../../../lib/commands/dialog/interactive-mode";
import ResourcesConfig from "../../../../lib/model/resources-config";
import CONSTANTS from "../../../../lib/utils/constants";
import profileHelper from "../../../../lib/utils/profile-helper";
import stringUtils from "../../../../lib/utils/string-utils";
import Messenger from "../../../../lib/view/messenger";
import SpinnerView from "../../../../lib/view/spinner-view";
import * as optionModel from "../../../../lib/commands/option-model.json";
import {OptionModel} from "../../../../lib/commands/option-validator";
import {SmapiClientLateBound} from "../../../../lib/clients/smapi-client";
import {v1} from "ask-smapi-model";

describe("Commands Dialog test - command class test", () => {
  const TEST_ERROR = "error";
  const DIALOG_FIXTURE_PATH = path.join(process.cwd(), "test", "unit", "fixture", "model", "dialog");
  const RESOURCE_CONFIG_FIXTURE_PATH = path.join(process.cwd(), "test", "unit", "fixture", "model", "regular-proj");
  const DIALOG_REPLAY_FILE_JSON_PATH = path.join(DIALOG_FIXTURE_PATH, "dialog-replay-file.json");
  const INVALID_DIALOG_REPLAY_FILE_JSON_PATH = path.join(DIALOG_FIXTURE_PATH, "invalid-dialog-replay-file.json");
  const INVALID_RESOURCES_CONFIG_JSON_PATH = path.join(RESOURCE_CONFIG_FIXTURE_PATH, "random-json-config.json");
  const VALID_RESOURCES_CONFIG_JSON_PATH = path.join(RESOURCE_CONFIG_FIXTURE_PATH, "ask-resources.json");
  const VALID_MANIFEST_JSON_PATH = path.join(process.cwd(), "test", "unit", "fixture", "model", "manifest.json");
  const TEST_PROFILE = "default";
  const TEST_CMD = {
    profile: TEST_PROFILE,
  };

  let errorStub: sinon.SinonStub;
  let infoStub: sinon.SinonStub;
  let httpClientStub: sinon.SinonStub;
  beforeEach(() => {
    errorStub = sinon.stub();
    infoStub = sinon.stub();
    httpClientStub = sinon.stub(httpClient, "request");
    sinon.stub(Messenger, "getInstance").returns({
      error: errorStub,
      info: infoStub,
    });
    sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1, null, "accesstoken");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("| validate command information is set correctly", () => {
    const instance = new DialogCommand(new SmapiClientLateBound(), optionModel as OptionModel);
    expect(instance.name()).eq("dialog");
    expect(instance.description()).eq("simulate your skill via an interactive dialog with Alexa");
    expect(instance.requiredOptions()).deep.eq([]);
    expect(instance.optionalOptions()).deep.eq([
      "skill-id",
      "locale",
      "stage",
      "replay",
      "save-skill-io",
      "profile",
      "debug",
    ]);
  });

  describe("# validate command handle", () => {
    let instance: DialogCommand;
    let spinnerStartStub: sinon.SinonStub;
    let spinnerTerminateStub: sinon.SinonStub;

    beforeEach(() => {
      spinnerStartStub = sinon.stub(SpinnerView.prototype, "start");
      spinnerTerminateStub = sinon.stub(SpinnerView.prototype, "terminate");
      instance = new DialogCommand(new SmapiClientLateBound(), optionModel as OptionModel);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| error while creating dialogMode", async () => {
      // setup
      sinon.stub(DialogCommand.prototype, "_getDialogConfig").rejects(new Error(TEST_ERROR));

      // call
      await expect(instance.handle(TEST_CMD)).eventually.rejected.property("message", TEST_ERROR);

      // verify
      expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
    });

    it("| error while validating dialog arguments", async () => {
      // setup
      sinon.stub(DialogCommand.prototype, "_getDialogConfig").resolves();
      sinon.stub(DialogCommand.prototype, "_dialogModeFactory");
      sinon.stub(helper, "validateDialogArgs").rejects(Error(TEST_ERROR));
      // call
      await expect(instance.handle(TEST_CMD)).eventually.rejected.property("message", TEST_ERROR);

      // verify
      expect(spinnerStartStub).calledOnceWith("Checking if skill is ready to simulate...");
      expect(spinnerTerminateStub).calledOnceWith(SpinnerView.TERMINATE_STYLE.FAIL, "Failed to validate command options");
      expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
    });

    it("| dialogMode returns error", async () => {
      // setup
      sinon.stub(DialogCommand.prototype, "_getDialogConfig").resolves({} as any);
      sinon.stub(InteractiveMode.prototype, "start").rejects(Error(TEST_ERROR));
      sinon.stub(helper, "validateDialogArgs").resolves();
      // call
      await expect(instance.handle(TEST_CMD)).eventually.rejected.property("message", TEST_ERROR);

      // verify
      expect(spinnerStartStub).calledOnceWith("Checking if skill is ready to simulate...");
      expect(spinnerTerminateStub).calledOnce;
      expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR}));
    });

    it("| dialog command successfully completes execution", async () => {
      // setup
      sinon.stub(DialogCommand.prototype, "_getDialogConfig").resolves({} as any);
      sinon.stub(InteractiveMode.prototype, "start").resolves();
      sinon.stub(helper, "validateDialogArgs").resolves();
      // call
      await instance.handle(TEST_CMD);

      // verify
      expect(spinnerStartStub).calledOnceWith("Checking if skill is ready to simulate...");
      expect(spinnerTerminateStub).calledOnce;
    });
  });

  describe("# test _getDialogConfig", () => {
    let instance: DialogCommand;
    let manifest: v1.skill.Manifest.SkillManifest;

    beforeEach(() => {
      instance = new DialogCommand(new SmapiClientLateBound(), optionModel as OptionModel);
      manifest = {publishingInformation: {locales: {us: { name: 'test'}}}};
    });

    describe("# test with replay option", () => {
      it("| empty skillId throws error", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {
          stage: "development",
          replay: INVALID_DIALOG_REPLAY_FILE_JSON_PATH,
        };
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        httpClientStub.yields(null, {statusCode: 200, body: {manifest}});
        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).rejectedWith("Replay file must contain skillId");
      });

      it("| dialog command uses skillId passed in as argument", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {
          profile: TEST_PROFILE,
          skillId: "foo",
        };
        const validateDialogArgsStub = sinon.stub(helper, "validateDialogArgs").resolves();
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(InteractiveMode.prototype, "start").resolves();
        httpClientStub.yields(null, {statusCode: 200, body: {manifest}});
        // call
        await instance.handle(TEST_CMD_WITH_VALUES);
        expect(validateDialogArgsStub).calledOnceWith(sinon.match({
          profile: TEST_PROFILE,
          skillId: "foo",
        }));
      });

      it("| empty locale throws error", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {
          stage: "",
          replay: INVALID_DIALOG_REPLAY_FILE_JSON_PATH,
        };
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        httpClientStub.yields(null, {statusCode: 200, body: {manifest}});
        const stringUtilsStub = sinon.stub(stringUtils, "isNonBlankString");
        stringUtilsStub.onCall(0).returns(true);
        stringUtilsStub.onCall(1).returns(false);
        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).rejectedWith("Replay file must contain locale");
      });

      it("| invalid user inputs throws error", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {
          stage: "",
          replay: INVALID_DIALOG_REPLAY_FILE_JSON_PATH,
        };
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        httpClientStub.yields(null, {statusCode: 200, body: {manifest}});
        const stringUtilsStub = sinon.stub(stringUtils, "isNonBlankString");
        stringUtilsStub.onCall(0).returns(true);
        stringUtilsStub.onCall(1).returns(true);
        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).rejectedWith("Replay file's userInput cannot contain empty string.");
      });

      it("| returns valid config", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {
          stage: "",
          replay: DIALOG_REPLAY_FILE_JSON_PATH,
        };
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        httpClientStub.yields(null, {statusCode: 200, body: {manifest}});
        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).eventually.fulfilled.deep.include({
          debug: undefined,
          locale: "en-US",
          profile: "default",
          replay: DIALOG_REPLAY_FILE_JSON_PATH,
          skillId: "amzn1.ask.skill.1234567890",
          stage: "development",
          userInputs: ["hello", "world"],
        });
      });

      it("| returns error when initialization of DialogReplayFile fails", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {
          stage: "",
          replay: DIALOG_REPLAY_FILE_JSON_PATH,
        };
        const error = "error";
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(DialogReplayFile.prototype, "readFileContent").throws(new Error(error));
        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).rejectedWith(error);
      });

      it("| returns return error when smapi get manifest call fails", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {
          stage: "",
          replay: DIALOG_REPLAY_FILE_JSON_PATH,
        };
        const smapiError = "error";
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        httpClientStub.yields(smapiError);
        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).rejectedWith(smapiError);
      });

      it("| returns return error when smapi get manifest call returns failure http status code", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {
          stage: "",
          replay: DIALOG_REPLAY_FILE_JSON_PATH,
        };
        const smapiError = "error";
        const mockedResponse = {
          statusCode: 400,
          headers: [],
          body: {
              message: smapiError
          }
        };
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        httpClientStub.yields(mockedResponse);
        // call
        await instance._getDialogConfig(TEST_CMD_WITH_VALUES).catch((error) => {
          expect(error).to.deep.equal(mockedResponse);
        });
      });
    });

    describe("# test with default (interactive) option", () => {

      afterEach(() => {
        delete process.env.ASK_DEFAULT_DEVICE_LOCALE;
      });

      it("| no resources config file found", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {};
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(path, "join").returns(INVALID_RESOURCES_CONFIG_JSON_PATH);
        sinon.stub(ResourcesConfig.prototype, "getSkillId").throws(new Error());
        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).rejectedWith(
          "Failed to read project resource file. Please run the command within a ask-cli project.",
        );
      });

      it("| unable to fetch skillId from resources config file", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {};
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(path, "join").returns(INVALID_RESOURCES_CONFIG_JSON_PATH);
        // call
        const expectedFilePath = path.join(
          process.cwd(),
          CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER,
          CONSTANTS.FILE_PATH.ASK_STATES_JSON_CONFIG,
        );
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).rejectedWith(
          `Failed to obtain skill-id from project file ${expectedFilePath}`,
        );
      });

      it("| check valid values are returned in interactive mode", async () => {
        // setup
        const TEST_CMD_WITH_VALUES = {};
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        httpClientStub.yields(null, {statusCode: 200, body: {manifest}});
        const pathJoinStub = sinon.stub(path, "join");
        pathJoinStub.withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG).returns(VALID_RESOURCES_CONFIG_JSON_PATH);
        pathJoinStub.withArgs("./skillPackage", CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST).returns(VALID_MANIFEST_JSON_PATH);
        pathJoinStub.callThrough();
        process.env.ASK_DEFAULT_DEVICE_LOCALE = "en-US";
        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).eventually.fulfilled.include({
          debug: undefined,
          locale: "en-US",
          profile: "default",
          replay: undefined,
          skillId: "amzn1.ask.skill.1234567890",
          stage: "development",
          userInputs: undefined,
        });
      });

      it("| check locale defaults to first value from manifest", async () => {
        // setup
        const [expectedLocale] = Object.keys(manifest.publishingInformation?.locales || {});
        const TEST_CMD_WITH_VALUES = {};
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        httpClientStub.yields(null, {statusCode: 200, body: {manifest}});
        const pathJoinStub = sinon.stub(path, "join");
        pathJoinStub.withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG).returns(VALID_RESOURCES_CONFIG_JSON_PATH);
        pathJoinStub.callThrough();

        // call
        await expect(instance._getDialogConfig(TEST_CMD_WITH_VALUES)).eventually.fulfilled.include({
          debug: undefined,
          locale: expectedLocale,
          profile: "default",
          replay: undefined,
          skillId: "amzn1.ask.skill.1234567890",
          stage: "development",
          userInputs: undefined,
        });

        expect(infoStub).calledOnceWith(`Defaulting locale to the first value from the skill manifest: ${expectedLocale}`);
      });
    });

  });

  describe("# test _validateUserInputs", () => {
    it("| all valid inputs", () => {
      // setup
      const userInputs = [" open hello world ", "help"];
      // call
      const validatedInputs = new DialogCommand(new SmapiClientLateBound(), optionModel as OptionModel)._validateUserInputs(userInputs);
      // verify
      expect(validatedInputs).deep.equal(["open hello world", "help"]);
    });
  });
});
