'use strict';

const oauthWrapper = require('../utils/oauth-wrapper');
const tools = require('../utils/tools');
const jsonRead = require('../utils/json-read');
const request = require('request');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Public
module.exports = {
    callSimulateSkill: callSimulateSkill,
    callGetSimulation: callGetSimulation,
    callInvokeSkill: callInvokeSkill,
    callCreateSkill: callCreateSkill,
    callGetSkill: callGetSkill,
    callUpdateSkill: callUpdateSkill,
    callGetModel: callGetModel,
    callHeadModel: callHeadModel,
    callUpdateModel: callUpdateModel,
    callGetBuildStatus: callGetBuildStatus,
    callCreateAccountLinking: callCreateAccountLinking,
    callGetAccountLinking: callGetAccountLinking,
    callListVendor: callListVendor,
    callSubmit: callSubmit,
    callWithdraw: callWithdraw
};

function callInvokeSkill(file, jsonObject, skillId, endpointRegion, dataCallBack) {
     let requestPayload = file ? jsonRead.readFile(file) : jsonObject;
     let invokeRequestPayload = {
         "endpointRegion": endpointRegion,
         "skillRequest": {
             "body": requestPayload
         }
     };
 
     let general = {
         url: '/v0/skills/' + skillId + '/invocations',
         method: 'POST'
     };
     let headers = {};
     requestSmapi('invoke-skill', general, headers, invokeRequestPayload, dataCallBack);
 }
 
 function callSimulateSkill(file, text, skillId, locale, dataCallBack) {
     let payload = {
         "input": {
             "content": file ? fs.readFileSync(file, 'utf-8') : text
         },
         "device": {
             "locale": locale
         }
     };
 
     let general = {
         url: '/v0/skills/' + skillId + '/simulations',
         method: 'POST'
     };
     let headers = {};
     requestSmapi('simulate-skill', general, headers, payload, dataCallBack);
 }
 
 function callGetSimulation(simulationId, skillId, dataCallBack) {
     let general = {
         url: '/v0/skills/' + skillId + '/simulations/' + simulationId,
         method: 'GET'
     };
     let headers = {};
     requestSmapi('get-simulation', general, headers, null, dataCallBack);
 }

function callCreateSkill(skillFile, dataCallBack) {
    let skillSchema = jsonRead.readFile(skillFile);
    if (!skillSchema) {
        return;
    }
    let configFile = path.join(os.homedir(), '.ask', 'cli_config');
    if (!fs.existsSync(configFile)) {
        console.warn('Please make sure ~/.ask/cli_config exists.');
        return;
    }
    let config = jsonRead.readFile(configFile);
    if (!config) {
        return;
    }
    let vendorId = jsonRead.getProperty(config, '.profiles.default.vendor_id');
    if (!vendorId) {
        return;
    }
    let general = {
        url: '/beta/skills/',
        method: 'POST'
    };
    let headers = {
        vendorId: vendorId
    };
    let payload = {
        skillDefinition: JSON.stringify(skillSchema.skillDefinition)
    };
    requestSmapi('create-skill', general, headers, payload, dataCallBack);
}

function callGetSkill(skillId, stage, dataCallBack) {
    let url = '/beta/skills/' + skillId + '/stages/' + (stage || 'development');
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestSmapi('get-skill', general, headers, null, dataCallBack);
}

function callUpdateSkill(skillId, skillFile, dataCallBack) {
    let skillSchema = jsonRead.readFile(skillFile);
    if (!skillSchema) {
        return;
    }
    let url = '/beta/skills/' + skillId;
    let general = {
        url: url,
        method: 'PUT'
    };
    let headers = {};
    let payload = {
        skillDefinition: JSON.stringify(skillSchema.skillDefinition)
        //TODO version? JSON.stringify(skillSchema.version)
    };
    requestSmapi('update-skill', general, headers, payload, dataCallBack);
}

function callGetModel(skillId, locale, dataCallBack) {
    let url = '/beta/skills/' + skillId + '/model/locales/' + locale;
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestSmapi('get-model', general, headers, null, dataCallBack);
}

function callHeadModel(skillId, locale, dataCallBack) {
    let url = '/beta/skills/' + skillId + '/model/locales/' + locale;
    let general = {
        url: url,
        method: 'HEAD'
    };
    let headers = {};
    requestSmapi('head-model', general, headers, null, dataCallBack);
}

function callUpdateModel(skillId, locale, modelFile, eTag, dataCallBack) {
    let modelSchema = jsonRead.readFile(modelFile);
    if (!modelSchema) {
        return;
    }
    let url = '/beta/skills/' + skillId + '/model/locales/' + locale;
    let general = {
        url: url,
        method: 'POST'
    };
    let headers = {};
    if (eTag) {
        headers.ETag = eTag;
    }
    let payload = {
        modelDefinition: JSON.stringify(modelSchema.modelDefinition)
    };
    requestSmapi('update-model', general, headers, payload, dataCallBack);
}

function callGetBuildStatus(skillId, locale, dataCallBack) {
    let url = '/beta/skills/' + skillId + '/model/locales/' + locale + '/status';
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestSmapi('get-build-status', general, headers, null, dataCallBack);
}

function callCreateAccountLinking(skillId, accountLinking, dataCallBack) {
    let url = '/beta/skills/' + skillId + '/accountLinking';
    let general = {
        url: url,
        method: 'PUT'
    };
    let headers = {};
    let payload = {
        accountLinkingInfo: JSON.stringify(accountLinking)
    };
    requestSmapi('create-account-linking', general, headers, payload, dataCallBack);
}

function callGetAccountLinking(skillId, dataCallBack) {
    let url = '/beta/skills/' + skillId + '/accountLinking';
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestSmapi('get-account-linking', general, headers, null, dataCallBack);
}

function callListVendor(max, dataCallBack) {
    let url = '/beta/vendors?maxResults=' + (max || 20);
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestSmapi('list-vendors', general, headers, null, dataCallBack);
}

function callSubmit(skillId, dataCallBack) {
    let url = '/beta/skills/' + skillId + '/submit';
    let general = {
        url: url,
        method: 'POST'
    };
    let headers = {};
    requestSmapi('submit', general, headers, null, dataCallBack);
}

function callWithdraw(skillId, withdrawReason, withdrawMessage, dataCallBack) {
    let url = '/beta/skills/' + skillId + '/withdraw';
    let general = {
        url: url,
        method: 'POST'
    };
    let headers = {};
    let payload = {
        reason: withdrawReason,
        message: withdrawMessage
    };
    requestSmapi('withdraw', general, headers, payload, dataCallBack);
}

// Private
function requestSmapi(apiName, general, headers, payload, callback) {
    const ENDPOINT = 'https://api.amazonalexa.com';
    let dataBody = '';
    let statusCode;
    let eTag;
    let params = {
        url: ENDPOINT + general.url,
        method: general.method,
        headers: headers,
        body: payload,
        json: payload ? true : false
    };

    oauthWrapper.tokenRefreshAndRead(params, (updatedParams) => {
        request(updatedParams).on('response', (response) => {
             statusCode = response.statusCode;
             if (apiName === 'head-model' || apiName === 'get-model') {
                 eTag = response.headers.etag;
             }
        }).on('data', (chunk) => {
            dataBody += chunk;
        }).on('end', () => {
            if (statusCode < 300) {
                callback(dataBody, eTag);
            } else {
                if ((apiName === 'get-build-status' && statusCode === 404)) {
                    callback(404, dataBody);
                } else {
                    console.error('Call ' + apiName + ' error.');
                    console.error('Error code: ' + statusCode);
                    if (dataBody) {
                        console.error(tools.convertDataToJsonObject(dataBody));
                    }
                    process.exit();
                }
            }
        }).on('error', () => {
            console.error('Request to the Skill Management API service failed.');
            process.exit();
        });
    });
}
