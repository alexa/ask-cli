const os = require('os');
const R = require('ramda');
const requestLib = require('request');

const logger = require('@src/utils/logger-utility');
const urlUtils = require('@src/utils/url-utils');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');
const pkg = require('@root/package.json');

module.exports = {
    request,
    putByUrl
};

/**
 * Core CLI request function with User-Agent setting.
 *
 * @param {object} options      request options object
 * @param {string} operation    operation name for the request
 * @param {boolean} doDebug     define if debug info is needed
 * @param {function} callback
 */
function request(options, operation, doDebug, callback) {
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
    requestOptions.headers['User-Agent'] = resolveUserAgent();

    // Make request
    requestLib(requestOptions, (error, response) => {
        if (doDebug) {
            logger.getInstance().debug(debugContentForResponse(operation, error, response));
        }
        if (error) {
            return callback(`Failed to make request to ${operation}.\nError response: ${error}`);
        }
        if (!response) {
            return callback(`Failed to make request to ${operation}.\nPlease make sure "${requestOptions.url}" is responding.`);
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
function putByUrl(url, payload, operation, doDebug, callback) {
    const options = {
        url,
        method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
        headers: {},
        body: payload
    };
    request(options, operation, doDebug, (reqErr, reqResponse) => {
        callback(reqErr, reqResponse);
    });
}

/**
 * Resolve User-Agent for CLI by the following the chain:
 * (CLI Client)? - CLI Version - Node Verson - OS Type/Release
 * CLI downstream's status is decided by the ENV_VAR "ASK_DOWNSTREAM_CLIENT"
 */
function resolveUserAgent() {
    const cliUserAgentStr = `ask-cli/${pkg.version} Node/${process.version} ${os.type()}/${os.release()}`;
    if (stringUtils.isNonBlankString(process.env.ASK_DOWNSTREAM_CLIENT)) {
        return `${process.env.ASK_DOWNSTREAM_CLIENT} (ask-cli downstream client) ${cliUserAgentStr}`;
    }
    return cliUserAgentStr;
}

/**
 * Form the debug info object according to the error and response from each http request
 * @param {string} operation
 * @param {string} error
 * @param {object} response
 */
function debugContentForResponse(operation, error, response) {
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
