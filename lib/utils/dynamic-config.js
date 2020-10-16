const os = require('os');

const CONSTANTS = require('@src/utils/constants');
const pkg = require('@root/package.json');
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

    static get s3Scripts() {
        const baseUrl = resolve([process.env.ASK_SMAPI_SERVER_BASE_URL, 'https://ask-tools-core-content.s3-us-west-2.amazonaws.com']);
        return {
            authInfo: `${baseUrl}/auth_info`,
            prePush: `${baseUrl}/git-hooks-templates/pre-push/pre-push`,
            askPrePush: `${baseUrl}/git-hooks-templates/pre-push/ask-pre-push`,
            gitCredentialHelper: `${baseUrl}/helpers/prod/git-credential-helper`,
        }
    }

    static get userAgent() {
        const cliUserAgentStr = `ask-cli/${pkg.version} Node/${process.version} ${os.type()}/${os.release()}`;
        if (stringUtils.isNonBlankString(process.env.ASK_DOWNSTREAM_CLIENT)) {
            return `${process.env.ASK_DOWNSTREAM_CLIENT} (ask-cli downstream client) ${cliUserAgentStr}`;
        }
        return cliUserAgentStr;
    }
}

module.exports = DynamicConfig;
