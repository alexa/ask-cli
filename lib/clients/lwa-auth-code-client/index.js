const R = require('ramda');
const { URL } = require('url');
const queryString = require('querystring');
const addSeconds = require('date-fns/addSeconds');
const isAfter = require('date-fns/isAfter');
const parseISO = require('date-fns/parseISO');

const httpClient = require('@src/clients/http-client');
const CONSTANTS = require('@src/utils/constants');
const providerChainUtils = require('@src/utils/provider-chain-utils');
const stringUtils = require('@src/utils/string-utils');
const jsonView = require('@src/view/json-view');
const CliError = require('@src/exceptions/cli-error');

module.exports = class LWAAuthCodeClient {
    constructor(config) {
        this.config = this._handleDefaultLwaAuthCodeConfiguration(config);
    }

    /**
     * @param {String} authCode | used for fetching accessTokens
     * @param {Function} callback (err, accessToken)
     * @returns accessToken | Used for request validation in skill development process.
     */
    getAccessTokenUsingAuthCode(authCode, callback) {
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
        httpClient.request(options, 'GET_ACCESS_TOKEN', this.config.doDebug, (err, response) => {
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
    refreshToken(token, callback) {
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
        httpClient.request(options, 'GET_ACCESS_TOKEN_USING_REFRESH_TOKEN', this.config.doDebug, (err, response) => {
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
    isValidToken(token) {
        return !isAfter(new Date(), parseISO(token.expires_at));
    }

    /**
     * @returns {String} authorization code URL
     */
    generateAuthorizeUrl() {
        const queryParams = {
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
    _handleDefaultLwaAuthCodeConfiguration(authConfig) {
        const { doDebug, redirectUri } = authConfig;
        const authorizePath = CONSTANTS.LWA.DEFAULT_AUTHORIZE_PATH;
        const tokenPath = CONSTANTS.LWA.DEFAULT_TOKEN_PATH;

        // Overwrite LWA options from Environmental Variable
        const state = authConfig.state || Date.now();
        const scope = providerChainUtils.resolveProviderChain([authConfig.scope, CONSTANTS.LWA.DEFAULT_SCOPES]);
        const clientId = providerChainUtils.resolveProviderChain([authConfig.clientId, process.env.ASK_LWA_CLIENT_ID,
            CONSTANTS.LWA.CLI_INTERNAL_ONLY_LWA_CLIENT.CLIENT_ID]);
        const clientConfirmation = providerChainUtils.resolveProviderChain([authConfig.clientConfirmation, process.env.ASK_LWA_CLIENT_CONFIRMATION,
            CONSTANTS.LWA.CLI_INTERNAL_ONLY_LWA_CLIENT.CLIENT_CONFIRMATION]);
        const authorizeHost = providerChainUtils.resolveProviderChain([process.env.ASK_LWA_AUTHORIZE_HOST, CONSTANTS.LWA.DEFAULT_AUTHORIZE_HOST]);
        const tokenHost = providerChainUtils.resolveProviderChain([process.env.ASK_LWA_TOKEN_HOST, CONSTANTS.LWA.DEFAULT_TOKEN_HOST]);
        return { clientId, clientConfirmation, authorizeHost, tokenHost, authorizePath, tokenPath, scope, state, redirectUri, doDebug };
    }

    _getExpiresAt(expiresIn) {
        return addSeconds(new Date(), Number.parseInt(expiresIn, 10));
    }
};
