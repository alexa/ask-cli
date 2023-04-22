import axios from "axios";
import {expect} from "chai";
import {stub, replace, restore, spy} from "sinon";

import * as httpClient from "../../../lib/clients/http-client";
import urlUtility, {isValidUrl} from "../../../lib/utils/url-utils";
import logger, {getInstance} from "../../../lib/utils/logger-utility";
import {HTTP_REQUEST} from "../../../lib/utils/constants";

describe("Clients test - cli http request client", () => {
  const VALID_OPTIONS = {url: "https://test.com"};
  const BLANK_URL_OPTIONS = {url: "     "};
  const INVALID_URL_OPTIONS = {url: "https//test.com"};
  const INVALID_OPERATION = {};
  const VALID_OPERATION = "valid-operation";
  const TEST_UPLOAD_URL = "https://upload.url.com";
  const TEST_PAYLOAD = "payload";
  const TEST_REQUEST_BODY = {token: "someToken"};
  const TEST_FAKE_REQUEST_ID = "FOO REQUEST #5";
  const TEST_FAKE_RESPONSE_HEADERS = {"x-amzn-requestid": TEST_FAKE_REQUEST_ID};
  const TEST_FAKE_REQUEST_HEADERS = {"H-key": "H-value"};
  const TEST_DEFAULT_AXIOS_RESPONSE = {
    status: 200,
    statusText: "status message",
    headers: TEST_FAKE_RESPONSE_HEADERS,
    data: TEST_REQUEST_BODY,
    config: {
      method: "FAKE",
      url: VALID_OPTIONS.url,
      headers: TEST_FAKE_REQUEST_HEADERS,
      data:TEST_REQUEST_BODY
    }
  };
  let stubRequest;
  let axiosPromiseResponse;
  let debugStub;
  let errorStub;
  let warnStub;
  let infoStub;

  beforeEach(() => {
    axiosPromiseResponse = stub();
    stubRequest = replace(axios, "request", axiosPromiseResponse);
    axiosPromiseResponse.resolves(TEST_DEFAULT_AXIOS_RESPONSE);

    stub(logger, "getInstance");
    debugStub = stub();
    errorStub = stub();
    warnStub = stub();
    infoStub = stub();
    getInstance.returns({
      info: infoStub,
      warn: warnStub,
      error: errorStub,
      debug: debugStub,
    });
  });

  afterEach(() => {
    restore();
  });

  describe("# input parameter validation", () => {
    it("| input operation is not a string, expect fatal error", (done) => {
      // call
      httpClient.request(VALID_OPTIONS, INVALID_OPERATION, false, (err) => {
        // verify
        expect(err).equal("[Fatal]: CLI request must have a non-empty operation name.");
        done();
      });
    });

    it("| input operation url is a blank string, expect fatal error", (done) => {
      // call
      httpClient.request(BLANK_URL_OPTIONS, VALID_OPERATION, false, (err) => {
        // verify
        expect(err).equal(`[Fatal]: Invalid URL:${BLANK_URL_OPTIONS.url}. CLI request must call with valid url.`);
        done();
      });
    });

    it("| input operation url is not a valid url, expect fatal error", (done) => {
      // setup
      stub(urlUtility, "isValidUrl");
      isValidUrl.withArgs(INVALID_URL_OPTIONS).returns(false);
      // call
      httpClient.request(INVALID_URL_OPTIONS, VALID_OPERATION, false, (err) => {
        isValidUrl.restore();

        // verify
        expect(err).equal(`[Fatal]: Invalid URL:${INVALID_URL_OPTIONS.url}. CLI request must call with valid url.`);
        done();
      });
    });
  });

  describe("# embedding user-agent", () => {
    let initialDownstreamClient;

    before(() => {
      if (process.env.ASK_DOWNSTREAM_CLIENT) {
        initialDownstreamClient = process.env.ASK_DOWNSTREAM_CLIENT;
      }
    });

    afterEach(() => {
      initialDownstreamClient ? (process.env.ASK_DOWNSTREAM_CLIENT = initialDownstreamClient) : delete process.env.ASK_DOWNSTREAM_CLIENT;
    });

    it("| no downstream client, expect CLI user agent", (done) => {
      // setup
      const VALID_OPTION_WITH_HEADERS = {
        url: "https://test.com",
        headers: {},
      };
      process.env.ASK_DOWNSTREAM_CLIENT = "";
      // call
      httpClient.request(VALID_OPTION_WITH_HEADERS, VALID_OPERATION, true, () => {});
      // verify
      expect(stubRequest.args[0][0]).to.have.property("headers");
      expect(stubRequest.args[0][0].headers).to.have.property("User-Agent");
      expect(stubRequest.args[0][0].headers["User-Agent"].startsWith("ask-cli")).equal(true);
      done();
    });

    it("| downstream client environmental variable exists, expect downstream user agent", (done) => {
      // setup
      const TEST_DOWNSTREAM = "test_downstream";
      process.env.ASK_DOWNSTREAM_CLIENT = TEST_DOWNSTREAM;
      // call
      httpClient.request(VALID_OPTIONS, VALID_OPERATION, false, () => {});
      // verfiy
      expect(stubRequest.args[0][0]).to.have.property("headers");
      expect(stubRequest.args[0][0].headers).to.have.property("User-Agent");
      expect(stubRequest.args[0][0].headers["User-Agent"].startsWith(TEST_DOWNSTREAM)).equal(true);
      done();
    });
  });

  describe("# embedding proxyUrl", () => {
    let initialProxyUrl;

    before(() => {
      if (process.env.ASK_CLI_PROXY) {
        initialProxyUrl = process.env.ASK_CLI_PROXY;
      }
    });

    afterEach(() => {
      initialProxyUrl ? (process.env.ASK_CLI_PROXY = initialProxyUrl) : delete process.env.ASK_CLI_PROXY;
    });

    it("| proxyUrl is added to request options", (done) => {
      // setup
      process.env.ASK_CLI_PROXY = "ftp://u:p@proxy.url:5678";
      // call
      httpClient.request(VALID_OPTIONS, VALID_OPERATION, true, () => {});

      // verfiy
      expect(stubRequest.args[0][0]).to.have.property("proxy");
      expect(stubRequest.args[0][0].proxy.protocol).equal("ftp");
      expect(stubRequest.args[0][0].proxy.host).equal("proxy.url");
      expect(stubRequest.args[0][0].proxy.port).equal("5678");
      expect(stubRequest.args[0][0].proxy).to.have.property("auth");
      expect(stubRequest.args[0][0].proxy.auth.username).equal("u");
      expect(stubRequest.args[0][0].proxy.auth.password).equal("p");

      done();
    });

    it("| proxyUrl is added to request options", (done) => {
      // setup
      const invalidProxyUrl = "This should fail the url Validity check";
      process.env.ASK_CLI_PROXY = invalidProxyUrl;
      // call
      httpClient.request(VALID_OPTIONS, VALID_OPERATION, true, (err, response) => {
        // verify
        expect(err).equal(`[Fatal]: Invalid Proxy setting URL: ${invalidProxyUrl}. Reset ASK_CLI_PROXY env variable with a valid proxy url.`);
        expect(response).equal(undefined);
        done();
      });
    });
  });

  describe("# call request correctly", () => {
    it("| request error occurs, expect error message", (done) => {
      // setup
      axiosPromiseResponse.rejects("error");
      // call
      httpClient.request(VALID_OPTIONS, VALID_OPERATION, false, (err, response) => {
        // verify
        expect(err).equal(`The request to ${VALID_OPTIONS.url} failed. Client Error: error`);
        expect(response).deep.equal({});
        done();
      });
    });

    it("| request with no error and no response, expect error", (done) => {
      // setup
      axiosPromiseResponse.resolves(null);
      // call
      httpClient.request(VALID_OPTIONS, VALID_OPERATION, false, (err, response) => {
        // verify
        expect(err).equal(`The request to ${VALID_OPERATION}, failed.\nPlease make sure "${VALID_OPTIONS.url}" is responding.`);
        expect(response).equal(undefined);
        done();
      });
    });

    it("| request with no error and no response statusCode, expect error", (done) => {
      // setup
      axiosPromiseResponse.resolves({data: "response"});
      // call
      httpClient.request(VALID_OPTIONS, VALID_OPERATION, false, (err, response) => {
        // verify
        expect(err).equal(`Failed to access the statusCode from the request to ${VALID_OPERATION}.`);
        expect(response).equal(undefined);
        done();
      });
    });

    it("| request with success, expect no error and response", (done) => {
      // setup
      axiosPromiseResponse.resolves({status: 200});
      // call
      httpClient.request(VALID_OPTIONS, VALID_OPERATION, false, (err, response) => {
        // verify
        expect(err).equal(null);
        expect(response).deep.equal({statusCode: 200});
        done();
      });
    });

    it("| request with no error and debug flag, expect logger filled with correct debug info", (done) => {
      // setup
      const fakeResponse = {
        request: {
          method: TEST_DEFAULT_AXIOS_RESPONSE.config.method,
          href: TEST_DEFAULT_AXIOS_RESPONSE.config.url,
          headers: TEST_FAKE_REQUEST_HEADERS,
          data: TEST_DEFAULT_AXIOS_RESPONSE.config.data,
        },
        headers: TEST_FAKE_RESPONSE_HEADERS,
        status: 200,
        statusText: "status message",
        data: "body",
        config: TEST_DEFAULT_AXIOS_RESPONSE.config
      };
      axiosPromiseResponse.resolves(fakeResponse);
      // call
      httpClient.request(VALID_OPTIONS, VALID_OPERATION, true, () => {
        // verify
        const expectedDebugContent = {
          activity: VALID_OPERATION,
          error: null,
          "request-id": TEST_FAKE_REQUEST_ID,
          request: {
            method: fakeResponse.request.method,
            url: fakeResponse.request.href,
            headers: TEST_FAKE_REQUEST_HEADERS,
            body: TEST_DEFAULT_AXIOS_RESPONSE.config.data,
          },
          response: {
            statusCode: 200,
            statusMessage: fakeResponse.statusText,
            headers: fakeResponse.headers,
          },
          body: fakeResponse.data,
        };
        expect(getInstance.called).equal(true);
        expect(debugStub.args[0][0]).deep.equal(expectedDebugContent);
        getInstance.restore();
        done();
      });
    });
  });

  describe("# verify upload method", () => {
    it("| upload but meet error, expect error callback", (done) => {
      // setup
      axiosPromiseResponse.rejects("uploadErr");
      // test
      httpClient.putByUrl(TEST_UPLOAD_URL, TEST_PAYLOAD, VALID_OPERATION, false, (err, res) => {
        // verify
        expect(stubRequest.args[0][0].url).equal(TEST_UPLOAD_URL);
        expect(stubRequest.args[0][0].method).equal(HTTP_REQUEST.VERB.PUT);
        expect(stubRequest.args[0][0].data).equal(TEST_PAYLOAD);
        expect(res).deep.equal({});
        expect(err).equal(`The request to ${TEST_UPLOAD_URL} failed. Client Error: uploadErr`);
        done();
      });
    });

    it("| upload successfully", (done) => {
      // setup
      axiosPromiseResponse.resolves({status: 202});
      // test
      httpClient.putByUrl(TEST_UPLOAD_URL, TEST_PAYLOAD, VALID_OPERATION, false, (err, res) => {
        // verify
        expect(stubRequest.args[0][0].url).equal(TEST_UPLOAD_URL);
        expect(stubRequest.args[0][0].method).equal(HTTP_REQUEST.VERB.PUT);
        expect(stubRequest.args[0][0].data).equal(TEST_PAYLOAD);
        expect(err).equal(null);
        expect(res).deep.equal({statusCode: 202});
        done();
      });
    });
  });
});
