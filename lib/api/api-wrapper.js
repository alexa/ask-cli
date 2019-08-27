const requestWrapper = require('./request-wrapper');
const CONSTANTS = require('../utils/constants');

/*
 * List of Alexa Skill Management API Service Calls.
 * These functions are thin wrappers for Alexa Skill Management APIs.
 */

module.exports = {
    callListVendor
};

function callListVendor(profile, doDebug, callback) {
    const url = '/vendors';
    const general = {
        url,
        method: 'GET'
    };
    const headers = {};
    requestWrapper.request('list-vendors', CONSTANTS.SMAPI.VERSION.V0, general, headers, null, profile, doDebug, callback);
}
