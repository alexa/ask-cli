import {expect} from "chai";
import sinon from "sinon";
import AuthorizationController from "../../../../../lib/controllers/authorization-controller";
import configureUi from "../../../../../lib/commands/configure/ui";
import GenerateLwaTokensCommand from "../../../../../lib/commands/util/generate-lwa-tokens";
import jsonView from "../../../../../lib/view/json-view";
import Messenger from "../../../../../lib/view/messenger";
import optionModel from "../../../../../lib/commands/option-model.json";
import {OptionModel} from "../../../../../lib/commands/option-validator";

describe("Commands generate-lwa-tokens test - command class test", () => {
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
    const instance = new GenerateLwaTokensCommand(optionModel as OptionModel);
    expect(instance.name()).equal("generate-lwa-tokens");
    expect(instance.description()).equal("generate Login with Amazon tokens from any LWA client");
    expect(instance.requiredOptions()).deep.equal([]);
    expect(instance.optionalOptions()).deep.equal(["client-id", "client-confirmation", "scopes", "no-browser", "debug"]);
  });

  describe("validate command handle", () => {
    const TEST_CLIENT_ID = "client id";
    const TEST_CLIENT_CONFIRMATION = "client confirmation";
    const TEST_SCOPES = "scopes1 scopes2";
    const TEST_ERROR = "error";
    const TEST_AUTHORIZE_URL = "authorize url";
    const TEST_AUTH_CODE = "auth code";
    const TEST_ACCESS_TOKEN = {
      access_token: "AToken",
    };
    let instance: GenerateLwaTokensCommand;
    let authorizationControllerGetAuthorizeUrlStub: sinon.SinonStub;
    let configureUiGetAuthCodeStub: sinon.SinonStub;
    let authorizationControllerGetAccessTokenUsingAuthCodeStub: sinon.SinonStub;
    let authorizationControllerGetTokensByListeningOnPortStub: sinon.SinonStub;

    beforeEach(() => {
      configureUiGetAuthCodeStub = sinon.stub(configureUi, "getAuthCode");
      authorizationControllerGetAuthorizeUrlStub = sinon.stub(AuthorizationController.prototype, "getAuthorizeUrl");
      authorizationControllerGetAccessTokenUsingAuthCodeStub = sinon.stub(AuthorizationController.prototype, "getAccessTokenUsingAuthCode");
      authorizationControllerGetTokensByListeningOnPortStub = sinon.stub(AuthorizationController.prototype, "getTokensByListeningOnPort");
      instance = new GenerateLwaTokensCommand(optionModel as OptionModel);
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("command handle - no browser approach", () => {
      it("| ui get authCode fails with error, expect error displayed", async () => {
        // setup
        const TEST_CMD = {
          browser: false,
          debug: TEST_DEBUG,
        };
        authorizationControllerGetAuthorizeUrlStub.returns(TEST_AUTHORIZE_URL);
        configureUiGetAuthCodeStub.callsArgWith(0, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).calledOnce;
        expect(warnStub).not.called;
      });

      it("| lwa controller fails to get accessToken with the input authCode, expect error displayed", async () => {
        // setup
        const TEST_CMD = {
          browser: false,
          debug: TEST_DEBUG,
        };
        authorizationControllerGetAuthorizeUrlStub.returns(TEST_AUTHORIZE_URL);
        configureUiGetAuthCodeStub.callsArgWith(0, null, TEST_AUTH_CODE);
        authorizationControllerGetAccessTokenUsingAuthCodeStub.callsArgWith(1, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).calledOnce;
        expect(warnStub).not.called;
      });

      it("| no-browser flow succeeds, expect ui displays properly", async () => {
        // setup
        const TEST_CMD = {
          clientId: TEST_CLIENT_ID,
          clientConfirmation: TEST_CLIENT_CONFIRMATION,
          scopes: TEST_SCOPES,
          browser: false,
          debug: TEST_DEBUG,
        };
        authorizationControllerGetAuthorizeUrlStub.returns(TEST_AUTHORIZE_URL);
        configureUiGetAuthCodeStub.callsArgWith(0, null, TEST_AUTH_CODE);
        authorizationControllerGetAccessTokenUsingAuthCodeStub.callsArgWith(1, null, TEST_ACCESS_TOKEN);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(infoStub.args[0][0]).equal(`Paste the following url to your browser:\n    ${TEST_AUTHORIZE_URL}`);
        expect(infoStub.args[1][0]).equal("\nThe LWA tokens result:");
        expect(infoStub.args[2][0]).equal(jsonView.toString(TEST_ACCESS_TOKEN));
        expect(errorStub).not.called;
        expect(warnStub).not.called;
      });
    });

    describe("command handle - use browser approach", () => {
      it("| lwa controller fails to get token by listening, expect error displayed", async () => {
        // setup
        const TEST_CMD = {
          debug: TEST_DEBUG,
        };
        authorizationControllerGetTokensByListeningOnPortStub.callsArgWith(0, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);

        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| flow with browser succeeds, expect ui displays token info properly", async () => {
        // setup
        const TEST_CMD = {
          clientId: TEST_CLIENT_ID,
          clientConfirmation: TEST_CLIENT_CONFIRMATION,
          scopes: TEST_SCOPES,
          debug: TEST_DEBUG,
        };
        authorizationControllerGetTokensByListeningOnPortStub.callsArgWith(0, null, TEST_ACCESS_TOKEN);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(infoStub.args[0][0]).equal("The LWA tokens result:");
        expect(infoStub.args[1][0]).equal(jsonView.toString(TEST_ACCESS_TOKEN));
        expect(errorStub).not.called;
        expect(warnStub).not.called;
      });
    });
  });
});
