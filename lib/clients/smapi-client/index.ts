import R from 'ramda';
import async from 'async';
import querystring from 'querystring';
import AuthorizationController from '@src/controllers/authorization-controller';
import DynamicConfig from '@src/utils/dynamic-config';
import httpClient from '@src/clients/http-client';
import * as CONSTANTS from '@src/utils/constants';

import accountLinkingApi from './resources/account-linking';
import catalogApi from './resources/catalog';
import historyApi from './resources/history';
import ispApi from './resources/isp';
import manifestApi from './resources/manifest';
import interactionModelApi from './resources/interaction-model';
import privateSkillApi from './resources/private-skill';
import skillPackageApi from './resources/skill-package';
import skillApi from './resources/skill';
import testApi from './resources/test';
import vendorApi from './resources/vendor';
import evaluationsApi from './resources/evaluations';
import alexaHostedApi from './resources/alexa-hosted';
import betaTestApi from './resources/beta-test';
import publishingApi from './resources/publishing';
import taskApi from './resources/task';

const JSON_PROPERTIES = ['_links'];

/**
 * Class for Alexa Skill Management API Service (SMAPI) client
 */
export default class SmapiClient {
    profile: string;
    doDebug: boolean;
    skill: any;
    skillPackage: any;
    vendor: any;
    isp: any;
    catalog: any;
    task: any;

    /**
     * Constructor for SmapiClient with "profile" for authorization and "doDebug" for client setting
     * @param {object} configuration | profile
     *                               | doDebug
     */
    constructor(configuration: any) {
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
    smapiRedirectRequestWithUrl(url: string, callback: Function) {
        const EMPTY_HEADERS = {};
        const method = CONSTANTS.HTTP_REQUEST.VERB.GET;
        const NULL_PAYLOAD = null;
        const requestOptions: any = {
            url,
            method,
            headers: EMPTY_HEADERS,
            body: NULL_PAYLOAD,
        };
        const cfg: any = {
            auth_client_type: 'LWA',
            doDebug: this.doDebug
        };
        const authorizationController = new AuthorizationController(cfg);
        authorizationController.tokenRefreshAndRead(this.profile, (tokenErr: Error, token: string) => {
            if (tokenErr) {
                return callback(tokenErr);
            }
            requestOptions.headers.authorization = token;
            httpClient.request(requestOptions, 'REDIRECT_URL', this.doDebug, (reqErr: Error, reqResponse: any) => {
                if (reqErr) {
                    return callback(reqErr);
                }
                _normalizeSmapiResponse(reqResponse, (handleErr: Error, smapiResponse: any) => {
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
    listWithAutoPagination(callApiTrack: any, callArgv: any, responseAccessor: string, responseHandle: Function, callback: Function) {
        const result: any = {};
        result[responseAccessor] = [];
        const queryParams: any = {
            maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
        };
        const smapiMethod: any = R.path(callApiTrack, this);

        const cb: any = (err: Error, res: any) => callback(err, err ? null : res);

        async.doWhilst(
            (loopCallback: any) => {
                smapiMethod(...callArgv, queryParams, (err: Error, res: any) => {
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
            cb
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
    _smapiRequest(
        apiName: string,
        method: string,
        version: string,
        urlPath: string,
        queryParams: any,
        headers: any,
        payload: any,
        callback: Function
    ) {
        const qs = querystring.stringify(queryParams) && `?${querystring.stringify(queryParams)}`;
        const smapiEndpoint = DynamicConfig.smapiBaseUrl;
        const requestOptions = {
            url: `${smapiEndpoint}/${version}/${urlPath}${qs}`,
            method,
            headers: headers || {},
            body: payload,
            json: !!payload
        };
        const cfg: any = {
            auth_client_type: 'LWA',
            doDebug: this.doDebug
        };
        const authorizationController = new AuthorizationController(cfg);
        authorizationController.tokenRefreshAndRead(this.profile, (tokenErr: Error, token: any) => {
            if (tokenErr) {
                return callback(tokenErr);
            }
            requestOptions.headers.authorization = token;
            httpClient.request(requestOptions, apiName, this.doDebug, (reqErr: Error, reqResponse: any) => {
                if (reqErr) {
                    return callback(reqErr);
                }
                _normalizeSmapiResponse(reqResponse, (normalizeErr: Error, smapiResponse: any) => {
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
function _normalizeSmapiResponse(reqResponse: any, callback: Function) {
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
function _validateSmapiResponse(reqResponse: any) {
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
function _cleanResponseBody(reqResponseBody: any) {
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
