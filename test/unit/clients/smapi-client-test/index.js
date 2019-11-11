const { expect } = require('chai');
const sinon = require('sinon');

const SmapiClient = require('@src/clients/smapi-client');
const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');

const triggerAccountLinking = require('./resources/account-linking');
const triggerCatalog = require('./resources/catalog');
const triggerHistory = require('./resources/history');
const triggerIsp = require('./resources/isp');
const triggerManifest = require('./resources/manifest');
const triggerInteractionModel = require('./resources/interaction-model');
const triggerPrivateSkill = require('./resources/private-skill');
const triggerSkillPackage = require('./resources/skill-package');
const triggerSkill = require('./resources/skill');
const triggerTest = require('./resources/test');
const triggerVendor = require('./resources/vendor');
const triggerTask = require('./resources/task');
const triggerEvaluations = require('./resources/evaluations');
const triggerAlexaHosted = require('./resources/alexa-hosted');
const triggerBetaTestTests = require('./resources/beta-test');
const triggerPublishingTests = require('./resources/publishing');

describe('Clients test - smapi client test', () => {
    const TEST_PROFILE = 'testProfile';
    const TEST_DO_DEBUG = false;
    const TEST_ACCESS_TOKEN = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 'expires_at'
    };
    const smapiClient = new SmapiClient({
        profile: TEST_PROFILE,
        doDebug: TEST_DO_DEBUG
    });
    const TEST_REQUEST_RESPONSE = {
        statusCode: 100,
        body: '{"test":"BODY"}',
        headers: {}
    };
    const TEST_REQUEST_RESPONSE_NOT_PARSABLE = {
        statusCode: 100,
        body: '{"test","BODY"}',
        headers: {}
    };
    const TEST_REQUEST_RESPONSE_ERROR_STATUS_CODE_WITHOUT_BODY = {
        statusCode: 401,
        headers: {}
    };

    describe('# smapi client request handler', () => {
        const TEST_API_NAME = 'apiName';
        const TEST_URL_PATH = 'urlPath';
        const TEST_VERSION = 'version';
        const TEST_METHOD = 'method';
        const TEST_ERROR = 'error';

        beforeEach(() => {
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
            sinon.stub(httpClient, 'request');
        });

        it('| input request options correctly to _smapiRequest', (done) => {
            // setup
            AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
            httpClient.request.callsArgWith(3, null, TEST_REQUEST_RESPONSE);
            // call
            smapiClient._smapiRequest(TEST_API_NAME, TEST_METHOD, TEST_VERSION, TEST_URL_PATH, {}, {}, null, (err, res) => {
                // verify
                const expectedOptions = {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${TEST_VERSION}/${TEST_URL_PATH}`,
                    method: TEST_METHOD,
                    headers: { authorization: 'access_token' },
                    body: null,
                    json: false
                };

                expect(AuthorizationController.prototype.tokenRefreshAndRead.args[0][0]).equal(TEST_PROFILE);
                expect(httpClient.request.args[0][0]).deep.equal(expectedOptions);
                expect(httpClient.request.args[0][1]).equal(TEST_API_NAME);
                expect(httpClient.request.args[0][2]).equal(false);
                expect(err).equal(null);
                expect(res).deep.equal({
                    statusCode: 100,
                    body: { test: 'BODY' },
                    headers: {}
                });
                done();
            });
        });

        it('| input request options without headers input to _smapiRequest', (done) => {
            // setup
            AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
            httpClient.request.callsArgWith(3, null, TEST_REQUEST_RESPONSE);
            // call
            smapiClient._smapiRequest(TEST_API_NAME, TEST_METHOD, TEST_VERSION, TEST_URL_PATH, {}, null, null, (err, res) => {
                // verify
                const expectedOptions = {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${TEST_VERSION}/${TEST_URL_PATH}`,
                    method: TEST_METHOD,
                    headers: { authorization: 'access_token' },
                    body: null,
                    json: false
                };
                expect(AuthorizationController.prototype.tokenRefreshAndRead.args[0][0]).deep.equal(TEST_PROFILE);
                expect(httpClient.request.args[0][0]).deep.equal(expectedOptions);
                expect(httpClient.request.args[0][1]).equal(TEST_API_NAME);
                expect(httpClient.request.args[0][2]).equal(false);
                expect(err).equal(null);
                expect(res).deep.equal({
                    statusCode: 100,
                    body: { test: 'BODY' },
                    headers: {}
                });
                done();
            });
        });

        it('| input request options but http request fails', (done) => {
            // setup
            AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
            httpClient.request.callsArgWith(3, TEST_ERROR);
            // call
            smapiClient._smapiRequest(TEST_API_NAME, TEST_METHOD, TEST_VERSION, TEST_URL_PATH, {}, {}, null, (err, res) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| input request options but the response is not parsable', (done) => {
            // setup
            AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
            httpClient.request.callsArgWith(3, null, TEST_REQUEST_RESPONSE_NOT_PARSABLE);
            // call
            smapiClient._smapiRequest(TEST_API_NAME, TEST_METHOD, TEST_VERSION, TEST_URL_PATH, {}, {}, null, (err, res) => {
                // verify
                const errMsg = '[Fatal]: Failed to parse SMAPI\'s response. Please run again with --debug to check more details.\nError:';
                expect(err.startsWith(errMsg)).equal(true);
                expect(res).equal(null);
                done();
            });
        });

        it('| input request options and the SMAPI returns error status code but without response object', (done) => {
            // setup
            AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
            httpClient.request.callsArgWith(3, null, TEST_REQUEST_RESPONSE_ERROR_STATUS_CODE_WITHOUT_BODY);
            // call
            smapiClient._smapiRequest(TEST_API_NAME, TEST_METHOD, TEST_VERSION, TEST_URL_PATH, {}, {}, null, (err, res) => {
                // verify
                const errMsg = `[Fatal]: SMAPI error code ${TEST_REQUEST_RESPONSE_ERROR_STATUS_CODE_WITHOUT_BODY.statusCode}. \
No response body from the service request.`;
                expect(err).equal(errMsg);
                expect(res).equal(null);
                done();
            });
        });

        afterEach(() => {
            httpClient.request.restore();
            AuthorizationController.prototype.tokenRefreshAndRead.restore();
        });
    });

    describe('# smapi client smapiRedirectRequestWithUrl method', () => {
        const TEST_URL = 'url';

        beforeEach(() => {
            sinon.stub(httpClient, 'request');
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        it('| pass the resquest option and make http client request correctly', (done) => {
            // setup
            AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
            httpClient.request.callsArgWith(3, null, TEST_REQUEST_RESPONSE);
            // call
            smapiClient.smapiRedirectRequestWithUrl(TEST_URL, (err, res) => {
                // verify
                const expectedRequestOption = {
                    url: TEST_URL,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: { authorization: 'access_token' },
                    body: null
                };
                expect(AuthorizationController.prototype.tokenRefreshAndRead.args[0][0]).deep.equal(TEST_PROFILE);
                expect(httpClient.request.args[0][0]).deep.equal(expectedRequestOption);
                expect(httpClient.request.args[0][1]).equal('REDIRECT_URL');
                expect(httpClient.request.args[0][2]).equal(false);
                expect(err).equal(null);
                expect(res).deep.equal({
                    statusCode: 100,
                    body: { test: 'BODY' },
                    headers: {}
                });
                done();
            });
        });

        it('| pass the resquest option correctly but SMAPI response error status code without response body', (done) => {
            // setup
            AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, TEST_ACCESS_TOKEN.access_token);
            httpClient.request.callsArgWith(3, null, TEST_REQUEST_RESPONSE_ERROR_STATUS_CODE_WITHOUT_BODY);
            // call
            smapiClient.smapiRedirectRequestWithUrl(TEST_URL, (err, res) => {
                // verify
                const errMsg = `[Fatal]: SMAPI error code ${TEST_REQUEST_RESPONSE_ERROR_STATUS_CODE_WITHOUT_BODY.statusCode}. \
No response body from the service request.`;
                expect(err).equal(errMsg);
                expect(res).equal(null);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# smapi client listWithAutoPagination method', () => {
        smapiClient.testFunc = () => {};
        const TEST_CALL_API_TRACK = ['testFunc'];
        const TEST_CALL_ARGV = ['arg1', 'arg2'];
        const TEST_RESPONSE_ACCESSOR = 'TEST';
        const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
        const TEST_RESPONSE_HANDLE = (res) => {
            const array = [];
            array.push(res.body);
            return {
                nextToken: res.nextToken,
                listResult: array
            };
        };
        const TEST_ERROR_MESSAGE = 'error';
        let stubTestFunc;
        beforeEach(() => {
            stubTestFunc = sinon.stub(smapiClient, 'testFunc');
        });

        it('| handle error from target function', (done) => {
            // setup
            stubTestFunc.callsArgWith(3, TEST_ERROR_MESSAGE, null);
            // call
            smapiClient.listWithAutoPagination(TEST_CALL_API_TRACK, TEST_CALL_ARGV, TEST_RESPONSE_ACCESSOR, TEST_RESPONSE_HANDLE, (err) => {
                // verify
                expect(err).equal(TEST_ERROR_MESSAGE);
                done();
            });
        });

        it('| handle response with status code >= 300', (done) => {
            // setup
            stubTestFunc.callsArgWith(3, null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY });
            // call
            smapiClient.listWithAutoPagination(TEST_CALL_API_TRACK, TEST_CALL_ARGV, TEST_RESPONSE_ACCESSOR, TEST_RESPONSE_HANDLE, (err) => {
                // verify
                expect(err).equal(TEST_HTTP_RESPONSE_BODY);
                done();
            });
        });

        it('| handle response with status code < 300', (done) => {
            // setup
            stubTestFunc.onCall(0).callsArgWith(3, null, { statusCode: 200, body: 'TEST_BODY1', nextToken: 'TEST_TOKEN' });
            stubTestFunc.onCall(1).callsArgWith(3, null, { statusCode: 200, body: 'TEST_BODY2', nextToken: null });
            // call
            smapiClient.listWithAutoPagination(TEST_CALL_API_TRACK, TEST_CALL_ARGV, TEST_RESPONSE_ACCESSOR, TEST_RESPONSE_HANDLE, (err, res) => {
                // verify
                const expectation = {};
                expectation[TEST_RESPONSE_ACCESSOR] = ['TEST_BODY1', 'TEST_BODY2'];
                expect(err).to.equal(null);
                expect(res).to.deep.equals(expectation);
                done();
            });
        });

        afterEach(() => {
            stubTestFunc.restore();
        });
    });

    describe('# smapi client skill APIs', () => {
        triggerSkill(smapiClient);
        triggerManifest(smapiClient);
        triggerInteractionModel(smapiClient);
        triggerAccountLinking(smapiClient);
        triggerTest(smapiClient);
        triggerPrivateSkill(smapiClient);
        triggerHistory(smapiClient);
        triggerEvaluations(smapiClient);
        triggerAlexaHosted(smapiClient);
        triggerBetaTestTests(smapiClient);
        triggerPublishingTests(smapiClient);
    });

    triggerSkillPackage(smapiClient);

    triggerIsp(smapiClient);

    triggerVendor(smapiClient);

    triggerCatalog(smapiClient);

    triggerTask(smapiClient);
});
