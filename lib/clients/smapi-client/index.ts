import querystring from "querystring";
import AuthorizationController from "../../controllers/authorization-controller";
import DynamicConfig from "../../utils/dynamic-config";
import * as httpClient from "../http-client";

import accountLinkingApi from "./resources/account-linking";
import catalogApi from "./resources/catalog";
import historyApi from "./resources/history";
import ispApi from "./resources/isp";
import manifestApi from "./resources/manifest";
import interactionModelApi from "./resources/interaction-model";
import privateSkillApi from "./resources/private-skill";
import skillPackageApi from "./resources/skill-package";
import skillApi from "./resources/skill";
import testApi from "./resources/test";
import vendorApi from "./resources/vendor";
import evaluationsApi from "./resources/evaluations";
import alexaHostedApi from "./resources/alexa-hosted";
import betaTestApi from "./resources/beta-test";
import publishingApi from "./resources/publishing";
import taskApi from "./resources/task";

const JSON_PROPERTIES = ["_links"];

export interface ISmapiClient {
  profile: string;
  doDebug: boolean;
  skill: ReturnType<typeof skillApi> & {
    manifest: ReturnType<typeof manifestApi>;
    interactionModel: ReturnType<typeof interactionModelApi>;
    accountLinking: ReturnType<typeof accountLinkingApi>;
    privateSkill: ReturnType<typeof privateSkillApi>;
    history: ReturnType<typeof historyApi>;
    test: ReturnType<typeof testApi>;
    evaluations: ReturnType<typeof evaluationsApi>;
    alexaHosted: ReturnType<typeof alexaHostedApi>;
    betaTest: ReturnType<typeof betaTestApi>;
    publishing: ReturnType<typeof publishingApi>;
  };
  skillPackage: ReturnType<typeof skillPackageApi>;
  vendor: ReturnType<typeof vendorApi>;
  isp: ReturnType<typeof ispApi>;
  catalog: ReturnType<typeof catalogApi>;
  task: ReturnType<typeof taskApi>;
}

/**
 * Class for Alexa Skill Management API Service (SMAPI) client
 *
 * Late bound to decouple the behavior from the user provided configuration of debug and profile.
 */
export class SmapiClientLateBound {
  constructor() {
    this._smapiRequest = this._smapiRequest.bind(this);
  }

  withConfiguration(configuration: SmapiClientConfiguration): ISmapiClient {
    const smapiRequest: SmapiRequest = <T>(
      apiName: string,
      method: string,
      version: string,
      urlPath: string,
      queryParams: querystring.ParsedUrlQueryInput,
      headers: Record<string, any> | null,
      payload: Record<string, any> | null,
      callback?: SmapiRequestCallback<T>,
    ) => this._smapiRequest<T>(configuration, apiName, method, version, urlPath, queryParams, headers, payload, callback as any) as any;
    return {
      profile: configuration.profile,
      doDebug: configuration.doDebug,
      skill: {
        ...skillApi(smapiRequest),
        manifest: manifestApi(smapiRequest),
        interactionModel: interactionModelApi(smapiRequest),
        accountLinking: accountLinkingApi(smapiRequest),
        privateSkill: privateSkillApi(smapiRequest),
        history: historyApi(smapiRequest),
        test: testApi(smapiRequest),
        evaluations: evaluationsApi(smapiRequest),
        alexaHosted: alexaHostedApi(smapiRequest),
        betaTest: betaTestApi(smapiRequest),
        publishing: publishingApi(smapiRequest),
      },
      skillPackage: skillPackageApi(smapiRequest),
      vendor: vendorApi(smapiRequest),
      isp: ispApi(smapiRequest),
      catalog: catalogApi(smapiRequest),
      task: taskApi(smapiRequest),
    };
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
  _smapiRequest<T>(
    configuration: SmapiClientConfiguration,
    apiName: string,
    method: string,
    version: string,
    urlPath: string,
    queryParams: querystring.ParsedUrlQueryInput,
    headers: Record<string, any> | null,
    payload: Record<string, any> | null,
  ): Promise<SmapiResponse<T>>;
  _smapiRequest<T>(
    configuration: SmapiClientConfiguration,
    apiName: string,
    method: string,
    version: string,
    urlPath: string,
    queryParams: querystring.ParsedUrlQueryInput,
    headers: Record<string, any> | null,
    payload: Record<string, any> | null,
    callback: SmapiRequestCallback<T>,
  ): void;
  _smapiRequest<T>(
    configuration: SmapiClientConfiguration,
    apiName: string,
    method: string,
    version: string,
    urlPath: string,
    queryParams: querystring.ParsedUrlQueryInput,
    headers: Record<string, any> | null,
    payload: Record<string, any> | null,
    callback?: SmapiRequestCallback<T>,
  ): Promise<SmapiResponse<T>> | void {
    if (!callback) {
      return new Promise((resolve, reject) => {
        this._smapiRequest<T>(configuration, apiName, method, version, urlPath, queryParams, headers, payload, (err, response) => {
          if (err) {
            return reject(err);
          }
          resolve(response as SmapiResponse<T>);
        });
      });
    }
    const qs = querystring.stringify(queryParams) && `?${querystring.stringify(queryParams)}`;
    const smapiEndpoint = DynamicConfig.smapiBaseUrl;
    const authorizationController = new AuthorizationController({
      auth_client_type: "LWA",
      doDebug: configuration.doDebug,
    });
    authorizationController.tokenRefreshAndRead(configuration.profile, (tokenErr: string, token: string) => {
      if (tokenErr) {
        return callback(tokenErr);
      }
      const requestOptions = {
        url: `${smapiEndpoint}/${version}/${urlPath}${qs}`,
        method,
        headers: {
          ...headers,
          authorization: token,
        },
        body: payload,
        json: !!payload,
      };
      httpClient.request(requestOptions, apiName, configuration.doDebug, (reqErr: any, reqResponse: SmapiResponse<T>) => {
        if (reqErr && reqErr.statusCode ) {
          return _normalizeSmapiResponse<T>(reqErr, (normalizeErr, smapiResponse) => {
            return callback(normalizeErr || smapiResponse, smapiResponse || null);
          });
        }
        if (reqErr) {
          return callback(reqErr);
        }
        return _normalizeSmapiResponse<T>(reqResponse, (normalizeErr, smapiResponse) => {
          return callback(normalizeErr, normalizeErr ? null : smapiResponse);
        });
      });
    });
  }
}

export type SmapiRequestCallback<T> = (err: any, response?: SmapiResponse<T> | null) => void;
export type SmapiRequest = (<T>(
  apiName: string,
  method: string,
  version: string,
  urlPath: string,
  queryParams: querystring.ParsedUrlQueryInput,
  headers: Record<string, any> | null,
  payload: Record<string, any> | null,
  callback: SmapiRequestCallback<T>,
) => void) &
  (<T>(
    apiName: string,
    method: string,
    version: string,
    urlPath: string,
    queryParams: querystring.ParsedUrlQueryInput,
    headers: Record<string, any> | null,
    payload: Record<string, any> | null,
  ) => Promise<SmapiResponse<T>>);

export interface SmapiClientConfiguration {
  profile: string;
  doDebug: boolean;
}

/**
 * Class for Alexa Skill Management API Service (SMAPI) client
 *
 * Requires profile and debug flag.
 *
 * @deprecated use SmapiClientLateBound
 */
export default class SmapiClient implements ISmapiClient {
  profile: string;
  doDebug: boolean;
  skill;
  skillPackage;
  vendor;
  isp;
  catalog;
  task;
  constructor(_configuration: SmapiClientConfiguration) {
    const smapiClientLateBound = new SmapiClientLateBound().withConfiguration(_configuration);
    this.skill = smapiClientLateBound.skill;
    this.catalog = smapiClientLateBound.catalog;
    this.isp = smapiClientLateBound.isp;
    this.skillPackage = smapiClientLateBound.skillPackage;
    this.vendor = smapiClientLateBound.vendor;
    this.task = smapiClientLateBound.task;
    this.profile = _configuration.profile;
    this.doDebug = _configuration.doDebug;
  }
}

export type SmapiResponse<T = Record<string, any>, E = {}> = SmapiResponseObject<T> | SmapiResponseError<E>;

export interface SmapiResponseObject<T = Record<string, any>> {
  statusCode: number;
  body: T;
  headers: any[];
  message?: string;
}

export interface SmapiResponseError<E = {}> {
  statusCode: number;
  body: E & {message: string};
  headers: any[];
  message?: string;
}

export function isSmapiError<T, E>(response: SmapiResponse<T, E>): response is SmapiResponseError<E> {
  return response.statusCode >= 300;
}

/**
 * Common function to validate and normalize SMAPI response.
 * @param {Object} reqResponse the response from SMAPI
 * @param {Function} callback (error, { statusCode, body, headers })
 */
function _normalizeSmapiResponse<T>(reqResponse: SmapiResponse<T>, callback: (err: any, resp?: SmapiResponse<T>) => void) {
  let parsedResponseBody;
  try {
    _validateSmapiResponse(reqResponse);
    parsedResponseBody = _cleanResponseBody(reqResponse.body as Record<string, any>) as T;
  } catch (validateErr) {
    return callback(validateErr);
  }
  callback(null, {
    statusCode: reqResponse.statusCode,
    body: parsedResponseBody,
    headers: reqResponse.headers,
    ...(reqResponse.message? {message: reqResponse.message} : {})
  });
}

/**
 * Validate SMAPI's response
 * 1. If SMAPI response doesn't contain error object but status code >= 300
 * 2. If SMAPI response body is valid JSON object
 *
 * @param {Object} reqResponse the response from SMAPI
 */
function _validateSmapiResponse<T>(reqResponse: SmapiResponse<T>) {
  if (reqResponse.statusCode >= 300 && !reqResponse.body) {
    throw `[Fatal]: SMAPI error code ${reqResponse.statusCode}. No response body from the service request.`;
  }
  try {
    if (reqResponse.body && typeof reqResponse.body === "string") {
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
function _cleanResponseBody(reqResponseBody?: Record<string, any>): Record<string, any> | undefined {
  if (reqResponseBody) {
    Object.keys(reqResponseBody).forEach((key) => {
      if (JSON_PROPERTIES.includes(key)) {
        const {[key]: k, ...rest} = reqResponseBody;
        return rest;
      } else if (typeof reqResponseBody[key] === "object") {
        return {...reqResponseBody, [key]: _cleanResponseBody(reqResponseBody[key])};
      }
      return;
    });
  }
  return reqResponseBody;
}
