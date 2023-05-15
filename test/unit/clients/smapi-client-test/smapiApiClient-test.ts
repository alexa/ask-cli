import {expect} from "chai";
import sinon, { SinonStub } from "sinon";
import * as httpClient from "../../../../lib/clients/http-client";
import { SmapiApiClient } from "../../../../lib/clients/smapi-client/smapiApiClient";

describe("SmapiApiClient invoke", () => {
  let httpClientStub: SinonStub;
  let smapiApiClientInstance: SmapiApiClient;

  const TEST_PROFILE = "testProfile";
  const TEST_DO_DEBUG = false;
  const HTTP_CLIENT_RESPONSE_BODY_CONTENT = {
    test: 'content',
  }
  const HTTP_CLIENT_RESPONSE_200 = {
    statusCode: 200,
    body: HTTP_CLIENT_RESPONSE_BODY_CONTENT,
    headers: []
  };
  const TEST_FULL_RESPONSE = false;
  const FAKE_URL = "FakeUrl";
  const TEST_ERROR = "TEST: error";
  const HEADER_CONTENT_TYPE_KEY = "content-type";
  const HEADER_CONTENT_TYPE_VALUE = "application/x-www-form-urlencoded";
  const HEADER_CONTENT_TYPE_JSON_VALUE = "application/json";
  const HEADER_2_KEY = "header2";
  const HEADER_2_VALUE = "value2";
  const API_CLIENT_REQUEST = {
    body: '&this=is&Test=Content',
    method: "GET",
    headers: [
      {
        key: HEADER_CONTENT_TYPE_KEY,
        value: HEADER_CONTENT_TYPE_VALUE,
      },
      {
        key: HEADER_2_KEY,
        value: HEADER_2_VALUE,
      },
    ],
    url: FAKE_URL,
  }

  beforeEach(() => {
    httpClientStub = sinon.stub(httpClient, "request").yields(null, HTTP_CLIENT_RESPONSE_200);
    //httpClientStub.callsArgWith(3, null, HTTP_CLIENT_RESPONSE_200);
    smapiApiClientInstance = new SmapiApiClient(TEST_DO_DEBUG, TEST_PROFILE, TEST_FULL_RESPONSE);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return a valid response", (done) => {
    const expectedHeaders: any = {};
    expectedHeaders[HEADER_CONTENT_TYPE_KEY]= HEADER_CONTENT_TYPE_JSON_VALUE;
    expectedHeaders[HEADER_2_KEY]= HEADER_2_VALUE;

    smapiApiClientInstance.invoke(API_CLIENT_REQUEST).then(smapiApiClientResponse => {
      expect(smapiApiClientResponse).to.not.be.null;
      expect(smapiApiClientResponse.statusCode).to.equal(HTTP_CLIENT_RESPONSE_200.statusCode);
      expect(smapiApiClientResponse.body).to.not.be.null;
      expect(smapiApiClientResponse.body).to.deep.equal(JSON.stringify(HTTP_CLIENT_RESPONSE_BODY_CONTENT));
      expect(smapiApiClientResponse.headers).to.not.be.null;
      expect(smapiApiClientResponse.headers).to.equal(HTTP_CLIENT_RESPONSE_200.headers);
      expect(httpClientStub.calledOnce).to.be.true;
      expect(httpClientStub.args[0][0]).to.deep.equal({
        url: API_CLIENT_REQUEST.url,
        method: API_CLIENT_REQUEST.method,
        headers: expectedHeaders,
        body: {
          this: 'is',
          Test: 'Content'
        },
      });
      expect(httpClientStub.args[0][1]).to.equal("SMAPI_API_CLIENT");
      expect(httpClientStub.args[0][2]).to.be.false;

      done();
    }).catch((err) =>{
      console.log(err);
    });
  });

  it("should reject the promise if httpClient request returns an error", (done) => {
    httpClientStub.reset();
    httpClientStub.callsArgWith(3, TEST_ERROR);
    smapiApiClientInstance.invoke(API_CLIENT_REQUEST).then(smapiApiClientResponse => {
      console.log(smapiApiClientResponse);
    }).catch((error) => {
      expect(error).to.not.be.null;
      expect(error.message).to.equal(TEST_ERROR);
      done();
    })
  })
});