import R from 'ramda';
import requestLib from 'request';

import DynamicConfig from '@src/utils/dynamic-config';
import logger from '@src/utils/logger-utility';
import urlUtils from '@src/utils/url-utils';
import stringUtils from '@src/utils/string-utils';
import * as CONSTANTS from '@src/utils/constants';

/**
 * Core CLI request function with User-Agent setting.
 *
 * @param {object} options      request options object
 * @param {string} operation    operation name for the request
 * @param {boolean} doDebug     define if debug info is needed
 * @param {function} callback
 */
function request(options: any, operation: string, doDebug: boolean, callback: Function) {
    // Validation of input parameters
    const requestOptions = R.clone(options);
    if (typeof operation !== 'string' || !operation.trim()) {
        process.nextTick(() => {
            callback('[Fatal]: CLI request must have a non-empty operation name.');
        });
        return;
    }
    if (!urlUtils.isValidUrl(requestOptions.url)) {
        process.nextTick(() => {
            callback(`[Fatal]: Invalid URL:${requestOptions.url}. CLI request must call with valid url.`);
        });
        return;
    }

    const proxyUrl = process.env.ASK_CLI_PROXY;
    if (stringUtils.isNonBlankString(proxyUrl)) {
        requestOptions.proxy = proxyUrl;
    }

    // Set user-agent for each CLI request
    if (!requestOptions.headers) {
        requestOptions.headers = {};
    }
    requestOptions.headers['User-Agent'] = DynamicConfig.userAgent;

    // Make request
    requestLib(requestOptions, (error: string, response: any) => {
        if (doDebug) {
            logger.getInstance().debug(debugContentForResponse(operation, error, response));
        }
        if (error) {
            return callback(`Failed to make request to ${operation}.\nError response: ${error}`);
        }
        if (!response) {
            return callback(`Failed to make request to ${operation}.\nPlease make sure "${requestOptions.url}" is responding.`);
        }
        if (!response.statusCode) {
            return callback(`Failed to access the statusCode from the request to ${operation}.`);
        }
        return callback(null, response);
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
function putByUrl(url: string, payload: any, operation: string, doDebug: boolean, callback: Function) {
    const options = {
        url,
        method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
        headers: {},
        body: payload
    };
    request(options, operation, doDebug, (reqErr: Error, reqResponse: any) => {
        callback(reqErr, reqResponse);
    });
}

/**
 * Form the debug info object according to the error and response from each http request
 * @param {string} operation
 * @param {string} error
 * @param {object} response
 */
function debugContentForResponse(operation: string, error: string, response: any) {
    return {
        activity: operation,
        error,
        'request-id': response.headers['x-amzn-requestid'] || null,
        request: {
            method: response.request.method,
            url: response.request.href,
            headers: response.request.headers,
            body: response.request.body
        },
        response: {
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            headers: response.headers
        },
        body: response.body
    };
}

export default {
    request,
    putByUrl
};
