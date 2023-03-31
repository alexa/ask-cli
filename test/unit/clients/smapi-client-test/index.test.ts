import {expect} from "chai";
import sinon from "sinon";

import {SmapiClientLateBound} from "../../../../lib/clients/smapi-client";
import httpClient from "../../../../lib/clients/http-client";
import AuthorizationController from "../../../../lib/controllers/authorization-controller";
import CONSTANTS from "../../../../lib/utils/constants";

import triggerAccountLinking from "./resources/account-linking";
import triggerCatalog from "./resources/catalog";
import triggerHistory from "./resources/history";
import triggerIsp from "./resources/isp";
import triggerManifest from "./resources/manifest";
import triggerInteractionModel from "./resources/interaction-model";
import triggerPrivateSkill from "./resources/private-skill";
import triggerSkillPackage from "./resources/skill-package";
import triggerSkill from "./resources/skill";
import triggerTest from "./resources/test";
import triggerVendor from "./resources/vendor";
import triggerTask from "./resources/task";
import triggerEvaluations from "./resources/evaluations";
import triggerAlexaHosted from "./resources/alexa-hosted";
import triggerBetaTestTests from "./resources/beta-test";
import triggerPublishingTests from "./resources/publishing";

describe("Clients test - smapi client test", () => {
  const TEST_PROFILE = "testProfile";
  const TEST_DO_DEBUG = false;
  const TEST_ACCESS_TOKEN = {
    access_token: "access_token",
    refresh_token: "refresh_token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: "expires_at",
  };
  const smapiClient = new SmapiClientLateBound();
  const smapiClientBound = smapiClient.withConfiguration({
    profile: TEST_PROFILE,
    doDebug: TEST_DO_DEBUG,
  });
  const TEST_REQUEST_RESPONSE = {
    statusCode: 100,
    body: '{"test":"BODY"}',
    headers: {},
  };
  const TEST_REQUEST_RESPONSE_NOT_PARSABLE = {
    statusCode: 100,
    body: '{"test","BODY"}',
    headers: {},
  };
  const TEST_REQUEST_RESPONSE_ERROR_STATUS_CODE_WITHOUT_BODY = {
    statusCode: 401,
    headers: {},
  };

  describe("# smapi client request handler", () => {
    const TEST_API_NAME = "apiName";
    const TEST_URL_PATH = "urlPath";
    const TEST_VERSION = "version";
    const TEST_METHOD = "method";
    const TEST_ERROR = "error";

    let tokenReadStub: sinon.SinonStub;
    let httpRequestStub: sinon.SinonStub;

    beforeEach(() => {
      sinon.restore();
      tokenReadStub = sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead");
      httpRequestStub = sinon.stub(httpClient, "request");
    });

    it("| input request options correctly to _smapiRequest", (done) => {
      // setup
      tokenReadStub.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
      httpRequestStub.callsArgWith(3, null, TEST_REQUEST_RESPONSE);
      // call
      smapiClient._smapiRequest(
        {
          profile: TEST_PROFILE,
          doDebug: TEST_DO_DEBUG,
        },
        TEST_API_NAME,
        TEST_METHOD,
        TEST_VERSION,
        TEST_URL_PATH,
        {},
        {},
        null,
        (err, res) => {
          // verify
          const expectedOptions = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${TEST_VERSION}/${TEST_URL_PATH}`,
            method: TEST_METHOD,
            headers: {authorization: "access_token"},
            body: null,
            json: false,
          };

          expect(tokenReadStub.args[0][0]).equal(TEST_PROFILE);
          expect(httpRequestStub.args[0][0]).deep.equal(expectedOptions);
          expect(httpRequestStub.args[0][1]).equal(TEST_API_NAME);
          expect(httpRequestStub.args[0][2]).equal(false);
          expect(err).equal(null);
          expect(res).deep.equal({
            statusCode: 100,
            body: {test: "BODY"},
            headers: {},
          });
          done();
        },
      );
    });

    it("| input request options without headers input to _smapiRequest", (done) => {
      // setup
      tokenReadStub.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
      httpRequestStub.callsArgWith(3, null, TEST_REQUEST_RESPONSE);
      // call
      smapiClient._smapiRequest(
        {
          profile: TEST_PROFILE,
          doDebug: TEST_DO_DEBUG,
        },
        TEST_API_NAME,
        TEST_METHOD,
        TEST_VERSION,
        TEST_URL_PATH,
        {},
        null,
        null,
        (err, res) => {
          // verify
          const expectedOptions = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${TEST_VERSION}/${TEST_URL_PATH}`,
            method: TEST_METHOD,
            headers: {authorization: "access_token"},
            body: null,
            json: false,
          };
          expect(tokenReadStub.args[0][0]).deep.equal(TEST_PROFILE);
          expect(httpRequestStub.args[0][0]).deep.equal(expectedOptions);
          expect(httpRequestStub.args[0][1]).equal(TEST_API_NAME);
          expect(httpRequestStub.args[0][2]).equal(false);
          expect(err).equal(null);
          expect(res).deep.equal({
            statusCode: 100,
            body: {test: "BODY"},
            headers: {},
          });
          done();
        },
      );
    });

    it("| input request options but http request fails", (done) => {
      // setup
      tokenReadStub.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
      httpRequestStub.callsArgWith(3, TEST_ERROR);
      // call
      smapiClient._smapiRequest(
        {
          profile: TEST_PROFILE,
          doDebug: TEST_DO_DEBUG,
        },
        TEST_API_NAME,
        TEST_METHOD,
        TEST_VERSION,
        TEST_URL_PATH,
        {},
        {},
        null,
        (err, res) => {
          // verify
          expect(err).equal(TEST_ERROR);
          expect(res).equal(undefined);
          done();
        },
      );
    });

    it("| input request options but the response is not parsable", (done) => {
      // setup
      tokenReadStub.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
      httpRequestStub.callsArgWith(3, null, TEST_REQUEST_RESPONSE_NOT_PARSABLE);
      // call
      smapiClient._smapiRequest(
        {
          profile: TEST_PROFILE,
          doDebug: TEST_DO_DEBUG,
        },
        TEST_API_NAME,
        TEST_METHOD,
        TEST_VERSION,
        TEST_URL_PATH,
        {},
        {},
        null,
        (err, res) => {
          // verify
          const errMsg = "[Fatal]: Failed to parse SMAPI's response. Please run again with --debug to check more details.\nError:";
          expect(err.startsWith(errMsg)).equal(true);
          expect(res).equal(null);
          done();
        },
      );
    });

    it("| input request options and the SMAPI returns error status code but without response object", (done) => {
      // setup
      tokenReadStub.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
      httpRequestStub.callsArgWith(3, null, TEST_REQUEST_RESPONSE_ERROR_STATUS_CODE_WITHOUT_BODY);
      // call
      smapiClient._smapiRequest(
        {
          profile: TEST_PROFILE,
          doDebug: TEST_DO_DEBUG,
        },
        TEST_API_NAME,
        TEST_METHOD,
        TEST_VERSION,
        TEST_URL_PATH,
        {},
        {},
        null,
        (err, res) => {
          // verify
          const errMsg = `[Fatal]: SMAPI error code ${TEST_REQUEST_RESPONSE_ERROR_STATUS_CODE_WITHOUT_BODY.statusCode}. \
No response body from the service request.`;
          expect(err).equal(errMsg);
          expect(res).equal(null);
          done();
        },
      );
    });
  });

  describe("# smapi client skill APIs", () => {
    triggerSkill(smapiClientBound);
    triggerManifest(smapiClientBound);
    triggerInteractionModel(smapiClientBound);
    triggerAccountLinking(smapiClientBound);
    triggerTest(smapiClientBound);
    triggerPrivateSkill(smapiClientBound);
    triggerHistory(smapiClientBound);
    triggerEvaluations(smapiClientBound);
    triggerAlexaHosted(smapiClientBound);
    triggerBetaTestTests(smapiClientBound);
    triggerPublishingTests(smapiClientBound);
  });

  triggerSkillPackage(smapiClientBound);

  triggerIsp(smapiClientBound);

  triggerVendor(smapiClientBound);

  triggerCatalog(smapiClientBound);

  triggerTask(smapiClientBound);
});
