const { expect } = require('chai');
const sinon = require('sinon');

const askProfileSetupHelper = require('@src/commands/configure/ask-profile-setup-helper');
const messages = require('@src/commands/configure/messages');
const ui = require('@src/commands/configure/ui');
const AuthorizationController = require('@src/controllers/authorization-controller');
const httpClient = require('@src/clients/http-client');
const SmapiClient = require('@src/clients/smapi-client');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');

describe('Command: Configure - ASK profile setup helper test', () => {
    const TEST_PROFILE = 'testProfile';
    const TEST_DO_DEBUG = false;
    const TEST_NEED_BROWSER = false;
    const TEST_VENDOR_ID_1 = 'testVendorId_1';
    const TEST_VENDOR_ID_2 = 'testVendorId_2';
    const TEST_ERROR_MESSAGE = 'error thrown';
    const TEST_CONFIG = {
        askProfile: TEST_PROFILE,
        needBrowser: TEST_NEED_BROWSER,
        debug: TEST_DO_DEBUG
    };
    const TEST_VENDOR_HTTP_RESPONSE_BODY = {
        vendors: [
            { id: TEST_VENDOR_ID_1 }
        ]
    };

    const TEST_MULTIPLE_VENDORS_HTTP_RESPONSE_BODY = {
        vendors: [
            { id: TEST_VENDOR_ID_1 },
            { id: TEST_VENDOR_ID_2 }
        ]
    };

    const TEST_EMPTY_VENDOR_HTTP_RESPONSE_BODY = {
        vendors: []
    };

    const TEST_ACCESS_TOKEN = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 3600,
        expires_at: 'expires_at'
    };

    const TEST_AUTHORIZE_URL = 'authorizeUrl';
    const TEST_AUTH_CODE = 'authCode';

    describe('# test setupAskToken', () => {
        let infoStub;
        beforeEach(() => {
            sinon.stub(AuthorizationController.prototype, 'getTokensByListeningOnPort');
            sinon.stub(AuthorizationController.prototype, 'getAccessTokenUsingAuthCode');
            sinon.stub(AuthorizationController.prototype, 'getAuthorizeUrl');
            sinon.stub(ui, 'getAuthCode');
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
        });

        it('| test valid access token retrieval, getTokensByListeningOnPort returns valid token', (done) => {
            // setup
            AuthorizationController.prototype.getTokensByListeningOnPort.callsArgWith(0, null, TEST_ACCESS_TOKEN);

            // call
            askProfileSetupHelper.setupAskToken({ needBrowser: true, askProfile: TEST_PROFILE }, (error, accessToken) => {
                // verify
                expect(error).eq(null);
                expect(accessToken).to.deep.eq(TEST_ACCESS_TOKEN);
                done();
            });
        });

        it('| test valid access token retrieval, getTokensByListeningOnPort returns error', (done) => {
            // setup
            AuthorizationController.prototype.getTokensByListeningOnPort.callsArgWith(0, TEST_ERROR_MESSAGE);

            // call
            askProfileSetupHelper.setupAskToken({ needBrowser: true, askProfile: TEST_PROFILE }, (error, accessToken) => {
                // verify
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(accessToken).eq(undefined);
                done();
            });
        });

        it('| test valid access token retrieval, authcode retrieval returns error', (done) => {
            // setup
            AuthorizationController.prototype.getAuthorizeUrl.returns(TEST_AUTHORIZE_URL);
            ui.getAuthCode.callsArgWith(0, TEST_ERROR_MESSAGE);

            // call
            askProfileSetupHelper.setupAskToken(TEST_CONFIG, (error, accessToken) => {
                // verify
                expect(infoStub.args[0][0]).eq(`Paste the following url to your browser:\n    ${TEST_AUTHORIZE_URL}`);
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(accessToken).eq(undefined);
                done();
            });
        });

        it('| test valid access token retrieval, getAccessTokenUsingAuthCode returns valid token', (done) => {
            // setup
            AuthorizationController.prototype.getAccessTokenUsingAuthCode.callsArgWith(1, null, TEST_ACCESS_TOKEN);
            AuthorizationController.prototype.getAuthorizeUrl.returns('authorizeUrl');
            ui.getAuthCode.callsArgWith(0, null, TEST_AUTH_CODE);

            // call
            askProfileSetupHelper.setupAskToken(TEST_CONFIG, (error, accessToken) => {
                // verify
                expect(error).eq(null);
                expect(accessToken).to.deep.eq(TEST_ACCESS_TOKEN);
                expect(infoStub.args[0][0]).eq(`Paste the following url to your browser:\n    ${TEST_AUTHORIZE_URL}`);
                done();
            });
        });

        it('| test valid access token retrieval, getAccessTokenUsingAuthCode throws error', (done) => {
            // setup
            AuthorizationController.prototype.getAccessTokenUsingAuthCode.callsArgWith(1, TEST_ERROR_MESSAGE);
            AuthorizationController.prototype.getAuthorizeUrl.returns('authorizeUrl');
            ui.getAuthCode.callsArgWith(0, null, TEST_AUTH_CODE);

            // call
            askProfileSetupHelper.setupAskToken(TEST_CONFIG, (error, accessToken) => {
                // verify
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(accessToken).eq(undefined);
                expect(infoStub.args[0][0]).eq(`Paste the following url to your browser:\n    ${TEST_AUTHORIZE_URL}`);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# test setupVendorId', () => {
        const smapiClient = new SmapiClient({
            profile: TEST_PROFILE,
            doDebug: TEST_DO_DEBUG
        });
        const EMPTY_RESPONSE_BODY = '{}';

        smapiClient.testFunc = () => {};
        let stubTestFunc;

        describe('# test _getVendorInfo', () => {
            beforeEach(() => {
                sinon.stub(httpClient, 'request');
                sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
                stubTestFunc = sinon.stub(smapiClient, 'testFunc');
                AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, 'refresh_token');
            });

            it('| returns valid vendorID, one vendorID present', (done) => {
                // setup
                httpClient.request.callsArgWith(3, null, { statusCode: 200, body: TEST_VENDOR_HTTP_RESPONSE_BODY });
                stubTestFunc.callsArgWith(0, null, { statusCode: 200, body: TEST_VENDOR_HTTP_RESPONSE_BODY });

                // call
                askProfileSetupHelper.setupVendorId(TEST_CONFIG, (err, vendorId) => {
                    // verify
                    expect(err).eq(null);
                    expect(vendorId).eq(TEST_VENDOR_ID_1);
                    done();
                });
            });

            it('| throws error: smapi client returns error', (done) => {
                // setup
                httpClient.request.callsArgWith(3, TEST_ERROR_MESSAGE, {});
                stubTestFunc.callsArgWith(0, TEST_ERROR_MESSAGE, {});

                // call
                askProfileSetupHelper.setupVendorId(TEST_CONFIG, (err, vendorId) => {
                    // verify
                    expect(err).eq(TEST_ERROR_MESSAGE);
                    expect(vendorId).eq(undefined);
                    done();
                });
            });

            it('| throws error: status code greater than or equal to 300', (done) => {
                // setup
                sinon.stub(jsonView, 'toString');
                jsonView.toString.withArgs(sinon.match.any).returns(TEST_ERROR_MESSAGE);
                httpClient.request.callsArgWith(3, null, { statusCode: 300, body: EMPTY_RESPONSE_BODY });
                stubTestFunc.callsArgWith(0, null, { statusCode: 300, body: EMPTY_RESPONSE_BODY });

                // call
                askProfileSetupHelper.setupVendorId(TEST_CONFIG, (err, vendorId) => {
                    // verify
                    expect(err).eq(TEST_ERROR_MESSAGE);
                    expect(vendorId).eq(undefined);
                    done();
                });
            });

            afterEach(() => {
                sinon.restore();
            });
        });

        describe('# test _selectVendorId', () => {
            beforeEach(() => {
                sinon.stub(httpClient, 'request');
                sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
                stubTestFunc = sinon.stub(smapiClient, 'testFunc');
                AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, 'refresh_token');
            });

            it('| throws error: no vendorInfo present', (done) => {
                // setup
                httpClient.request.callsArgWith(3, null, { body: {} });
                stubTestFunc.callsArgWith(0, TEST_ERROR_MESSAGE, { body: {} });

                // call
                askProfileSetupHelper.setupVendorId(TEST_CONFIG, (err, vendorId) => {
                    // verify
                    expect(err).eq(messages.VENDOR_INFO_FETCH_ERROR);
                    expect(vendorId).eq(undefined);
                    done();
                });
            });

            it('| throws error: no vendorIDs present', (done) => {
                // setup
                httpClient.request.callsArgWith(3, null, { body: TEST_EMPTY_VENDOR_HTTP_RESPONSE_BODY });
                stubTestFunc.callsArgWith(0, TEST_ERROR_MESSAGE, { body: TEST_EMPTY_VENDOR_HTTP_RESPONSE_BODY });

                // call
                askProfileSetupHelper.setupVendorId(TEST_CONFIG, (err, vendorId) => {
                    // verify
                    expect(err).eq(messages.VENDOR_ID_CREATE_INSTRUCTIONS);
                    expect(vendorId).eq(undefined);
                    done();
                });
            });

            it('| returns valid vendorID: multiple vendorIDs present', (done) => {
                // setup
                sinon.stub(ui, 'chooseVendorId');
                ui.chooseVendorId.callsArgWith(2, null, TEST_VENDOR_ID_2);
                httpClient.request.callsArgWith(3, null, { body: TEST_MULTIPLE_VENDORS_HTTP_RESPONSE_BODY });
                stubTestFunc.callsArgWith(0, TEST_ERROR_MESSAGE, { body: TEST_MULTIPLE_VENDORS_HTTP_RESPONSE_BODY });

                // call
                askProfileSetupHelper.setupVendorId(TEST_CONFIG, (err, vendorId) => {
                    // verify
                    expect(err).eq(null);
                    expect(vendorId).eq(TEST_VENDOR_ID_2);
                    done();
                });
            });

            it('| throws error: vendorId selection component throws error', (done) => {
                // setup
                sinon.stub(ui, 'chooseVendorId');
                ui.chooseVendorId.callsArgWith(2, TEST_ERROR_MESSAGE, null);
                httpClient.request.callsArgWith(3, null, { body: TEST_MULTIPLE_VENDORS_HTTP_RESPONSE_BODY });
                stubTestFunc.callsArgWith(0, TEST_ERROR_MESSAGE, { body: TEST_MULTIPLE_VENDORS_HTTP_RESPONSE_BODY });

                // call
                askProfileSetupHelper.setupVendorId(TEST_CONFIG, (err, vendorId) => {
                    // verify
                    expect(err).eq(TEST_ERROR_MESSAGE);
                    expect(vendorId).eq(undefined);
                    done();
                });
            });

            afterEach(() => {
                sinon.restore();
            });
        });
    });
});
