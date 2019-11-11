const { expect } = require('chai');
const sinon = require('sinon');
const queryString = require('querystring');
const portscanner = require('portscanner');
const proxyquire = require('proxyquire');

const httpClient = require('@src/clients/http-client');
const LWAClient = require('@src/clients/lwa-auth-code-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const messages = require('@src/controllers/authorization-controller/messages');
const AppConfig = require('@src/model/app-config');
const CONSTANTS = require('@src/utils/constants');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');
const LocalHostServer = require('@src/controllers/authorization-controller/server');

describe('Controller test - Authorization controller test', () => {
    const DEFAULT_CLIENT_ID = CONSTANTS.LWA.CLI_INTERNAL_ONLY_LWA_CLIENT.CLIENT_ID;
    const DEFAULT_SCOPE = CONSTANTS.LWA.DEFAULT_SCOPES;
    const authorizePath = CONSTANTS.LWA.DEFAULT_AUTHORIZE_PATH;
    const authorizeHost = CONSTANTS.LWA.DEFAULT_AUTHORIZE_HOST;
    const TEST_STATE = 'state';
    const TEST_PROFILE = 'testProfile';
    const TEST_ENVIRONMENT_PROFILE = CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
    const TEST_DO_DEBUG = false;
    const TEST_NEED_BROWSER = false;
    const TEST_ERROR_MESSAGE = 'errorMessage';
    const TEST_AUTH_CODE = 'authCode';
    const TEST_PORT = CONSTANTS.LWA.LOCAL_PORT;
    const TEST_RESPONSE = {
        body: {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            expires_in: 3600,
            expires_at: new Date('05 October 2011 14:48 UTC').toISOString()
        }
    };
    const currentDatePlusHalfAnHour = new Date(new Date(Date.now()).getTime() + (0.5 * 60 * 60 * 1000)).toISOString();
    const VALID_ACCESS_TOKEN = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: currentDatePlusHalfAnHour
    };
    const TEST_CONFIG = {
        askProfile: TEST_PROFILE,
        needBrowser: TEST_NEED_BROWSER,
        doDebug: TEST_DO_DEBUG,
        auth_client_type: 'LWA',
        state: TEST_STATE,
    };

    describe('# test _getAuthClientInstance', () => {
        it('| returns undefined', () => {
            // setup
            const authorizationController = new AuthorizationController({ auth_client_type: 'UNKNOWN' });

            // call and verify
            expect(authorizationController.oauthClient).eq(undefined);
        });
    });

    describe('# test getAuthorizeUrl', () => {
        it('| returns valid authorization url', () => {
            // setup
            const authorizationController = new AuthorizationController(TEST_CONFIG);
            const queryParams = {
                response_type: 'code',
                client_id: DEFAULT_CLIENT_ID,
                state: TEST_STATE,
                scope: DEFAULT_SCOPE
            };
            const uri = `${authorizeHost}${authorizePath}?${queryString.stringify(queryParams)}`;

            const url = authorizationController.getAuthorizeUrl();
            // call and verify
            expect(url).eq(uri);
        });
    });

    describe('# test getAccessTokenUsingAuthCode', () => {
        beforeEach(() => {
            sinon.stub(httpClient, 'request');
        });

        it('| returns valid access token', (done) => {
            // setup
            httpClient.request.callsArgWith(3, null, TEST_RESPONSE);
            const authorizationController = new AuthorizationController(TEST_CONFIG);

            // call
            authorizationController.getAccessTokenUsingAuthCode(TEST_AUTH_CODE, (error, accessToken) => {
                // verify
                expect(error).eq(null);
                expect(accessToken).to.deep.eq(TEST_RESPONSE.body);
                done();
            });
        });

        it('| returns error', (done) => {
            // setup
            httpClient.request.callsArgWith(3, TEST_ERROR_MESSAGE);
            const authorizationController = new AuthorizationController(TEST_CONFIG);

            // call
            authorizationController.getAccessTokenUsingAuthCode(TEST_AUTH_CODE, (error, response) => {
                // verify
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(response).eq(TEST_ERROR_MESSAGE);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# test tokenRefreshAndRead', () => {
        let getTokenStub;
        const TEST_ENV_ACCESS_TOKEN = 'envAccessToken';
        const TEST_ENV_REFRESH_TOKEN = 'envRefreshToken';
        const authorizationController = new AuthorizationController(TEST_CONFIG);
        beforeEach(() => {
            getTokenStub = sinon.stub();
            sinon.stub(AppConfig, 'getInstance').returns({
                getToken: getTokenStub
            });
        });

        describe('# returns valid token', () => {
            afterEach(() => {
                sinon.restore();
                delete process.env.ASK_REFRESH_TOKEN;
                delete process.env.ASK_ACCESS_TOKEN;
            });

            it('| non-environment profile, expired access token', (done) => {
                // setup
                sinon.stub(AuthorizationController.prototype, '_getRefreshTokenAndUpdateConfig').callsArgWith(1, null, VALID_ACCESS_TOKEN);
                getTokenStub.withArgs(TEST_PROFILE).returns(TEST_RESPONSE.body);

                // call
                authorizationController.tokenRefreshAndRead(TEST_PROFILE, (error, accessToken) => {
                    // verify
                    expect(error).eq(null);
                    expect(accessToken).to.deep.eq(VALID_ACCESS_TOKEN);
                    done();
                });
            });

            it('| non-environment profile, valid access token', (done) => {
                // setup
                getTokenStub.withArgs(TEST_PROFILE).returns(VALID_ACCESS_TOKEN);

                // call
                authorizationController.tokenRefreshAndRead(TEST_PROFILE, (error, accessToken) => {
                    // verify
                    expect(error).eq(null);
                    expect(accessToken).to.deep.eq(VALID_ACCESS_TOKEN.access_token);
                    done();
                });
            });

            it('| environment profile, valid refresh token', (done) => {
                // setup
                process.env.ASK_REFRESH_TOKEN = TEST_ENV_REFRESH_TOKEN;
                sinon.stub(AuthorizationController.prototype, '_getRefreshTokenAndUpdateConfig').callsArgWith(1, null, VALID_ACCESS_TOKEN);

                // call
                authorizationController.tokenRefreshAndRead(TEST_ENVIRONMENT_PROFILE, (error, accessToken) => {
                    // verify
                    expect(error).eq(null);
                    expect(accessToken).to.deep.eq(VALID_ACCESS_TOKEN);
                    done();
                });
            });

            it('| environment profile, invalid refresh token, valid access token', (done) => {
                // setup
                process.env.ASK_ACCESS_TOKEN = TEST_ENV_ACCESS_TOKEN;
                // call
                authorizationController.tokenRefreshAndRead(TEST_ENVIRONMENT_PROFILE, (error, accessToken) => {
                    // verify
                    expect(error).eq(null);
                    expect(accessToken).to.deep.eq(TEST_ENV_ACCESS_TOKEN);
                    done();
                });
            });
        });

        describe('# returns error', () => {
            afterEach(() => {
                sinon.restore();
                delete process.env.ASK_REFRESH_TOKEN;
                delete process.env.ASK_ACCESS_TOKEN;
            });

            it('| non-environment profile, expired access token, _getRefreshTokenAndUpdateConfig fails', (done) => {
                // setup
                sinon.stub(AuthorizationController.prototype, '_getRefreshTokenAndUpdateConfig').callsArgWith(1, TEST_ERROR_MESSAGE);
                getTokenStub.withArgs(TEST_PROFILE).returns(TEST_RESPONSE.body);

                // call
                authorizationController.tokenRefreshAndRead(TEST_PROFILE, (error, response) => {
                    // verify
                    expect(error).eq(TEST_ERROR_MESSAGE);
                    expect(response).eq(TEST_ERROR_MESSAGE);
                    done();
                });
            });

            it('| environment profile, valid refresh token, _getRefreshTokenAndUpdateConfig fails', (done) => {
                // setup
                process.env.ASK_REFRESH_TOKEN = TEST_ENV_REFRESH_TOKEN;
                sinon.stub(AuthorizationController.prototype, '_getRefreshTokenAndUpdateConfig').callsArgWith(1, TEST_ERROR_MESSAGE);

                // call
                authorizationController.tokenRefreshAndRead(TEST_ENVIRONMENT_PROFILE, (error, response) => {
                    // verify
                    expect(error).eq(TEST_ERROR_MESSAGE);
                    expect(response).to.deep.eq(TEST_ERROR_MESSAGE);
                    done();
                });
            });

            it('| environment profile, invalid refresh token, invalid access token', (done) => {
                // call
                authorizationController.tokenRefreshAndRead(TEST_ENVIRONMENT_PROFILE, (error, accessToken) => {
                    // verify
                    expect(error).eq(messages.ASK_ENV_VARIABLES_ERROR_MESSAGE);
                    expect(accessToken).eq(undefined);
                    done();
                });
            });
        });
    });

    describe('# test _getRefreshTokenAndUpdateConfig', () => {
        let setTokenStub, writeStub;
        const authorizationController = new AuthorizationController(TEST_CONFIG);

        beforeEach(() => {
            setTokenStub = sinon.stub();
            writeStub = sinon.stub();
            sinon.stub(AppConfig, 'getInstance').returns({
                setToken: setTokenStub,
                write: writeStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| returns valid access token and updates config', (done) => {
            // setup
            sinon.stub(AuthorizationController.prototype, '_getRefreshToken').callsArgWith(1, null, TEST_RESPONSE.body);

            // call
            authorizationController._getRefreshTokenAndUpdateConfig(TEST_PROFILE, (error, accessToken) => {
                // verify
                expect(setTokenStub.args[0][0]).eq(TEST_PROFILE);
                expect(setTokenStub.args[0][1]).to.deep.eq(TEST_RESPONSE.body);
                expect(error).eq(null);
                expect(accessToken).to.deep.eq(TEST_RESPONSE.body.access_token);
                done();
            });
        });

        it('| returns error', (done) => {
            // setup
            sinon.stub(AuthorizationController.prototype, '_getRefreshToken').callsArgWith(1, TEST_ERROR_MESSAGE);

            // call
            authorizationController._getRefreshTokenAndUpdateConfig(TEST_PROFILE, (error, response) => {
                // verify
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(response).eq(undefined);
                done();
            });
        });
    });

    describe('# test _getRefreshToken', () => {
        let getTokenStub;
        const authorizationController = new AuthorizationController(TEST_CONFIG);

        beforeEach(() => {
            sinon.stub(httpClient, 'request');
            getTokenStub = sinon.stub();
            sinon.stub(AppConfig, 'getInstance').returns({
                getToken: getTokenStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| returns valid access token', (done) => {
            // setup
            httpClient.request.callsArgWith(3, null, TEST_RESPONSE);
            getTokenStub.withArgs(TEST_PROFILE).returns(TEST_RESPONSE.body);

            // call
            authorizationController._getRefreshToken(TEST_PROFILE, (error, accessToken) => {
                // verify
                expect(error).eq(null);
                expect(accessToken).to.deep.eq(TEST_RESPONSE.body);
                done();
            });
        });

        it('| returns error', (done) => {
            // setup
            httpClient.request.callsArgWith(3, TEST_ERROR_MESSAGE);
            getTokenStub.withArgs(TEST_PROFILE).returns(TEST_RESPONSE.body);

            // call
            authorizationController._getRefreshToken(TEST_PROFILE, (error, response) => {
                // verify
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(response).eq(TEST_ERROR_MESSAGE);
                done();
            });
        });
    });

    describe('# test getTokensByListeningOnPort', () => {
        let proxyHelper, opnStub, infoStub;

        beforeEach(() => {
            sinon.stub(httpClient, 'request');
            sinon.stub(portscanner, 'checkPortStatus');
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            opnStub = sinon.stub();
            proxyHelper = proxyquire('@src/controllers/authorization-controller', {
                opn: opnStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| returns error, from postScanner library', (done) => {
            // setup
            const authorizationController = new AuthorizationController(TEST_CONFIG);
            portscanner.checkPortStatus.callsArgWith(1, TEST_ERROR_MESSAGE);

            // call
            authorizationController.getTokensByListeningOnPort((error, response) => {
                // verify
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(response).eq(undefined);
                done();
            });
        });

        it('| returns error, port is open', (done) => {
            // setup
            const authorizationController = new AuthorizationController(TEST_CONFIG);
            portscanner.checkPortStatus.callsArgWith(1, null, 'open');

            // call
            authorizationController.getTokensByListeningOnPort((error, response) => {
                // verify
                expect(error).eq(messages.PORT_OCCUPIED_WARN_MESSAGE);
                expect(response).eq(undefined);
                done();
            });
        });

        it('| returns error, port is open but listening response on port fails', (done) => {
            // setup
            sinon.stub(proxyHelper.prototype, '_listenResponseFromLWA').callsArgWith(1, TEST_ERROR_MESSAGE);
            portscanner.checkPortStatus.callsArgWith(1, null, 'closed');
            proxyHelper.prototype.oauthClient = new LWAClient(TEST_CONFIG);
            // call
            proxyHelper.prototype.getTokensByListeningOnPort((error, response) => {
                // verify
                expect(infoStub.args[0][0]).eq(messages.AUTH_MESSAGE);
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(response).eq(undefined);
                done();
            });
        });

        it('| returns error, port is open but LWA client getAccessToken fails', (done) => {
            // setup
            sinon.stub(proxyHelper.prototype, '_listenResponseFromLWA').callsArgWith(1, null, TEST_AUTH_CODE);
            portscanner.checkPortStatus.callsArgWith(1, null, 'closed');
            proxyHelper.prototype.oauthClient = new LWAClient(TEST_CONFIG);
            httpClient.request.callsArgWith(3, TEST_ERROR_MESSAGE);
            // call
            proxyHelper.prototype.getTokensByListeningOnPort((error, response) => {
                // verify
                expect(infoStub.args[0][0]).eq(messages.AUTH_MESSAGE);
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(response).eq(TEST_ERROR_MESSAGE);
                done();
            });
        });

        it('| returns valid token', (done) => {
            // setup
            sinon.stub(proxyHelper.prototype, '_listenResponseFromLWA').callsArgWith(1, null, TEST_AUTH_CODE);
            portscanner.checkPortStatus.callsArgWith(1, null, 'closed');
            proxyHelper.prototype.oauthClient = new LWAClient(TEST_CONFIG);
            httpClient.request.callsArgWith(3, null, TEST_RESPONSE);
            // call
            proxyHelper.prototype.getTokensByListeningOnPort((error, accessToken) => {
                // verify
                expect(infoStub.args[0][0]).eq(messages.AUTH_MESSAGE);
                expect(error).eq(null);
                expect(accessToken).eq(TEST_RESPONSE.body);
                done();
            });
        });
    });

    describe('# test _listenResponseFromLWA', () => {
        const authorizationController = new AuthorizationController(TEST_CONFIG);

        afterEach(() => {
            sinon.restore();
        });

        it('| should create a server and start spinner to indicate listening on port', () => {
            // setup
            const socket = {
                unref: () => {}
            };
            const spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');
            const listenStub = sinon.stub(LocalHostServer.prototype, 'listen').callsArgWith(0);
            const registerEventStub = sinon.stub(LocalHostServer.prototype, 'registerEvent').callsArgWith(1, socket);
            const createStub = sinon.stub(LocalHostServer.prototype, 'create');

            // call
            authorizationController._listenResponseFromLWA(TEST_PORT, () => {});

            // verify
            expect(registerEventStub.callCount).eq(1);
            expect(spinnerStartStub.args[0][0]).eq(` Listening on http://localhost:${TEST_PORT}...`);
            expect(spinnerStartStub.callCount).eq(1);
            expect(listenStub.callCount).eq(1);
            expect(createStub.callCount).eq(1);
        });

        it('| local host server returns error', (done) => {
            // setup
            const spinnerTerminateStub = sinon.stub(SpinnerView.prototype, 'terminate');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, TEST_ERROR_MESSAGE);

            // call
            authorizationController._listenResponseFromLWA(TEST_PORT, (err, authCode) => {
                // verify
                expect(spinnerTerminateStub.callCount).eq(1);
                expect(err).eq(TEST_ERROR_MESSAGE);
                expect(authCode).eq(undefined);
                done();
            });
        });

        it('| local server returns valid authCode', (done) => {
            // setup
            const spinnerTerminateStub = sinon.stub(SpinnerView.prototype, 'terminate');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, null, TEST_AUTH_CODE);

            // call
            authorizationController._listenResponseFromLWA(TEST_PORT, (err, authCode) => {
                // verify
                expect(spinnerTerminateStub.callCount).eq(1);
                expect(err).eq(null);
                expect(authCode).eq(TEST_AUTH_CODE);
                done();
            });
        });
    });
});
