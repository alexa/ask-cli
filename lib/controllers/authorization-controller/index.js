const open = require('open');
const portscanner = require('portscanner');
const url = require('url');

const LWAAuthCodeClient = require('@src/clients/lwa-auth-code-client');
const AppConfig = require('@src/model/app-config');
const CONSTANTS = require('@src/utils/constants');
const LocalHostServer = require('@src/utils/local-host-server');
const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');

const messages = require('./messages');

module.exports = class AuthorizationController {
    /**
     * Constructor for AuthorizationController.
     * @param {Object} config | contains default scopes, default state, auth_client_type (LWA),
     * redirectUri, askProfile config file path, needBrowser, debug information. For more details,
     * see @src/commands/configure/helper.js
     */
    constructor(config) {
        this.authConfig = config;
        this.oauthClient = this._getAuthClientInstance();
    }

    /**
     * Generates Authorization URL.
     */
    getAuthorizeUrl() {
        return this.oauthClient.generateAuthorizeUrl();
    }

    /**
     * Retrieves access token.
     * @param {String} authCode | authorization code.
     * @param {Function} callback
     */
    getAccessTokenUsingAuthCode(authCode, callback) {
        return this.oauthClient.getAccessTokenUsingAuthCode(authCode, (err, accessToken) => callback(err, err == null ? accessToken : err));
    }

    /**
     * Refreshes token and sets up authorization param.
     * @param {String} profile | current profile in use.
     * @param {Function} callback
     */
    tokenRefreshAndRead(profile, callback) {
        if (profile === CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
            const askRefreshToken = process.env.ASK_REFRESH_TOKEN;
            const askAccessToken = process.env.ASK_ACCESS_TOKEN;

            // '!== undefined' check is required because environment variables return values as strings instead of objects.
            const isNonBlankRefreshToken = stringUtils.isNonBlankString(askRefreshToken) && askRefreshToken !== 'undefined';
            const isNonBlankAccessToken = stringUtils.isNonBlankString(askAccessToken) && askAccessToken !== 'undefined';
            if (!isNonBlankRefreshToken && !isNonBlankAccessToken) {
                return callback(messages.ASK_ENV_VARIABLES_ERROR_MESSAGE);
            }
            if (isNonBlankRefreshToken) {
                this.oauthClient.refreshToken({ refresh_token: askRefreshToken }, (err, token) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, token.access_token);
                });
            } else if (isNonBlankAccessToken) {
                return callback(null, askAccessToken);
            }
        } else if (this.oauthClient.isValidToken(AppConfig.getInstance().getToken(profile))) {
            callback(null, AppConfig.getInstance().getToken(profile).access_token);
        } else {
            this._getRefreshTokenAndUpdateConfig(profile, AppConfig.getInstance().getToken(profile),
                (err, token) => callback(err, err === null ? token : err));
        }
    }

    /**
     * @param {String} profile | profile in use currently.
     * @param {String} configFilePath | path for the config file.
     * @param {Function} callback
     * @private
     */
    _getRefreshTokenAndUpdateConfig(profile, token, callback) {
        this.oauthClient.refreshToken(token, (err, refreshedAccessToken) => {
            if (err) {
                return callback(err);
            }
            AppConfig.getInstance().setToken(profile, refreshedAccessToken);
            AppConfig.getInstance().write();
            callback(null, refreshedAccessToken.access_token);
        });
    }

    /**
     * Helper method to keep listening to LWA response.
     * @param {Function} callback
     */
    getTokensByListeningOnPort(callback) {
        const PORT = CONSTANTS.LWA.LOCAL_PORT;
        this.oauthClient.config.redirectUri = `http://127.0.0.1:${PORT}/cb`;
        portscanner.checkPortStatus(PORT, (err, currentStatus) => {
            if (err) {
                return callback(err);
            }
            if (currentStatus !== 'closed') {
                return callback(messages.PORT_OCCUPIED_WARN_MESSAGE);
            }
            Messenger.getInstance().info(messages.AUTH_MESSAGE);

            setTimeout(() => {
                open(this.oauthClient.generateAuthorizeUrl());
            }, CONSTANTS.CONFIGURATION.OPEN_BROWSER_DELAY);

            this._listenResponseFromLWA(PORT, (error, authCode) => {
                if (error) {
                    return callback(error);
                }
                this.oauthClient.getAccessTokenUsingAuthCode(authCode,
                    (accessTokenError, accessToken) => callback(accessTokenError, accessTokenError == null ? accessToken : accessTokenError));
            });
        });
    }

    /**
     * Helper method to facilitate spinner view and handle clean up process.
     * @param {String} PORT | port to be listened on.
     * @param {Function} callback
     * @private
     */
    _listenResponseFromLWA(PORT, callback) {
        const listenSpinner = new SpinnerView();
        const server = new LocalHostServer(PORT);
        server.create(serverCallback);
        server.listen(() => {
            listenSpinner.start(` Listening on http://localhost:${PORT}...`);
        });
        server.registerEvent('connection', (socket) => {
            socket.unref();
        });

        function serverCallback(request, response) {
            response.on('close', () => {
                request.socket.destroy();
            });
            listenSpinner.terminate();
            const requestUrl = request.url;
            const requestQuery = url.parse(requestUrl, true).query;
            server.destroy();
            if (requestUrl.startsWith('/cb?code')) {
                response.end(messages.ASK_SIGN_IN_SUCCESS_MESSAGE);
                callback(null, requestQuery.code);
            }
            if (requestUrl.startsWith('/cb?error')) {
                response.statusCode = 403;
                const errorMessage = `Error: ${requestQuery.error}\nReason: ${requestQuery.error_description}`;
                response.end(messages.ASK_SIGN_IN_FAILURE_MESSAGE(errorMessage));
                callback(errorMessage);
            }
        }
    }

    /**
     * Factory method to facilitate substitution of other OAuth2 clients.
     * @returns LWA client object.
     * @private
     */
    _getAuthClientInstance() {
        if (this.authConfig.auth_client_type === 'LWA') {
            const { clientId, clientConfirmation, authorizeHost, tokenHost, scope, state, doDebug, redirectUri } = this.authConfig;
            return new LWAAuthCodeClient({ clientId, clientConfirmation, authorizeHost, tokenHost, scope, state, doDebug, redirectUri });
        }
    }
};
