const R = require('ramda');
const async = require('async');
const querystring = require('querystring');
const AuthorizationController = require('@src/controllers/authorization-controller');
const httpClient = require('@src/clients/http-client');
const providerChainUtils = require('@src/utils/provider-chain-utils');
const CONSTANTS = require('@src/utils/constants');

const accountLinkingApi = require('./resources/account-linking');
const catalogApi = require('./resources/catalog');
const historyApi = require('./resources/history');
const ispApi = require('./resources/isp');
const manifestApi = require('./resources/manifest');
const interactionModelApi = require('./resources/interaction-model');
const privateSkillApi = require('./resources/private-skill');
const skillPackageApi = require('./resources/skill-package');
const skillApi = require('./resources/skill');
const testApi = require('./resources/test');
const vendorApi = require('./resources/vendor');
const evaluationsApi = require('./resources/evaluations');
const alexaHostedApi = require('./resources/alexa-hosted');
const betaTestApi = require('./resources/beta-test');
const publishingApi = require('./resources/publishing');
const taskApi = require('./resources/task');

const JSON_PROPERTIES = ['_links'];

/**
 * Class for Alexa Skill Management API Service (SMAPI) client
 */
module.exports = class SmapiClient {
    /**
     * Constructor for SmapiClient with "profile" for authorization and "doDebug" for client setting
     * @param {object} configuration | profile
     *                               | doDebug
     */
    constructor(configuration) {
        this.profile = configuration.profile;
        this.doDebug = configuration.doDebug;
        this._smapiRequest = this._smapiRequest.bind(this);
        this.smapiRedirectRequestWithUrl = this.smapiRedirectRequestWithUrl.bind(this);
        this.listWithAutoPagination = this.listWithAutoPagination.bind(this);

        this.skill = skillApi(this._smapiRequest);
        this.skill.manifest = manifestApi(this._smapiRequest);
        this.skill.interactionModel = interactionModelApi(this._smapiRequest);
        this.skill.accountLinking = accountLinkingApi(this._smapiRequest);
        this.skill.privateSkill = privateSkillApi(this._smapiRequest);
        this.skill.history = historyApi(this._smapiRequest);
        this.skill.test = testApi(this._smapiRequest);
        this.skill.evaluations = evaluationsApi(this._smapiRequest);
        this.skill.alexaHosted = alexaHostedApi(this._smapiRequest);
        this.skill.betaTest = betaTestApi(this._smapiRequest);
        this.skill.publishing = publishingApi(this._smapiRequest);
        this.skillPackage = skillPackageApi(this._smapiRequest);
        this.vendor = vendorApi(this._smapiRequest);
        this.isp = ispApi(this._smapiRequest);
        this.catalog = catalogApi(this._smapiRequest);
        this.task = taskApi(this._smapiRequest);
    }

    /**
     * Method to handle response redirect urls sent by SMAPI
     * @param {string} url
     * @param {function} callback
     */
    smapiRedirectRequestWithUrl(url, callback) {
        const EMPTY_HEADERS = {};
        const method = CONSTANTS.HTTP_REQUEST.VERB.GET;
        const NULL_PAYLOAD = null;
        const requestOptions = {
            url,
            method,
            headers: EMPTY_HEADERS,
            body: NULL_PAYLOAD,
        };
        const authorizationController = new AuthorizationController({
            auth_client_type: 'LWA',
            doDebug: this.doDebug
        });
        authorizationController.tokenRefreshAndRead(this.profile, (tokenErr, token) => {
            if (tokenErr) {
                return callback(tokenErr);
            }
            requestOptions.headers.authorization = token;
            httpClient.request(requestOptions, 'REDIRECT_URL', this.doDebug, (reqErr, reqResponse) => {
                if (reqErr) {
                    return callback(reqErr);
                }
                _normalizeSmapiResponse(reqResponse, (handleErr, smapiResponse) => {
                    callback(handleErr, handleErr ? null : smapiResponse);
                });
            });
        });
    }

    /**
     * The SMAPI specific function to extract list results by traversing all pages and return aggregated list results.
     * @param {Array} callApiTrack Array to represent the target SMAPI client API request
     * @param {Array} callArgv Array of the input arguements for the SMAPI API request
     * @param {String} responseAccessor Name/type of listed element
     * @param {Function} responseHandle Handle to extract list result in each page. Return { nextToken, listResult } from each response.
     * @param {Function} callback (err, aggregatedListResult)
     */
    listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, callback) {
        const result = {};
        result[responseAccessor] = [];
        const queryParams = {
            maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
        };
        const smapiMethod = R.path(callApiTrack, this);

        async.doWhilst(
            (loopCallback) => {
                smapiMethod(...callArgv, queryParams, (err, res) => {
                    if (err) {
                        return loopCallback(err, null);
                    }
                    if (res.statusCode >= 300) {
                        // TODO stringify the body
                        return loopCallback(res.body, null);
                    }
                    const parseResult = responseHandle(res);
                    queryParams.nextToken = parseResult.nextToken;
                    result[responseAccessor] = result[responseAccessor].concat(parseResult.listResult);
                    loopCallback(null, result);
                });
            },
            () => queryParams.nextToken,
            (err, res) => callback(err, err ? null : res)
        );
    }

    /**
     * Generic SMAPI http request wrapper
     * @param {String} apiName API name for metrics usage
     * @param {String} method HTTP method
     * @param {String} version SMAPI version
     * @param {String} urlPath Path component for a SMAPI url
     * @param {Object} queryParams Map of querry parameters
     * @param {Object} headers Map of headers
     * @param {Object} payload Payload body
     * @param {Function} callback (err, requestResponse)
     */
    _smapiRequest(apiName, method, version, urlPath, queryParams, headers, payload, callback) {
        const qs = querystring.stringify(queryParams) && `?${querystring.stringify(queryParams)}`;
        const smapiEndpoint = providerChainUtils.resolveProviderChain([process.env.ASK_SMAPI_SERVER_BASE_URL, CONSTANTS.SMAPI.ENDPOINT]);
        const requestOptions = {
            url: `${smapiEndpoint}/${version}/${urlPath}${qs}`,
            method,
            headers: headers || {},
            body: payload,
            json: !!payload
        };
        const authorizationController = new AuthorizationController({
            auth_client_type: 'LWA',
            doDebug: this.doDebug
        });
        authorizationController.tokenRefreshAndRead(this.profile, (tokenErr, token) => {
            if (tokenErr) {
                return callback(tokenErr);
            }
            requestOptions.headers.authorization = token;
            httpClient.request(requestOptions, apiName, this.doDebug, (reqErr, reqResponse) => {
                if (reqErr) {
                    return callback(reqErr);
                }
                _normalizeSmapiResponse(reqResponse, (normalizeErr, smapiResponse) => {
                    callback(normalizeErr, normalizeErr ? null : smapiResponse);
                });
            });
        });
    }
};

/**
 * Common function to validate and normalize SMAPI response.
 * @param {Object} reqResponse the response from SMAPI
 * @param {Function} callback (error, { statusCode, body, headers })
 */
function _normalizeSmapiResponse(reqResponse, callback) {
    let parsedResponseBody;
    try {
        _validateSmapiResponse(reqResponse);
        parsedResponseBody = _cleanResponseBody(reqResponse.body);
    } catch (validateErr) {
        return callback(validateErr);
    }
    callback(null, {
        statusCode: reqResponse.statusCode,
        body: parsedResponseBody,
        headers: reqResponse.headers
    });
}

/**
 * Validate SMAPI's response
 * 1. If SMAPI response doesn't contain error object but status code >= 300
 * 2. If SMAPI response body is valid JSON object
 *
 * @param {Object} reqResponse the response from SMAPI
 */
function _validateSmapiResponse(reqResponse) {
    if (reqResponse.statusCode >= 300 && !reqResponse.body) {
        throw `[Fatal]: SMAPI error code ${reqResponse.statusCode}. No response body from the service request.`;
    }
    try {
        if (reqResponse.body && typeof reqResponse.body === 'string') {
            reqResponse.body = JSON.parse(reqResponse.body);
        }
    } catch (parseErr) {
        throw `[Fatal]: Failed to parse SMAPI's response. Please run again with --debug to check more details.\nError: ${parseErr}`;
    }
}

/**
 * function to clean up properties (such as _links) from the response body.
 * @param {Object} reqResponseBody
 */
function _cleanResponseBody(reqResponseBody) {
    if (reqResponseBody) {
        Object.keys(reqResponseBody).forEach((key) => {
            if (JSON_PROPERTIES.includes(key)) {
                reqResponseBody = R.omit([key], reqResponseBody);
            } else if (typeof reqResponseBody[key] === 'object') {
                reqResponseBody[key] = _cleanResponseBody(reqResponseBody[key]);
            }
        });
    }
    return reqResponseBody;
}
