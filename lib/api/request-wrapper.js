const os = require('os');
const request = require('request');

const stringUtils = require('@src/utils/string-utils');
const oauthWrapper = require('@src/utils/oauth-wrapper');
const logger = require('@src/utils/logger-utility');
const tools = require('@src/utils/tools');
const CONSTANTS = require('@src/utils/constants');

/**
 * Wrapper for SMAPI request.
 * Use oauthWrapper to refresh token when necessary before each request.
 * @param clientMeta   name for the API, or with command name
 * @param version   version for the API, enum values from CONSTANTS.SMAPI.VERSION
 * @param general   general contains url and method
 * @param headers   headers for the request
 * @param payload   payload for the request
 * @param profile   user profile
 * @param doDebug   ASK CLI debug mode
 * @param callback  callback with response when request is successful; kill the process if it fails
 */
module.exports.request = (clientMeta, version, general, headers, payload, profile, doDebug, callback) => {
    let requestUrl = `${CONSTANTS.SMAPI.ENDPOINT}/${version}${general.url}`;
    // check environmental variable setting for SMAPI endpoint
    const envVarSmapiBaseUrl = process.env.ASK_SMAPI_SERVER_BASE_URL;
    if (stringUtils.isNonBlankString(envVarSmapiBaseUrl)) {
        requestUrl = `${envVarSmapiBaseUrl}/${version}${general.url}`;
    }
    module.exports.requestWithUrl(clientMeta, requestUrl, general.method, headers, payload, profile, doDebug, callback);
};

// request with URL directly
module.exports.requestWithUrl = (clientMeta, url, method, headers, payload, profile, doDebug, callback) => {
    let cliUserAgentStr = `ask-cli-x/${require('../../package.json').version} Node/${process.version} ${os.type()}/${os.release()}`;
    let apiName;

    if (stringUtils.isNonBlankString(process.env.ASK_DOWNSTREAM_CLIENT)) {
        cliUserAgentStr = `${process.env.ASK_DOWNSTREAM_CLIENT} (ask-cli downstream client) ${cliUserAgentStr}`;
    }

    if (typeof clientMeta === 'object') {
        apiName = clientMeta.apiName;
        headers['User-Agent'] = `command/${clientMeta.callerCommand} ${cliUserAgentStr}`;
    } else {
        apiName = clientMeta;
        headers['User-Agent'] = cliUserAgentStr;
    }

    const params = {
        url,
        method,
        headers,
        body: payload,
        json: payload ? true : false
    };

    oauthWrapper.tokenRefreshAndRead(params, profile, () => {
        request(params, (error, response) => {
            if (error || response === null || response.statusCode === null) {
                console.error('[Error]: Failed to make request to the Alexa Skill Management API service.');
                if (doDebug) {
                    console.error();
                    console.error(error);
                }
                process.exit(1);
            } else if (response.statusCode >= 300) {
                if (doDebug) {
                    logger.getInstance().debug(debugContentForResponse(apiName, response));
                }
                if ((apiName === 'head-model' && response.statusCode === 404) || 
                    (apiName === 'get-skill-status' && response.statusCode === 404) || 
                    (apiName === 'get-skill' && response.statusCode === 303) ||
                    (response.statusCode === 412)) {
                    callback(response);
                } else if (apiName === 'simulate-skill' ||
                           (apiName === 'get-simulation' && response.statusCode === 429)) {
                    callback(response);
                } else {
                    // no callback
                    console.error('Call ' + apiName + ' error.');
                    console.error('Error code: ' + response.statusCode);
                    if (response.body && tools.convertDataToJsonObject(response.body)) {
                        console.error(JSON.stringify(tools.convertDataToJsonObject(response.body), null, 2));
                    }
                    process.exit(1);
                }
            } else {
                if (doDebug) {
                    logger.getInstance().debug(debugContentForResponse(apiName, response));
                }
                callback(response);
            }
        });
    });
};

/*
 * Form the debug info object according to the response from each request
 * Based on the best practice of what should be logged for each request,
 * returned object which includes following field:
 *   - request id
 *   - request headers
 *   - response headers
 *
 * @params apiName
 * @params dataBody
 * @return debug content for response
 */
function debugContentForResponse(apiName, response) {
    return {
        activity: apiName,
        'request-id': response.headers['x-amzn-requestid'],
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
