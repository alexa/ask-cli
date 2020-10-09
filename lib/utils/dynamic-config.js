const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');

function resolve(chain) {
    for (const item of chain) {
        if (stringUtils.isNonBlankString(item) && item !== 'undefined') {
            return item;
        }
    }
    return null;
}

class DynamicConfig {
    static get lwaClientId() {
        return resolve([process.env.ASK_LWA_CLIENT_ID, CONSTANTS.LWA.CLI_INTERNAL_ONLY_LWA_CLIENT.CLIENT_ID]);
    }

    static get lwaClientConfirmation() {
        return resolve([process.env.ASK_LWA_CLIENT_CONFIRMATION, CONSTANTS.LWA.CLI_INTERNAL_ONLY_LWA_CLIENT.CLIENT_CONFIRMATION]);
    }

    static get lwaAuthorizationHost() {
        return resolve([process.env.ASK_LWA_AUTHORIZE_HOST, CONSTANTS.LWA.DEFAULT_AUTHORIZE_HOST]);
    }

    static get lwaTokenHost() {
        return resolve([process.env.ASK_LWA_TOKEN_HOST, CONSTANTS.LWA.DEFAULT_TOKEN_HOST]);
    }

    static get smapiBaseUrl() {
        return resolve([process.env.ASK_SMAPI_SERVER_BASE_URL, CONSTANTS.SMAPI.ENDPOINT]);
    }
}

module.exports = DynamicConfig;
