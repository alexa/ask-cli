const { expect } = require('chai');
const sinon = require('sinon');
const queryString = require('querystring');
const portscanner = require('portscanner');
const proxyquire = require('proxyquire');
const url = require('url');

const httpClient = require('@src/clients/http-client');
const LWAClient = require('@src/clients/lwa-auth-code-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const messages = require('@src/controllers/authorization-controller/messages');
const AppConfig = require('@src/model/app-config');
const CONSTANTS = require('@src/utils/constants');
const LocalHostServer = require('@src/utils/local-host-server');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');


describe('Controller test - Authorization controller test', () => {
    const DEFAULT_CLIENT_ID = CONSTANTS.LWA.CLI_INTERNAL_ONLY_LWA_CLIENT.CLIENT_ID;
    const DEFAULT_SCOPE = CONSTANTS.LWA.DEFAULT_SCOPES;
    const authorizePath = CONSTANTS.LWA.DEFAULT_AUTHORIZE_PATH;
    const authorizeHost = CONSTANTS.LWA.DEFAULT_AUTHORIZE_HOST;
    const TEST_TOKEN = 'testToken';
    const TEST_STATE = 'state';
    const TEST_PROFILE = 'testProfile';
    const TEST_ENVIRONMENT_PROFILE = CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
    const TEST_DO_DEBUG = false;
    const TEST_NEED_BROWSER = false;
    const TEST_ERROR_MESSAGE = 'errorMessage';
    const TEST_AUTH_CODE = 'authCode';
    const TEST_PORT = CONSTANTS.LWA.LOCAL_PORT;
    const TEST_ALREADY_EXPIRED_DATE = new Date();
    TEST_ALREADY_EXPIRED_DATE.setFullYear(TEST_ALREADY_EXPIRED_DATE.getFullYear() - 1);
    const TEST_ALREADY_EXPIRED_AT = TEST_ALREADY_EXPIRED_DATE.toISOString();
    const TEST_RESPONSE = {
        body: {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            expires_in: 3600,
            expires_at: TEST_ALREADY_EXPIRED_AT
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

            const authUrl = authorizationController.getAuthorizeUrl();
            // call and verify
            expect(authUrl).eq(uri);
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
                expect(accessToken.access_token).to.eq(TEST_RESPONSE.body.access_token);
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
            sinon.stub(httpClient, 'request');
        });

        afterEach(() => {
            sinon.restore();
            delete process.env.ASK_REFRESH_TOKEN;
            delete process.env.ASK_ACCESS_TOKEN;
        });

        describe('# returns valid token', () => {
            it('| non-environment profile, expired access token', (done) => {
                // setup
                getTokenStub.withArgs(TEST_PROFILE).returns(TEST_RESPONSE.body);
                sinon.stub(AuthorizationController.prototype, '_getRefreshTokenAndUpdateConfig')
                    .callsArgWith(2, null, VALID_ACCESS_TOKEN.access_token);

                // call
                authorizationController.tokenRefreshAndRead(TEST_PROFILE, (error, accessToken) => {
                    // verify
                    expect(error).eq(null);
                    expect(accessToken).to.equal(VALID_ACCESS_TOKEN.access_token);
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
                sinon.stub(AuthorizationController.prototype, '_getRefreshTokenAndUpdateConfig').callsArgWith(2, null, VALID_ACCESS_TOKEN);
                httpClient.request.callsArgWith(3, null, TEST_RESPONSE);

                // call
                authorizationController.tokenRefreshAndRead(TEST_ENVIRONMENT_PROFILE, (error, accessToken) => {
                    // verify
                    expect(error).eq(null);
                    expect(accessToken).to.deep.eq(TEST_RESPONSE.body.access_token);
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
            it('| non-environment profile, expired access token, _getRefreshTokenAndUpdateConfig fails', (done) => {
                // setup
                getTokenStub.withArgs(TEST_PROFILE).returns(TEST_RESPONSE.body);
                sinon.stub(AuthorizationController.prototype, '_getRefreshTokenAndUpdateConfig').callsArgWith(2, TEST_ERROR_MESSAGE);

                // call
                authorizationController.tokenRefreshAndRead(TEST_PROFILE, (error, response) => {
                    // verify
                    expect(error).eq(TEST_ERROR_MESSAGE);
                    expect(response).eq(TEST_ERROR_MESSAGE);
                    done();
                });
            });

            it('| environment profile, valid refresh token, refreshing token fails', (done) => {
                // setup
                process.env.ASK_REFRESH_TOKEN = TEST_ENV_REFRESH_TOKEN;
                sinon.stub(AuthorizationController.prototype, '_getRefreshTokenAndUpdateConfig').callsArgWith(2, null, VALID_ACCESS_TOKEN);
                httpClient.request.callsArgWith(3, TEST_ERROR_MESSAGE);

                // call
                authorizationController.tokenRefreshAndRead(TEST_ENVIRONMENT_PROFILE, (error, accessToken) => {
                    // verify
                    expect(error).eq(TEST_ERROR_MESSAGE);
                    expect(accessToken).eq(undefined);
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
            sinon.stub(httpClient, 'request');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| returns valid access token and updates config', (done) => {
            // setup
            httpClient.request.callsArgWith(3, null, TEST_RESPONSE);

            // call
            authorizationController._getRefreshTokenAndUpdateConfig(TEST_PROFILE, TEST_TOKEN, (error, accessToken) => {
                // verify
                expect(setTokenStub.args[0][0]).eq(TEST_PROFILE);
                expect(setTokenStub.args[0][1].access_token).to.eq(TEST_RESPONSE.body.access_token);
                expect(setTokenStub.args[0][1].refresh_token).to.eq(TEST_RESPONSE.body.refresh_token);
                expect(setTokenStub.args[0][1].expires_in).to.eq(TEST_RESPONSE.body.expires_in);
                expect(error).eq(null);
                expect(accessToken).to.deep.eq(TEST_RESPONSE.body.access_token);
                done();
            });
        });

        it('| returns error', (done) => {
            // setup
            httpClient.request.callsArgWith(3, TEST_ERROR_MESSAGE);

            // call
            authorizationController._getRefreshTokenAndUpdateConfig(TEST_PROFILE, TEST_TOKEN, (error, response) => {
                // verify
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(response).eq(undefined);
                done();
            });
        });
    });

    describe('# test getTokensByListeningOnPort', () => {
        let proxyHelper, openStub, infoStub;

        beforeEach(() => {
            sinon.stub(httpClient, 'request');
            sinon.stub(portscanner, 'checkPortStatus');
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            openStub = sinon.stub();
            proxyHelper = proxyquire('@src/controllers/authorization-controller', {
                open: openStub
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
                expect(accessToken.access_token).to.eq(TEST_RESPONSE.body.access_token);
                expect(accessToken.refresh_token).to.eq(TEST_RESPONSE.body.refresh_token);
                expect(accessToken.expires_in).to.eq(TEST_RESPONSE.body.expires_in);
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
            const createStub = sinon.stub(LocalHostServer.prototype, 'create');
            const listenStub = sinon.stub(LocalHostServer.prototype, 'listen').callsArgWith(0);
            const spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');
            const registerEventStub = sinon.stub(LocalHostServer.prototype, 'registerEvent').callsArgWith(1, socket);

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
            sinon.stub(LocalHostServer.prototype, 'listen');
            sinon.stub(LocalHostServer.prototype, 'registerEvent');
            const requestDestroyStub = sinon.stub();
            const request = {
                url: '/cb?error',
                socket: {
                    destroy: requestDestroyStub
                }
            };
            const endStub = sinon.stub();
            const response = {
                on: sinon.stub().callsArgWith(1),
                end: endStub
            };
            const spinnerTerminateStub = sinon.stub(SpinnerView.prototype, 'terminate');
            const requestQuery = {
                query: {
                    error: 'error',
                    error_description: 'errorDescription'
                }
            };
            sinon.stub(url, 'parse').returns(requestQuery);
            const serverDestroyStub = sinon.stub(LocalHostServer.prototype, 'destroy');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, request, response);
            // call
            authorizationController._listenResponseFromLWA(TEST_PORT, (err) => {
                // verify
                const EXPECTED_ERR_MESSAGE = `Error: ${requestQuery.query.error}\nReason: ${requestQuery.query.error_description}`;
                expect(spinnerTerminateStub.callCount).eq(1);
                expect(serverDestroyStub.callCount).eq(1);
                expect(endStub.callCount).eq(1);
                expect(endStub.args[0][0].includes(EXPECTED_ERR_MESSAGE)).equal(true);
                expect(err).eq(EXPECTED_ERR_MESSAGE);
                done();
            });
        });

        it('| local server returns valid authCode', (done) => {
            // setup
            sinon.stub(LocalHostServer.prototype, 'listen');
            sinon.stub(LocalHostServer.prototype, 'registerEvent');
            const requestDestroyStub = sinon.stub();
            const request = {
                url: '/cb?code',
                socket: {
                    destroy: requestDestroyStub
                }
            };
            const endStub = sinon.stub();
            const response = {
                on: sinon.stub().callsArgWith(1),
                end: endStub
            };
            sinon.stub(SpinnerView.prototype, 'terminate');
            const requestQuery = {
                query: {
                    code: TEST_AUTH_CODE
                }
            };
            sinon.stub(url, 'parse').returns(requestQuery);
            sinon.stub(LocalHostServer.prototype, 'destroy');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, request, response);

            // call
            authorizationController._listenResponseFromLWA(TEST_PORT, (err, authCode) => {
                // verify
                expect(endStub.callCount).eq(1);
                expect(endStub.args[0][0]).eq(messages.ASK_SIGN_IN_SUCCESS_MESSAGE);
                expect(err).eq(null);
                expect(authCode).eq(TEST_AUTH_CODE);
                done();
            });
        });
    });
});
