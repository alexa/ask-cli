'use strict';

const oauthWrapper = require('../utils/oauth-wrapper');
const request = require('request');
const logger = require('../utils/logger-utility');
const tools = require('../utils/tools');

// TODO Improve the error handling:
//      callback should be always consisted of (error, response)
//      Adapt this format to all the places which call this function
module.exports.request = (apiName, general, headers, payload, profile, doDebug, callback) => {
    const ENDPOINT = 'https://api.amazonalexa.com/v0';

    headers['User-Agent'] = 'ask-cli/' + require('../../package.json').version +
                            ' Node/' + process.version;
    let params = {
        url: ENDPOINT + general.url,
        method: general.method,
        headers: headers,
        body: payload,
        json: payload ? true : false
    };

    oauthWrapper.tokenRefreshAndRead(params, profile, (updatedParams) => {
        request(updatedParams, (error, response) => {
            if (error || response.statusCode === null) {
                console.error('Request to the Alexa Skill Management API service failed.');
                if (doDebug) {
                    logger.getInstance().debug(error);
                }
                process.exit(1);
            } else if (response.statusCode >= 300) {
                if (doDebug) {
                    logger.getInstance().debug(debugContentForResponse(apiName, response));
                }
                // "get-model-status + 404" -> model not existed
                if ((apiName === 'get-model-status' && response.statusCode === 404)) {
                    callback(404, response.body);
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
                if (apiName === 'head-model' || apiName === 'get-model') {
                    callback(response.body, response.headers.etag);
                } else {
                    callback(response.body);
                }
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
        'activity': apiName,
        'request-id': response.headers['x-amzn-requestid'],
        'request': {
            'method': response.request.method,
            'url': response.request.href,
            'headers': response.request.headers,
            'body': response.request.body
        },
        'response': {
            'statusCode': response.statusCode,
            'statusMessage': response.statusMessage,
            'headers': response.headers
        },
        'body': response.body
    };
}
