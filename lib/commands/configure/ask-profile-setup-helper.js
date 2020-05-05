const SmapiClient = require('@src/clients/smapi-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const CONSTANTS = require('@src/utils/constants');

const messages = require('./messages');
const ui = require('./ui');

module.exports = {
    setupAskToken,
    setupVendorId
};

/**
 * Initiates access token setup to be used in future requests.
 * @param {Object} config
 * @param {Function} callback
 */
function setupAskToken(config, callback) {
    _getAccessToken(config, (accessTokenError, accessToken) => {
        if (accessTokenError) {
            return callback(accessTokenError);
        }
        callback(null, accessToken);
    });
}

/**
 * Retrieves access tokens to be used in future requests.
 * @param {Object} config
 * @param {Function} callback
 * @private
 */
function _getAccessToken(config, callback) {
    const authorizationController = new AuthorizationController(_buildAuthorizationConfiguration(config));
    if (!config.needBrowser) {
        const authorizeUrl = authorizationController.getAuthorizeUrl();
        Messenger.getInstance().info(`Paste the following url to your browser:\n    ${authorizeUrl}`);
        ui.getAuthCode((error, authCode) => {
            if (error) {
                return callback(error);
            }
            authorizationController.getAccessTokenUsingAuthCode(authCode, (err, accessToken) => callback(err, err == null ? accessToken : err));
        });
    } else {
        authorizationController.getTokensByListeningOnPort((err, accessToken) => callback(err, err == null ? accessToken : err));
    }
}

/**
 * Retrieves vendor info for a specific profile.
 * @param {Object} config
 * @param {Function} callback
 * @private
 */
function setupVendorId(config, callback) {
    _getVendorInfo(config, (err, vendorInfo) => {
        if (err) {
            return callback(err);
        }
        _selectVendorId(vendorInfo, (vendorIdError, vendorId) => {
            if (vendorIdError) {
                return callback(vendorIdError);
            }
            callback(null, vendorId);
        });
    });
}

/**
 * Gets vendor info.
 * @param {Object} config contains profile name and debug information to create smapi client.
 * @param {Function} callback
 * @private
 */
function _getVendorInfo(config, callback) {
    const smapiClient = new SmapiClient({
        profile: config.askProfile,
        doDebug: config.debug
    });

    smapiClient.vendor.listVendors((err, response) => {
        if (err) {
            return callback(err);
        }
        if (response.statusCode >= 300) {
            const error = jsonView.toString(response.body);
            return callback(error);
        }
        callback(null, response.body.vendors);
    });
}

/**
 * Helper function to select a vendor ID if multiple vendor IDs are available.
 * @param {Array} vendorInfo
 * @param {Function} callback
 */
function _selectVendorId(vendorInfo, callback) {
    if (!vendorInfo) {
        return callback(messages.VENDOR_INFO_FETCH_ERROR);
    }
    const numberOfVendors = vendorInfo.length;
    const LIST_PAGE_SIZE = 50;
    switch (numberOfVendors) {
    case 0:
        process.nextTick(() => {
            callback(messages.VENDOR_ID_CREATE_INSTRUCTIONS);
        });
        break;
    case 1:
        process.nextTick(() => {
            callback(null, vendorInfo[0].id);
        });
        break;
    default:
        ui.chooseVendorId(LIST_PAGE_SIZE, vendorInfo, (error, vendorId) => callback(error, error === null ? vendorId : error));
    }
}

/**
 * Builds authorization configuration to be injected into Authorization Controller.
 * @param {Object} config
 * @private
 */
function _buildAuthorizationConfiguration(config) {
    return {
        config,
        scopes: CONSTANTS.LWA.DEFAULT_SCOPES,
        state: CONSTANTS.LWA.DEFAULT_STATE,
        auth_client_type: 'LWA',
        redirectUri: CONSTANTS.LWA.S3_RESPONSE_PARSER_URL,
        doDebug: config.doDebug
    };
}
