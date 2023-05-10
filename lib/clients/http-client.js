"use strict";
import axios from "axios";
import {Url, parse} from "url";

import {userAgent} from "../utils/dynamic-config";
import {getInstance as loggerInstance} from "../utils/logger-utility";
import {isValidUrl} from "../utils/url-utils";
import {isNonBlankString} from "../utils/string-utils";
import {HTTP_REQUEST} from "../utils/constants";

/**
 * Core CLI request function with User-Agent setting and proxy support.
 *
 * @param {object} options      request options object
 * @param {string} operation    operation name for the request
 * @param {boolean} doDebug     define if debug info is needed
 * @param {function} callback
 */
export function request(options, operation, doDebug, callback) {
  // Validation of input parameters
  if (typeof operation !== "string" || !operation.trim()) {
    process.nextTick(() => {
      callback("[Fatal]: CLI request must have a non-empty operation name.");
    });
    return;
  }
  if (!isValidUrl(options.url)) {
    process.nextTick(() => {
      callback(`[Fatal]: Invalid URL:${options.url}. CLI request must call with valid url.`);
    });
    return;
  }

  let proxyConfig = {};
  try {
    proxyConfig = getProxyConfigurations();
  } catch (err) {
    return callback(err.message);
  }

  const requestOptions = {
    method: options.method || "GET",
    url: options.url,
    headers: options.headers || {},
    data: options.body,
    ...proxyConfig,
  };

  // Set user-agent for each CLI request
  requestOptions.headers["User-Agent"] = userAgent;

  // Make request
  return axios.request(requestOptions)
    .then((response) => {
      if (doDebug) {
        loggerInstance().debug(debugContentForResponse(operation, null, response));
      }
      if (!response) {
        return callback({
          errorMessage :`The request to ${operation}, failed.\nPlease make sure "${requestOptions.url}" is responding.`,
        });
      }
      if (!response.status) {
        return callback({
          errorMessage :`Failed to access the statusCode from the request to ${operation}.`,
        });
      }
      return callback(null, {
        statusCode: response.status,
        ...(response.data ? {body: response.data} : {}),
        ...(response.headers ? {headers: response.headers} : {}),
      });
    })
    .catch((error) => {
      const response = error ? error.response || {} : {};
      error.statusCode ||= response.status;

      if (doDebug) {
        loggerInstance().debug(debugContentForResponse(operation, error, response));
      }

      return callback({
        errorMessage : `The request to ${requestOptions.url} failed. Client Error: ${error}`,
        statusCode: response.status,
        ...(response.data ? {body: response.data} : {}),
        ...(response.headers ? {headers: response.headers} : {}),
      }, response);
    });
}
/**
 * HTTP client's upload method
 * @param {String} url
 * @param {Object} payload
 * @param {String} operation
 * @param {Boolean} doDebug
 * @param {Function} callback
 */
export function putByUrl(url, payload, operation, doDebug, callback) {
  const options = {
    url,
    method: HTTP_REQUEST.VERB.PUT,
    headers: {},
    body: payload,
  };
  request(options, operation, doDebug, (reqErr, reqResponse) => {
    callback(reqErr, reqResponse);
  });
}

/**
 * Form the debug info object according to the error and response from each http request
 * @param {string} operation
 * @param {string} error
 * @param {object} response
 */
function debugContentForResponse(operation, error, response) {
  const debugContent = {
    activity: operation,
    error,
  };
  if (response) {
    debugContent["response"] = {
      ...(response.status ? { statusCode: response.status } : {}),
      ...(response.statusText ? { statusMessage: response.statusText } : {}),
      ...(response.headers ? { headers: response.headers } : {}),
    };
    debugContent["request-id"] = response.headers ? (debugContent["request-id"] = response.headers["x-amzn-requestid"] || null) : null;
    const requestConfig = response.config || {};
    if (response.request) {
      debugContent["request"] = {
        method: requestConfig.method,
        url: requestConfig.url,
        headers: response.request._headers || requestConfig.headers,
        body: requestConfig.data,
      };
    }
    if (response.data) {
      debugContent["body"] = response.data;
    }
  }
  return debugContent;
}

/**
 * If the env variable ASK_CLI_PROXY is set, returns the axios proxy object to append to the requestOptions
 * as defined here https://www.npmjs.com/package/axios#request-config
 * Otherwise returns an empty object {}
 * @returns {Record} axios proxy configurations
 * @throws {Error} if the ASK_CLI_PROXY is not a valid URL
 */
function getProxyConfigurations() {
  const proxyEnv = process.env.ASK_CLI_PROXY;
  const configuration = {};
  if (proxyEnv && isNonBlankString(proxyEnv)) {
    if (!isValidUrl(proxyEnv)) {
      throw new Error(`[Fatal]: Invalid Proxy setting URL: ${proxyEnv}. Reset ASK_CLI_PROXY env variable with a valid proxy url.`);
    }
    const proxyUrl = parse(proxyEnv);
    configuration.proxy = {
      protocol: proxyUrl.protocol.replace(":", ""),
      host: proxyUrl.hostname,
      ...(proxyUrl.port ? {port: proxyUrl.port} : {}),
      ...getAuthFromUrlObject(proxyUrl),
    };
  }
  return configuration;
}

/**
 * Gets the auth part of the specified Url and returns an axios auth object to append to the proxy / request object
 * as defined here https://www.npmjs.com/package/axios#request-config
 * Otherwise returns an empty object {}
 * @param {Url} url
 * @returns {Record} axios proxy auth configurations
 */
function getAuthFromUrlObject(url) {
  const auth = {};
  if (url.auth) {
    const authSplit = url.auth.split(":");
    const authBody = {};
    if (authSplit.length > 0) {
      authBody.username = authSplit[0];
    }
    if (authSplit.length > 1) {
      authBody.password = authSplit[1];
    }
    auth.auth = authBody;
  }
  return auth;
}
