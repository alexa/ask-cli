'use strict';

const oauthWrapper = require('../utils/oauth-wrapper');
const Spinner = require('clui').Spinner;
const opn = require('opn');
const http = require('http');
const url = require('url');
const inquirer = require('inquirer');
const profileHelper = require('../utils/profile-helper');

const SCOPES_SKILLS_READWRITE = 'alexa::ask:skills:readwrite';
const SCOPES_MODELS_READWRITE = 'alexa::ask:models:readwrite';
const SCOPES_SKILLS_TEST = 'alexa::ask:skills:test';

// Public
module.exports.login = (needBrowser, profile, callback) => {
    const SCOPES = SCOPES_SKILLS_READWRITE + ' ' +
                   SCOPES_MODELS_READWRITE + ' ' +
                   SCOPES_SKILLS_TEST;
    let OAuth = oauthWrapper.createOAuth();
    if (needBrowser) {
        const PORT = 9090;
        const REDIRECT_URI = 'http://127.0.0.1:' + PORT + '/cb';
        requestAuth(REDIRECT_URI, SCOPES, OAuth);
        listenToServer(PORT, REDIRECT_URI, OAuth, profile, callback);
    } else if (needBrowser === false) {
        const REDIRECT_URI = 'https://s3.amazonaws.com/ask-cli-html-page/response_parser.html';
        requestAuthNoBrowser(REDIRECT_URI, SCOPES, OAuth);
        passAuthcode(REDIRECT_URI, OAuth, profile, callback);
    } else {
        console.error('[Error]: Invalid extra argument. Please run "ask init -h" for help.');
    }
};

// Private
function getTokens(REDIRECT_URI, authCode, OAuth, profile, callback) {
    let tokenConfig = {
        code: authCode,
        redirect_uri: REDIRECT_URI
    };
    OAuth.authorizationCode.getToken(tokenConfig, (err, result) => {
        if (err) {
            profileHelper.deleteProfile(profile);
            console.error('Access token failed. ' + err);
        } else {
            let token = OAuth.accessToken.create(result).token;
            oauthWrapper.writeToken(token, profile);
            console.log('Tokens fetched and recorded in ask-cli config.');
            callback();
        }
    });
}

function requestAuth(REDIRECT_URI, SCOPES, OAuth) {
    const STATE = 'Ask-SkillModel-ReadWrite';
    let authRequestUrl = OAuth.authorizationCode.authorizeURL({
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        state: STATE
    });
    opn(authRequestUrl);
    console.log('Switch to \'Login with Amazon\' page...');
}

function listenToServer(PORT, REDIRECT_URI, Oauth, profile, callback) {
    let listenSpinner;
    let server = http.createServer(handleServerRequest);
    server.on('connection', (socket) => {
        socket.unref();
    });
    server.listen(PORT, () => {
        listenSpinner = new Spinner(' Listening on http://localhost:' + PORT);
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
            response.end('Sign in was successful. Close this browser and return to the command line interface.');
            let authCode = requestQuery.code;
            getTokens(REDIRECT_URI, authCode, Oauth, profile, callback);
        } else if (request.url.startsWith('/cb?error')) {
            response.statusCode = 403;
            response.end('Error: ' + requestQuery.error +
                '\nError description: ' + requestQuery.error_description);
            profileHelper.deleteProfile(profile);
            console.error('Access not granted.');
            process.exit(1);
        }
    }
}

function passAuthcode(REDIRECT_URI, OAuth, profile, callback){
    let question = [
        {
            type: 'input',
            name: 'authCode',
            message: 'Please enter your Authorization Code: '
        }
    ];
    inquirer.prompt(question).then(
        (answer) => {
            getTokens(REDIRECT_URI, answer.authCode, OAuth, profile, callback);
        }
    );
}

function requestAuthNoBrowser(REDIRECT_URI, SCOPES, OAuth) {
    const STATE = 'Ask-SkillModel-ReadWrite';
    let authRequestUrl = OAuth.authorizationCode.authorizeURL({
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        state: STATE
    });
    console.log('Paste the following url to your browser:\n', '        ' + authRequestUrl, '\n');
}
