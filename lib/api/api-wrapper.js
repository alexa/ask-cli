'use strict';

const jsonRead = require('../utils/json-read');
const jsonUtility = require('../utils/json-utility');
const requestWrapper = require('./request-wrapper');
const path = require('path');
const fs = require('fs');
const os = require('os');


/*
 * List of Alexa Skill Management API Service Calls.
 * These functions are thin wrappers for Alexa Skill Management APIs.
 */

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
    callGetModelStatus: callGetModelStatus,
    callCreateAccountLinking: callCreateAccountLinking,
    callGetAccountLinking: callGetAccountLinking,
    callListVendor: callListVendor,
    callSubmit: callSubmit,
    callWithdraw: callWithdraw,
    callListSkills: callListSkills,
    callGetSkillStatus: callGetSkillStatus
};


function callInvokeSkill(file, jsonObject, skillId, endpointRegion, profile, doDebug, dataCallBack) {
    let requestPayload = file ? jsonRead.readFile(file) : jsonObject;
    let invokeRequestPayload = {
        "endpointRegion": endpointRegion,
        "skillRequest": {
            "body": requestPayload
        }
    };

    let general = {
        url: '/skills/' + skillId + '/invocations',
        method: 'POST'
    };
    let headers = {};
    requestWrapper.request('invoke-skill', general, headers, invokeRequestPayload, profile, doDebug, dataCallBack);
}

function callSimulateSkill(file, text, skillId, locale, profile, doDebug, dataCallBack) {
    let payload = {
        "input": {
            "content": file ? fs.readFileSync(file, 'utf-8') : text
        },
        "device": {
            "locale": locale
        }
    };

    let general = {
        url: '/skills/' + skillId + '/simulations',
        method: 'POST'
    };
    let headers = {};
    requestWrapper.request('simulate-skill', general, headers, payload, profile, doDebug, dataCallBack);
}

function callGetSimulation(simulationId, skillId, profile, doDebug, dataCallBack) {
    let general = {
        url: '/skills/' + skillId + '/simulations/' + simulationId,
        method: 'GET'
    };
    let headers = {};
    requestWrapper.request('get-simulation', general, headers, null, profile, doDebug, dataCallBack);
}

function callCreateSkill(skillManifest, profile, doDebug, dataCallBack) {
    if (!skillManifest) {
        console.error('[Error]: Missing skill schema');
        return;
    }
    // TODO move vendor id retrieve logic logic to low-level command
    let configFile = path.join(os.homedir(), '.ask', 'cli_config');
    if (!fs.existsSync(configFile)) {
        console.warn('Please make sure ~/.ask/cli_config exists.');
        return;
    }
    let vendorId = jsonUtility.getProperty(configFile, ['profiles', profile, 'vendor_id']);

    if (!vendorId) {
        console.error('[Error]: cannot find vendor id associated with the current profile');
        return;
    }
    let general = {
        url: '/skills/',
        method: 'POST'
    };
    let headers = {};
    let payload = {
        vendorId: vendorId,
        skillManifest: skillManifest.skillManifest
    };
    requestWrapper.request('create-skill', general, headers, payload, profile, doDebug, dataCallBack);
}

function callGetSkill(skillId, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId;
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestWrapper.request('get-skill', general, headers, null, profile, doDebug, dataCallBack);
}

function callUpdateSkill(skillId, skillManifest, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId;
    let general = {
        url: url,
        method: 'PUT'
    };
    let headers = {};
    let payload = {
        skillManifest: skillManifest.skillManifest
    };
    requestWrapper.request('update-skill', general, headers, payload, profile, doDebug, dataCallBack);
}

function callGetModel(skillId, locale, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId + '/interactionModel/locales/' + locale;
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestWrapper.request('get-model', general, headers, null, profile, doDebug, dataCallBack);
}

function callHeadModel(skillId, locale, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId + '/interactionModel/locales/' + locale;
    let general = {
        url: url,
        method: 'HEAD'
    };
    let headers = {};
    requestWrapper.request('head-model', general, headers, null, profile, doDebug, dataCallBack);
}

function callUpdateModel(skillId, locale, modelSchema, eTag, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId + '/interactionModel/locales/' + locale;
    let general = {
        url: url,
        method: 'POST'
    };
    let headers = {};
    if (eTag) {
        headers.ETag = eTag;
    }
    let payload = {
        interactionModel: modelSchema.interactionModel
    };
    requestWrapper.request('update-model', general, headers, payload, profile, doDebug, dataCallBack);
}

function callGetModelStatus(skillId, locale, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId + '/interactionModel/locales/' + locale + '/status';
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestWrapper.request('get-model-status', general, headers, null, profile, doDebug, dataCallBack);
}

function callCreateAccountLinking(skillId, accountLinking, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId + '/accountLinkingClient';
    let general = {
        url: url,
        method: 'PUT'
    };
    let headers = {};
    let payload = {
        accountLinkingRequest: accountLinking
    };
    requestWrapper.request('create-account-linking', general, headers, payload, profile, doDebug, dataCallBack);
}

function callGetAccountLinking(skillId, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId + '/accountLinkingClient';
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestWrapper.request('get-account-linking', general, headers, null, profile, doDebug, dataCallBack);
}

function callListVendor(profile, doDebug, dataCallBack) {
    let url = '/vendors';
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestWrapper.request('list-vendors', general, headers, null, profile, doDebug, dataCallBack);
}

function callSubmit(skillId, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId + '/submit';
    let general = {
        url: url,
        method: 'POST'
    };
    let headers = {};
    requestWrapper.request('submit', general, headers, null, profile, doDebug, dataCallBack);
}

function callWithdraw(skillId, withdrawReason, withdrawMessage, profile, doDebug, dataCallBack) {
    let url = '/skills/' + skillId + '/withdraw';
    let general = {
        url: url,
        method: 'POST'
    };
    let headers = {};
    let payload = {
        reason: withdrawReason,
        message: withdrawMessage
    };
    requestWrapper.request('withdraw', general, headers, payload, profile, doDebug, dataCallBack);
}

function callListSkills(vendorId, nextToken, numberOfReturnSkills, profile, doDebug, callback) {
    let url = nextToken ?
        '/skills?vendorId=' + vendorId + '&nextToken=' + nextToken + '&maxResults=' + (numberOfReturnSkills || 50) :
        '/skills?vendorId=' + vendorId + '&maxResults=' + (numberOfReturnSkills || 50);

    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestWrapper.request('list-skills', general, headers, null, profile, doDebug, callback);
}

function callGetSkillStatus(skillId, profile, doDebug, callback) {
    let url = '/skills/' + skillId + '/status';
    let general = {
        url: url,
        method: 'GET'
    };
    let headers = {};
    requestWrapper.request('get-skill-status', general, headers, null, profile, doDebug, callback);
}
