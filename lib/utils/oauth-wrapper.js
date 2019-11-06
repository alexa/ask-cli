const oauth2 = require('simple-oauth2');
const path = require('path');
const fs = require('fs');
const os = require('os');
const stringUtils = require('@src/utils/string-utils');
const jsonRead = require('@src/utils/json-read');
const jsonUtility = require('@src/utils/json-utility');
const CONSTANTS = require('@src/utils/constants');

module.exports = {
    createOAuth,
    tokenRefreshAndRead,
    writeToken
};

/* If you want to create tools to call SMAPI(Skill Management API),
 * please create your own clientId and ClientConfirmation through LWA (login with Amazon).
 * https://login.amazon.com/website.
 *
 * You can find necessary scopes for LWA to call SMAPI here:
 * https://developer.amazon.com/docs/smapi/ask-cli-intro.html#smapi-intro
 */

function createOAuth(inputClientId, inputClientConfirmation) {
    // Set default CLI LWA value
    let clientId = inputClientId || CONSTANTS.LWA.CLI_INTERNAL_ONLY_LWA_CLIENT.CLIENT_ID;
    let clientConfirmation = inputClientConfirmation || CONSTANTS.LWA.CLI_INTERNAL_ONLY_LWA_CLIENT.CLIENT_CONFIRMATION;
    let authorizeHost = 'https://www.amazon.com';
    const authorizePath = '/ap/oa';
    let tokenHost = 'https://api.amazon.com';
    const tokenPath = '/auth/o2/token';

    // Overrite LWA options from Environmental Variable
    const envVarClientId = process.env.ASK_LWA_CLIENT_ID;
    if (stringUtils.isNonBlankString(envVarClientId)) {
        clientId = envVarClientId;
    }
    const envVarClientConfirmation = process.env.ASK_LWA_CLIENT_CONFIRMATION;
    if (stringUtils.isNonBlankString(envVarClientConfirmation)) {
        clientConfirmation = envVarClientConfirmation;
    }
    const envVarAuthorizeHost = process.env.ASK_LWA_AUTHORIZE_HOST;
    if (stringUtils.isNonBlankString(envVarAuthorizeHost)) {
        authorizeHost = envVarAuthorizeHost;
    }
    const envVarTokenHost = process.env.ASK_LWA_TOKEN_HOST;
    if (stringUtils.isNonBlankString(envVarTokenHost)) {
        tokenHost = envVarTokenHost;
    }

    return oauth2.create({
        client: { id: clientId, secret: clientConfirmation },
        auth: { authorizeHost, authorizePath, tokenHost, tokenPath }
    });
}

function tokenRefreshAndRead(params, profile, callback) {
    if (profile === CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
        // if there's refreshToken, use that first since this profile is using env var,
        // cannot find whether accessToken expired or not.
        const askRefreshToken = process.env.ASK_REFRESH_TOKEN;
        if (stringUtils.isNonBlankString(askRefreshToken)) {
            refreshToken(profile, (refreshedAccessToken) => {
                params.headers.Authorization = refreshedAccessToken;
                callback();
            });
            return;
        }

        // if no refreshToken, fallback to accessToken
        const askAccessToken = process.env.ASK_ACCESS_TOKEN;
        if (stringUtils.isNonBlankString(askAccessToken)) {
            params.headers.Authorization = askAccessToken;
            callback();
        }
        return;
    }
    if (!fs.existsSync(path.join(os.homedir(), '.ask'))) {
        console.warn('Failed to get authorization information.\n' +
            'Please run "ask init" to initialize ASK cli.');
        return;
    }
    if (!fs.existsSync(path.join(os.homedir(), '.ask', 'cli_config'))) {
        console.warn('Failed to get CLI config.\n' +
            'Please run "ask init" to initialize ASK cli.');
        return;
    }
    if (!isTokenExpired(profile)) {
        params.headers.Authorization = readAccessToken(profile);
        callback();
    } else {
        refreshToken(profile, (refreshedAccessToken) => {
            params.headers.Authorization = refreshedAccessToken;
            callback();
        });
    }
}

function isTokenExpired(profile) {
    const OAuth = module.exports.createOAuth();
    const token = OAuth.accessToken.create(readToken(profile));

    return token.expired();
}

function readAccessToken(profile) {
    const cliConfig = jsonRead.readFile(path.join(os.homedir(), '.ask', 'cli_config'));
    if (!cliConfig) {
        return;
    }
    return jsonRead.getProperty(cliConfig, '.profiles.' + profile + '.token.access_token');
}

function refreshToken(profile, callback) {
    const OAuth = module.exports.createOAuth();
    const oldToken = readToken(profile);
    if (!oldToken) {
        return;
    }
    const token = OAuth.accessToken.create(oldToken);
    token.refresh((err, result) => {
        if (err) {
            console.error(err + '\nFailed to refresh access token.');
            return process.exit(1);
        }
        if (profile === CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
            callback(result.token.access_token);
        } else {
            writeToken(result.token, profile);
            callback(jsonRead.getProperty(result, '.token.access_token'));
        }
    });
}

function readToken(profile) {
    if (profile === CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
        return {
            'access_token': "ACCESS_TOKEN_PLACE_HOLDER",
            'refresh_token': process.env.ASK_REFRESH_TOKEN,
            'token_type': 'bearer',
            'expires_in': 0,
            'expires_at': 0
        };
    }
    const cliConfig = jsonRead.readFile(path.join(os.homedir(), '.ask', 'cli_config'));
    if (!cliConfig) {
        return;
    }
    const token = jsonRead.getProperty(cliConfig, '.profiles.' + profile + '.token');
    if (!token) {
        return;
    }
    return {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_type: token.token_type,
        expires_in: token.expires_in,
        expires_at: token.expires_at
    };
}

function writeToken(token, profile) {
    const configPath = path.join(os.homedir(), '.ask', 'cli_config');
    const configToken = {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_type: token.token_type,
        expires_in: token.expires_in,
        expires_at: token.expires_at
    };
    const propertyPathArray = ['profiles', profile, 'token'];
    jsonUtility.writeToProperty(configPath, propertyPathArray, configToken);
}
