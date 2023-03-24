import {expect} from "chai";
import fs from "fs";
import sinon from "sinon";
import AuthorizationController from "../../../../../../lib/controllers/authorization-controller";
import CONSTANTS from "../../../../../../lib/utils/constants";
import ExportPackageCommand from "../../../../../../lib/commands/smapi/appended-commands/export-package";
import helper from "../../../../../../lib/commands/smapi/appended-commands/export-package/helper";
import httpClient from "../../../../../../lib/clients/http-client";
import jsonView from "../../../../../../lib/view/json-view";
import Messenger from "../../../../../../lib/view/messenger";
import optionModel from "../../../../../../lib/commands/option-model.json";
import profileHelper from "../../../../../../lib/utils/profile-helper";
import zipUtils from "../../../../../../lib/utils/zip-utils";
import {OptionModel} from "../../../../../../lib/commands/option-validator";

describe("Commands export-package test - command class test", () => {
  const TEST_PROFILE = "default";
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
    const instance = new ExportPackageCommand(optionModel as OptionModel);
    expect(instance.name()).equal("export-package");
    expect(instance.description()).equal('download the skill package to "skill-package" folder in current directory');
    expect(instance.requiredOptions()).deep.equal(["skill-id", "stage"]);
    expect(instance.optionalOptions()).deep.equal(["profile", "debug"]);
  });

  describe("validate command handle", () => {
    const TEST_CMD = {
      profile: TEST_PROFILE,
      debug: TEST_DEBUG,
    };
    const TEST_ERROR_MESSAGE = "ERROR";
    const ERROR = new Error(TEST_ERROR_MESSAGE);
    let instance: ExportPackageCommand;
    let profileHelperRuntimeProfileStub: sinon.SinonStub;
    beforeEach(() => {
      profileHelperRuntimeProfileStub = sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      instance = new ExportPackageCommand(optionModel as OptionModel);
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("command handle - before export package", () => {
      it("| when profile is not correct, expect throw error", async () => {
        // setup
        profileHelperRuntimeProfileStub.throws(new Error("error"));
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith("error");

        // verify
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when skillPackage folder exists, expect throw error", async () => {
        // setup
        sinon.stub(fs, "existsSync").returns(true);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(
          `A ${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE} fold already exists in the current working directory.`,
        );

        // verify
        expect(errorStub).calledOnceWith(
          sinon.match({
            message: `A ${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE} ` + "fold already exists in the current working directory.",
          }),
        );
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });
    });

    describe("command handle - request to export skill package", () => {
      const EXPORT_ERROR = {
        statusCode: 403,
        body: {
          error: TEST_ERROR_MESSAGE,
        },
      };
      beforeEach(() => {
        sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
      });

      it("| export skill package fails, expect throw error", async () => {
        // setup
        sinon.stub(fs, "existsSync").returns(false);
        sinon.stub(httpClient, "request").callsArgWith(3, ERROR); // stub smapi request
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR_MESSAGE);

        // verify
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| export skill package response with status code >= 300, expect throw error", async () => {
        // setup
        sinon.stub(fs, "existsSync").returns(false);
        sinon.stub(httpClient, "request").callsArgWith(3, null, EXPORT_ERROR); // stub smapi request
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(jsonView.toString({error: TEST_ERROR_MESSAGE}));

        // verify
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });
    });

    describe("command handle - poll export skill package status and download file", () => {
      const EXPORT_RESPONSE = {
        statusCode: 200,
        headers: {
          location: "TEST_LOCATION",
        },
        body: {},
      };
      const POLL_RESPONSE = {
        statusCode: 200,
        headers: {},
        body: {
          skill: {
            location: "TEST_LOCATION",
          },
        },
      };
      beforeEach(() => {
        sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
      });

      it("| poll skill package fails, expect throw error", async () => {
        // setup
        sinon.stub(fs, "existsSync").returns(false);
        sinon.stub(httpClient, "request").callsArgWith(3, null, EXPORT_RESPONSE); // stub smapi request
        sinon.stub(helper, "pollExportStatus").callsArgWith(2, ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR_MESSAGE);

        // verify
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| unzipRemoteZipFile fails, expect throw error", async () => {
        // setup
        sinon.stub(fs, "existsSync").returns(false);
        sinon.stub(httpClient, "request").callsArgWith(3, null, EXPORT_RESPONSE); // stub smapi request
        sinon.stub(helper, "pollExportStatus").callsArgWith(2, null, POLL_RESPONSE);
        sinon.stub(zipUtils, "unzipRemoteZipFile").callsArgWith(3, ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR_MESSAGE);

        // verify
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| unzipRemoteZipFile passes", async () => {
        // setup
        sinon.stub(fs, "existsSync").returns(false);
        sinon.stub(httpClient, "request").callsArgWith(3, null, EXPORT_RESPONSE); // stub smapi request
        sinon.stub(helper, "pollExportStatus").callsArgWith(2, null, POLL_RESPONSE);
        sinon.stub(zipUtils, "unzipRemoteZipFile").callsArgWith(3, null);
        // call
        await instance.handle(TEST_CMD);

        // verify
        expect(infoStub).calledOnce;
        expect(warnStub).not.called;
      });
    });
  });
});
