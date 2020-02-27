const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const httpClient = require('@src/clients/http-client');
const urlUtility = require('@src/utils/url-utils');
const logger = require('@src/utils/logger-utility');
const CONSTANTS = require('@src/utils/constants');

describe('Clients test - cli http request client', () => {
    const VALID_OPTIONS = { url: 'https://test.com' };
    const BLANK_URL_OPTIONS = { url: '     ' };
    const INVALID_URL_OPTIONS = { url: 'https//test.com' };
    const INVALID_OPERATION = {};
    const VALID_OPERATION = 'valid-operation';
    const TEST_UPLOAD_URL = 'https://upload.url.com';
    const TEST_PAYLOAD = 'payload';

    describe('# input parameter validation', () => {
        it('| input operation is not a string, expect fatal error', (done) => {
            // call
            httpClient.request(VALID_OPTIONS, INVALID_OPERATION, false, (err) => {
                // verify
                expect(err).equal('[Fatal]: CLI request must have a non-empty operation name.');
                done();
            });
        });

        it('| input operation url is a blank string, expect fatal error', (done) => {
            // call
            httpClient.request(BLANK_URL_OPTIONS, VALID_OPERATION, false, (err) => {
                // verify
                expect(err).equal(`[Fatal]: Invalid URL:${BLANK_URL_OPTIONS.url}. CLI request must call with valid url.`);
                done();
            });
        });

        it('| input operation url is not a valid url, expect fatal error', (done) => {
            // setup
            sinon.stub(urlUtility, 'isValidUrl');
            urlUtility.isValidUrl.withArgs(INVALID_URL_OPTIONS).returns(false);
            // call
            httpClient.request(INVALID_URL_OPTIONS, VALID_OPERATION, false, (err) => {
                // verify
                expect(err).equal(`[Fatal]: Invalid URL:${INVALID_URL_OPTIONS.url}. CLI request must call with valid url.`);
                urlUtility.isValidUrl.restore();
                done();
            });
        });
    });

    describe('# embedding user-agent', () => {
        let stubRequest;
        let proxyhttpClient;
        let initialDownstreamClient;

        before(() => {
            initialDownstreamClient = process.env.ASK_DOWNSTREAM_CLIENT;
            stubRequest = sinon.stub();
            proxyhttpClient = proxyquire('@src/clients/http-client', { request: stubRequest });
        });

        it('| no downstream client, expect CLI user agent', (done) => {
            // setup
            const VALID_OPTION_WITH_HEADERS = {
                url: 'https://test.com',
                headers: {}
            };
            process.env.ASK_DOWNSTREAM_CLIENT = '';
            stubRequest.callsFake(() => {});
            // call
            proxyhttpClient.request(VALID_OPTION_WITH_HEADERS, VALID_OPERATION, true, () => {});
            // verify
            expect(stubRequest.args[0][0]).to.have.property('headers');
            expect(stubRequest.args[0][0].headers).to.have.property('User-Agent');
            expect(stubRequest.args[0][0].headers['User-Agent'].startsWith('ask-cli')).equal(true);
            done();
        });

        it('| downstream client environmental variable exists, expect downstream user agent', (done) => {
            // setup
            const TEST_DOWNSTREAM = 'test_downstream';
            process.env.ASK_DOWNSTREAM_CLIENT = TEST_DOWNSTREAM;
            stubRequest.callsFake(() => {});
            // call
            proxyhttpClient.request(VALID_OPTIONS, VALID_OPERATION, false, () => {});
            // verfiy
            expect(stubRequest.args[0][0]).to.have.property('headers');
            expect(stubRequest.args[0][0].headers).to.have.property('User-Agent');
            expect(stubRequest.args[0][0].headers['User-Agent'].startsWith(TEST_DOWNSTREAM)).equal(true);
            done();
        });

        afterEach(() => {
            stubRequest.reset();
        });

        after(() => {
            process.env.ASK_DOWNSTREAM_CLIENT = initialDownstreamClient;
        });
    });

    describe('# embedding proxyUrl', () => {
        let stubRequest;
        let proxyhttpClient;
        let initialProxyUrl;

        beforeEach(() => {
            initialProxyUrl = process.env.ASK_CLI_PROXY;
            stubRequest = sinon.stub();
            proxyhttpClient = proxyquire('@src/clients/http-client', { request: stubRequest });
        });

        it('| proxyUrl is added to request options', (done) => {
            // setup
            process.env.ASK_CLI_PROXY = 'proxyUrl';
            stubRequest.callsFake(() => {});
            // call
            proxyhttpClient.request(VALID_OPTIONS, VALID_OPERATION, true, () => {});
            // verfiy
            expect(stubRequest.args[0][0]).to.have.property('proxy');
            expect(stubRequest.args[0][0].proxy).equal('proxyUrl');
            done();
            // reset
        });

        afterEach(() => {
            stubRequest.reset();
            process.env.ASK_DOWNSTREAM_CLIENT = initialProxyUrl;
        });
    });

    describe('# call request correctly', () => {
        let stubRequest;
        let proxyhttpClient;

        before(() => {
            stubRequest = sinon.stub();
            proxyhttpClient = proxyquire('@src/clients/http-client', { request: stubRequest });
        });

        it('| request error occurs, expect error message', (done) => {
            // setup
            stubRequest.callsArgWith(1, 'error', null);
            // call
            proxyhttpClient.request(VALID_OPTIONS, VALID_OPERATION, false, (err, response) => {
                // verify
                expect(err).equal(`Failed to make request to ${VALID_OPERATION}.\nError response: error`);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| request with no error and no response, expect error', (done) => {
            // setup
            stubRequest.callsArgWith(1, null, null);
            // call
            proxyhttpClient.request(VALID_OPTIONS, VALID_OPERATION, false, (err, response) => {
                // verify
                expect(err).equal(`Failed to make request to ${VALID_OPERATION}.\nPlease make sure "${VALID_OPTIONS.url}" is responding.`);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| request with success, expect no error and response', (done) => {
            // setup
            stubRequest.callsArgWith(1, null, 'response');
            // call
            proxyhttpClient.request(VALID_OPTIONS, VALID_OPERATION, false, (err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).equal('response');
                done();
            });
        });

        it('| request with no error and debug flag, expect logger filled with correct debug info', (done) => {
            // setup
            const fakeResponse = {
                request: {
                    method: 'method',
                    href: 'href',
                    headers: 'request headers',
                    body: 'body'
                },
                headers: 'response headers',
                statusCode: 'status code',
                statusMessage: 'status message',
                body: 'body'
            };
            stubRequest.callsArgWith(1, null, fakeResponse);
            sinon.stub(logger, 'getInstance');
            const debugStub = sinon.spy();
            logger.getInstance.returns({
                debug: debugStub
            });
            // call
            proxyhttpClient.request(VALID_OPTIONS, VALID_OPERATION, true, () => {
                // verify
                const expectedDebugContent = {
                    activity: VALID_OPERATION,
                    error: null,
                    'request-id': null,
                    request: {
                        method: 'method',
                        url: 'href',
                        headers: 'request headers',
                        body: 'body'
                    },
                    response: {
                        statusCode: 'status code',
                        statusMessage: 'status message',
                        headers: 'response headers'
                    },
                    body: 'body'
                };
                expect(logger.getInstance.called).equal(true);
                expect(debugStub.args[0][0]).deep.equal(expectedDebugContent);
                logger.getInstance.restore();
                done();
            });
        });
    });

    describe('# verify upload method', () => {
        const stubRequest = sinon.stub();
        const proxyhttpClient = proxyquire('@src/clients/http-client', { request: stubRequest });

        afterEach(() => {
            sinon.restore();
        });

        it('| upload but meet error, expect error callback', (done) => {
            // setup
            stubRequest.callsArgWith(1, 'uploadErr');
            // test
            proxyhttpClient.putByUrl(TEST_UPLOAD_URL, TEST_PAYLOAD, VALID_OPERATION, false, (err, res) => {
                // verify
                expect(stubRequest.args[0][0].url).equal(TEST_UPLOAD_URL);
                expect(stubRequest.args[0][0].method).equal(CONSTANTS.HTTP_REQUEST.VERB.PUT);
                expect(stubRequest.args[0][0].body).equal(TEST_PAYLOAD);
                expect(res).equal(undefined);
                expect(err).equal(`Failed to make request to ${VALID_OPERATION}.\nError response: uploadErr`);
                done();
            });
        });

        it('| upload successfully', (done) => {
            // setup
            stubRequest.callsArgWith(1, null, { statusCode: 202 });
            // test
            proxyhttpClient.putByUrl(TEST_UPLOAD_URL, TEST_PAYLOAD, VALID_OPERATION, false, (err, res) => {
                // verify
                expect(stubRequest.args[0][0].url).equal(TEST_UPLOAD_URL);
                expect(stubRequest.args[0][0].method).equal(CONSTANTS.HTTP_REQUEST.VERB.PUT);
                expect(stubRequest.args[0][0].body).equal(TEST_PAYLOAD);
                expect(err).equal(null);
                expect(res).deep.equal({ statusCode: 202 });
                done();
            });
        });
    });
});
