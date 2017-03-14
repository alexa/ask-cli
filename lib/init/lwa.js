'use strict';

const oauthWrapper = require('../utils/oauth-wrapper');
const Spinner = require('clui').Spinner;
const opn = require('opn');
const http = require('http');
const url = require('url');

// Public
module.exports.login = (callback) => {
    const PORT = 9090;
    const REDIRECT_URI = 'http://127.0.0.1:' + PORT + '/cb';
    const SCOPES = 'alexa::ask:skills:readwrite alexa::ask:models:readwrite';
    let OAuth = oauthWrapper.createOAuth();
    requestAuth(REDIRECT_URI, SCOPES, OAuth);
    listenToServer(PORT, REDIRECT_URI, OAuth, callback);
};

// Private
function requestAuth(REDIRECT_URI, SCOPES, OAuth) {
    const STATE = 'Ask-SkillModel-ReadWrite';
    let authRequestUrl = OAuth.authorizationCode.authorizeURL({
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        state: STATE
    });
    opn(authRequestUrl);
    console.log('Switch to Login with Amazon page...');
}

function listenToServer(PORT, REDIRECT_URI, Oauth, callback) {
    let listenSpinner;
    let server = http.createServer(handleServerRequest);
    server.on('connection', (socket) => {
        socket.unref();
    });
    server.listen(PORT, () => {
        listenSpinner = new Spinner('Listening on http://localhost:' + PORT);
        listenSpinner.start();
    });

    function handleServerRequest(request, response) {
        response.on('close', () => {
            request.socket.destroy();
        });
        let requestQuery = url.parse(request.url, true).query;
        listenSpinner.stop();
        server.close();
        server.unref();
        if (request.url.startsWith('/cb?code')) {
            response.end('Sign in was successful. Close this browser and return to the command prompt.');
            let authCode = requestQuery.code;
            getTokens(REDIRECT_URI, authCode, Oauth, callback);
        } else if (request.url.startsWith('/cb?error')) {
            response.statusCode = 403;
            response.end('Error: ' + requestQuery.error +
                '\nError description: ' + requestQuery.error_description);
            console.error('Access not granted.');
            process.exit();
        }
    }
}

function getTokens(REDIRECT_URI, authCode, OAuth, callback) {
    let tokenConfig = {
        code: authCode,
        redirect_uri: REDIRECT_URI
    };
    OAuth.authorizationCode.getToken(tokenConfig, (err, result) => {
        if (err) {
            console.error('Access token failed. ' + err);
        } else {
            let token = OAuth.accessToken.create(result).token;
            oauthWrapper.writeToken(token);
            console.log('Tokens fetched and written to cli config.');
            callback();
        }
    });
}
