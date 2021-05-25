import R from 'ramda';
import { URL } from 'url';
import queryString from 'querystring';
import addSeconds from 'date-fns/addSeconds';
import isAfter from 'date-fns/isAfter';
import parseISO from 'date-fns/parseISO';

import httpClient from '@src/clients/http-client';
import * as CONSTANTS from '@src/utils/constants';
import DynamicConfig from '@src/utils/dynamic-config';
import stringUtils from '@src/utils/string-utils';
import jsonView from '@src/view/json-view';
import CliError from '@src/exceptions/cli-error';

interface IConfig {
    tokenPath: string;
    tokenHost: any;
    redirectUri: string;
    clientId: string;
    clientConfirmation: any;
    doDebug: boolean;
    scope?: string;
    state?: number;
    authorizePath: string;
    authorizeHost: any;
};

export interface ILWAAuthCodeClient {
    doDebug: boolean;
    redirectUri: string;
    state?: number;
    scope?: string;
    clientId: any;
    clientConfirmation: any;
    authorizeHost: any;
    tokenHost: any;
};

export default class LWAAuthCodeClient {
    config: IConfig;

    constructor(config: ILWAAuthCodeClient) {
        this.config = this._handleDefaultLwaAuthCodeConfiguration(config);
    }

    /**
     * @param {String} authCode | used for fetching accessTokens
     * @param {Function} callback (err, accessToken)
     * @returns accessToken | Used for request validation in skill development process.
     */
    getAccessTokenUsingAuthCode(authCode: string, callback: Function) {
        const url = new URL(this.config.tokenPath, this.config.tokenHost);
        const body = {
            grant_type: 'authorization_code',
            redirect_uri: this.config.redirectUri,
            client_id: this.config.clientId,
            client_secret: this.config.clientConfirmation,
            code: authCode
        };
        const options = {
            url: `${url}`,
            method: 'POST',
            body,
            json: !!body
        };
        httpClient.request(options, 'GET_ACCESS_TOKEN', this.config.doDebug, (err?: Error, response?: any) => {
            if (err) {
                return callback(err);
            }
            const tokenBody = R.clone(response.body);
            if (tokenBody.error) {
                return callback(new CliError(tokenBody.error));
            }
            tokenBody.expires_at = this._getExpiresAt(tokenBody.expires_in).toISOString();
            callback(null, tokenBody);
        });
    }

    /**
     * @param {Object} token | accessToken of the profile being used currently.
     * @param {Function} callback (err, token)
     * @returns accessToken | a new access token.
     */
    refreshToken(token: any, callback: Function) {
        const url = new URL(this.config.tokenPath, this.config.tokenHost);
        const body = {
            grant_type: 'refresh_token',
            refresh_token: token.refresh_token,
            client_id: this.config.clientId,
            client_secret: this.config.clientConfirmation
        };
        const options = {
            url: `${url}`,
            method: 'POST',
            body,
            json: !!body
        };
        httpClient.request(options, 'GET_ACCESS_TOKEN_USING_REFRESH_TOKEN', this.config.doDebug, (err?: Error, response?: any) => {
            if (err) {
                return callback(err);
            }
            const responseErr = R.view(R.lensPath(['body', 'error']), response);
            if (stringUtils.isNonBlankString(responseErr)) {
                return callback(`Refresh LWA tokens failed, please run "ask configure" to manually update your tokens. Error: ${responseErr}.`);
            }
            const expiresIn = R.view(R.lensPath(['body', 'expires_in']), response);
            if (!expiresIn) {
                return callback(`Received invalid response body from LWA without "expires_in":\n${jsonView.toString(response.body)}`);
            }

            const tokenBody = R.clone(response.body);
            if (tokenBody.error) {
                return callback(new CliError(tokenBody.error));
            }
            tokenBody.expires_at = this._getExpiresAt(expiresIn).toISOString();
            callback(null, tokenBody);
        });
    }

    /**
     * @param {Object} token
     * @returns boolean | checks validity of a given token
     */
    isValidToken(token: any) {
        return !isAfter(new Date(), parseISO(token.expires_at));
    }

    /**
     * @returns {String} authorization code URL
     */
    generateAuthorizeUrl() {
        const queryParams: any = {
            response_type: 'code',
            client_id: this.config.clientId,
            state: this.config.state
        };
        if (stringUtils.isNonBlankString(this.config.scope)) {
            queryParams.scope = this.config.scope;
        }
        if (stringUtils.isNonBlankString(this.config.redirectUri)) {
            queryParams.redirect_uri = this.config.redirectUri;
        }
        const baseUrl = new URL(this.config.authorizePath, this.config.authorizeHost);
        return `${baseUrl}?${queryString.stringify(queryParams)}`;
    }

    /**
     * @param {Object} authConfig
     * @returns {Object} config | sets default values if some of the values are missing.
     * @private
     */
    _handleDefaultLwaAuthCodeConfiguration(authConfig: ILWAAuthCodeClient) {
        const { doDebug, redirectUri } = authConfig;
        const authorizePath = CONSTANTS.LWA.DEFAULT_AUTHORIZE_PATH;
        const tokenPath = CONSTANTS.LWA.DEFAULT_TOKEN_PATH;

        // Overwrite LWA options from Environmental Variable
        const state = authConfig.state || Date.now();
        const scope = authConfig.scope || CONSTANTS.LWA.DEFAULT_SCOPES;
        const clientId = authConfig.clientId || DynamicConfig.lwaClientId;
        const clientConfirmation = authConfig.clientConfirmation || DynamicConfig.lwaClientConfirmation;
        const authorizeHost = DynamicConfig.lwaAuthorizationHost;
        const tokenHost = DynamicConfig.lwaTokenHost;
        return { clientId, clientConfirmation, authorizeHost, tokenHost, authorizePath, tokenPath, scope, state, redirectUri, doDebug };
    }

    _getExpiresAt(expiresIn: string) {
        return addSeconds(new Date(), Number.parseInt(expiresIn, 10));
    }
};
