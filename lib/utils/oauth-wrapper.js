'use strict';

const jsonRead = require('../utils/json-read');
const oauth2 = require('simple-oauth2');
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const os = require('os');

module.exports = {
    createOAuth: createOAuth,
    tokenRefreshAndRead: tokenRefreshAndRead,
    writeToken: writeToken
};

function createOAuth() {
    const CLIENT_ID = 'amzn1.application-oa2-client.aad322b5faab44b980c8f87f94fbac56';
    const CLIENT_SECRET = '1642d8869b829dda3311d6c6539f3ead55192e3fc767b9071c888e60ef151cf9';
    const AUTH_URL = {
        host: 'https://www.amazon.com',
        path: '/ap/oa'
    };
    const TOKEN_URL = {
        host: 'https://api.amazon.com',
        path: '/auth/o2/token'
    };
    return oauth2.create({
        client: {
            id: CLIENT_ID,
            secret: CLIENT_SECRET
        },
        auth: {
            authorizeHost: AUTH_URL.host,
            authorizePath: AUTH_URL.path,
            tokenHost: TOKEN_URL.host,
            tokenPath: TOKEN_URL.path
        }
    });
}

function tokenRefreshAndRead(params, callback) {
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
    if (!isTokenExpired()) {
        params.headers.Authorization = readAccessToken();
        callback(params);
    } else {
        refreshToken((refreshedToken) => {
            params.headers.Authorization = refreshedToken;
            callback(params);
        });
    }
}

function isTokenExpired() {
    let OAuth = module.exports.createOAuth();
    let token = OAuth.accessToken.create(readToken());
    return token.expired();
}

function readAccessToken() {
    let cliConfig = jsonRead.readFile(path.join(os.homedir(), '.ask', 'cli_config'));
    if (!cliConfig) {
        return;
    }
    return jsonRead.getProperty(cliConfig, '.profiles.default.token.access_token');
}

function refreshToken(callback) {
    let OAuth = module.exports.createOAuth();
    let oldToken = readToken();
    if (!oldToken) {
        return;
    }
    let token = OAuth.accessToken.create(oldToken);
    token.refresh((err, result) => {
        if (err) {
            console.error('Token refresh error. ' + err);
            return;
        } else {
            writeToken(result.token);
            callback(jsonRead.getProperty(result, '.token.access_token'));
        }
    });
}

function readToken() {
    let cliConfig = jsonRead.readFile(path.join(os.homedir(), '.ask', 'cli_config'));
    if (!cliConfig) {
        return;
    }
    let token = jsonRead.getProperty(cliConfig, '.profiles.default.token');
    if (!token) {
        return;
    }
    return {
        'access_token': token.access_token,
        'refresh_token': token.refresh_token,
        'token_type': token.token_type,
        'expires_in': token.expires_in,
        'expires_at': token.expires_at
    };
}

function writeToken(token) {
    let configPath = path.join(os.homedir(), '.ask', 'cli_config');
    let config = jsonRead.readFile(configPath);
    if (!config) {
        return;
    }
    let configToken = {
        'access_token': token.access_token,
        'refresh_token': token.refresh_token,
        'token_type': token.token_type,
        'expires_in': token.expires_in,
        'expires_at': token.expires_at
    };
    config.profiles.default.token = configToken;
    jsonfile.writeFileSync(configPath, config, {spaces: 2});
}
