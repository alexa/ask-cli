import open from 'open';
import portscanner from 'portscanner';
import { URL, URLSearchParams } from 'url';
import { IncomingMessage, ServerResponse } from 'http';

import LWAAuthCodeClient from '@src/clients/lwa-auth-code-client';
import AppConfig from '@src/model/app-config';
import * as CONSTANTS from '@src/utils/constants';
import LocalHostServer from '@src/utils/local-host-server';
import stringUtils from '@src/utils/string-utils';
import Messenger from '@src/view/messenger';
import SpinnerView from '@src/view/spinner-view';

import * as messages from './messages';

const getAppConfig = () => AppConfig.getInstance() as AppConfig;

export interface AuthConfig {
    auth_client_type: 'LWA' | string;
    clientId: string;
    clientConfirmation: any;
    authorizeHost: any;
    tokenHost: string;
    scope: any;
    state: any;
    doDebug: boolean;
    redirectUri: string;
    config: any;
}

export default class AuthorizationController {
    private _authConfig: AuthConfig;
    private _oauthClient: LWAAuthCodeClient;

    /**
     * Constructor for AuthorizationController.
     * @param {Object} config | contains default scopes, default state, auth_client_type (LWA),
     * redirectUri, askProfile config file path, needBrowser, debug information. For more details,
     * see @src/commands/configure/helper.js
     */
    constructor(config: AuthConfig) {
        this._authConfig = config;
        this._oauthClient = this._getAuthClientInstance() as LWAAuthCodeClient;
    }

    /**
     * Generates Authorization URL.
     */
    getAuthorizeUrl() {
        return this._oauthClient.generateAuthorizeUrl();
    }

    /**
     * Retrieves access token.
     * @param {String} authCode | authorization code.
     * @param {Function} callback
     */
    getAccessTokenUsingAuthCode(authCode: string, callback: Function) {
        return this._oauthClient.getAccessTokenUsingAuthCode(authCode, (err: Error, accessToken: string) => callback(err, err == null ? accessToken : err));
    }

    /**
     * Refreshes token and sets up authorization param.
     * @param {String} profile | current profile in use.
     * @param {Function} callback
     */
    tokenRefreshAndRead(profile: string, callback: Function) {
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
                this._oauthClient.refreshToken({ refresh_token: askRefreshToken }, (err: Error, token: any) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, token.access_token);
                });
            } else if (isNonBlankAccessToken) {
                return callback(null, askAccessToken);
            }
        } else if (this._oauthClient.isValidToken(getAppConfig().getToken(profile))) {
            callback(null, getAppConfig().getToken(profile).access_token);
        } else {
            this._getRefreshTokenAndUpdateConfig(profile, getAppConfig().getToken(profile),
                (err: Error, token: any) => callback(err, err === null ? token : err));
        }
    }

    /**
     * @param {String} profile | profile in use currently.
     * @param {String} configFilePath | path for the config file.
     * @param {Function} callback
     * @private
     */
    _getRefreshTokenAndUpdateConfig(profile: string, token: any, callback: Function) {
        this._oauthClient.refreshToken(token, (err: Error, refreshedAccessToken: any) => {
            if (err) {
                return callback(err);
            }
            getAppConfig().setToken(profile, refreshedAccessToken);
            getAppConfig().write();
            callback(null, refreshedAccessToken.access_token);
        });
    }

    /**
     * Helper method to keep listening to LWA response.
     * @param {Function} callback
     */
    getTokensByListeningOnPort(callback: Function) {
        const PORT = CONSTANTS.LWA.LOCAL_PORT;
        this._oauthClient.config.redirectUri = `http://127.0.0.1:${PORT}/cb`;
        portscanner.checkPortStatus(PORT, (err, currentStatus) => {
            if (err) {
                return callback(err);
            }
            if (currentStatus !== 'closed') {
                return callback(messages.PORT_OCCUPIED_WARN_MESSAGE);
            }
            Messenger.getInstance().info(messages.AUTH_MESSAGE);

            setTimeout(() => {
                open(this._oauthClient.generateAuthorizeUrl());
            }, CONSTANTS.CONFIGURATION.OPEN_BROWSER_DELAY);

            this._listenResponseFromLWA(PORT, (error: Error, authCode: string) => {
                if (error) {
                    return callback(error);
                }
                this._oauthClient.getAccessTokenUsingAuthCode(authCode,
                    (accessTokenError: Error, accessToken: any) => callback(accessTokenError, accessTokenError == null ? accessToken : accessTokenError));
            });
        });
    }

    /**
     * Helper method to facilitate spinner view and handle clean up process.
     * @param {String} PORT | port to be listened on.
     * @param {Function} callback
     * @private
     */
    _listenResponseFromLWA(port: number, callback: Function) {
        const listenSpinner = new SpinnerView();
        const server = new LocalHostServer(port);
        server.create(serverCallback);
        server.listen(() => {
            listenSpinner.start(` Listening on http://localhost:${port}...`);
        });
        server.registerEvent('connection', (socket) => {
            socket.unref();
        });

        // type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;
        // import { IncomingMessage, ServerResponse } from 'http';

        function serverCallback(request: IncomingMessage, response: ServerResponse) {
            response.on('close', () => {
                request.socket.destroy();
            });
            listenSpinner.terminate();
            const requestUrl = request.url as string;
            const url = new URL(requestUrl);
            const params = new URLSearchParams(url.search);
            server.destroy();
            if (requestUrl.startsWith('/cb?code')) {
                response.end(messages.ASK_SIGN_IN_SUCCESS_MESSAGE);
                callback(null, params.get('code'));
            }
            if (requestUrl.startsWith('/cb?error')) {
                response.statusCode = 403;
                const errorMessage = `Error: ${params.get('error')}\nReason: ${params.get('error_description')}`;
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
    private _getAuthClientInstance() {
        if (this._authConfig.auth_client_type === 'LWA') {
            const { clientId, clientConfirmation, authorizeHost, tokenHost, scope, state, doDebug, redirectUri } = this._authConfig;
            return new LWAAuthCodeClient({ clientId, clientConfirmation, authorizeHost, tokenHost, scope, state, doDebug, redirectUri });
        }
    }
};
