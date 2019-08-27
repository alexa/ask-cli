const opn = require('opn');
const http = require('http');
const url = require('url');
const inquirer = require('inquirer');
const portscanner = require('portscanner');

const SpinnerView = require('@src/view/spinner-view');
const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const LWA_AUTH_MESSAGE = 'Switch to "Login with Amazon" page and sign-in with your Amazon developer credentials.\n'
+ 'If your browser did not open the page, run the initialization process again with command "ask init --no-browser".';

module.exports = {
    accessTokenGenerator,
    _requestTokens,
    _getAuthCode,
    _listenResponseFromLWA
};

/**
* Use LWA OAuth2 to retrieve access tokens.
* @param needBrowser
* @param lwaOptions contains clientId, clientSecret, scopes and state
* @param callback  Json object which includes:
*                 'access_token', 'refresh_token', 'token_type', 'expires_in', and 'expires_at'
*/
function accessTokenGenerator(needBrowser, lwaOptions, callback) {
    const {
        clientId,
        clientSecret,
        scopes = CONSTANTS.LWA.DEFAULT_SCOPES,
        state = CONSTANTS.LWA.DEFAULT_STATE
    } = lwaOptions;

    const OAuth = oauthWrapper.createOAuth(clientId, clientSecret);

    if (!needBrowser) {
        // prepare url which the user can use to call LWA
        const authorizeUrl = OAuth.authorizationCode.authorizeURL({
            redirect_uri: CONSTANTS.LWA.S3_RESPONSE_PARSER_URL,
            scope: scopes,
            state
        });
        console.log(`Paste the following url to your browser:\n    ${authorizeUrl}`);

        _getAuthCode((authCode) => {
            _requestTokens(authCode, CONSTANTS.LWA.S3_RESPONSE_PARSER_URL, OAuth, callback);
        });
    } else {
        const PORT = 9090;
        portscanner.checkPortStatus(PORT, (error, status) => {
            if (error) {
                callback(error);
            } else {
                if (status === 'closed') {
                    // if the port haven't being used, start a server and listen to
                    // lwa response which has the authorization code.
                    const localServerUrl = `http://127.0.0.1:${PORT}/cb`;
                    const authorizeUrl = OAuth.authorizationCode.authorizeURL({
                        redirect_uri: localServerUrl,
                        scope: scopes,
                        state
                    });

                    // call LWA on behalf of the user
                    console.log(LWA_AUTH_MESSAGE);
                    setTimeout(() => {
                        opn(authorizeUrl);
                    }, CONSTANTS.CONFIGURATION.OPN_BROWSER_DELAY);

                    _listenResponseFromLWA(PORT, (error, authCode) => {
                        if (error) {
                            return callback(error);
                        }
                        _requestTokens(authCode, localServerUrl, OAuth, callback);                        
                    });
                } else {
                    console.warn('[Warn]: 9090 port on localhost has been occupied, '
                    + 'ask-cli cannot start a local server for receiving authorization code.');
                    console.warn('Please either abort any processes running on port 9090\n'
                    + 'or add `--no-browser` flag to the command as an alternative approach.');
                }
            }
        });
    }
}

/**
* Ask the auth code from the user.
* @param callback Authorization code
* @private
*/
function _getAuthCode(callback) {
    inquirer.prompt([
        {
            type: 'input',
            name: 'authCode',
            message: 'Please enter the Authorization Code: ',
            validate: (value) => {
                let pass = value.trim();
                if (!pass) {
                    return 'Please enter a valid Authorization Code.';
                }
                return true;
            }
        }
    ]).then(
        (answer) => {
            callback(answer.authCode);
        }
    );
}

/**
* Use the auth code to retrieve access token and other associated info from LWA.
* @param authCode
* @param redirect_uri
* @param OAuth
* @param callback Json object which includes:
*                 'access_token', 'refresh_token', 'token_type', 'expires_in', and 'expires_at'
* @private
*/
function _requestTokens(authCode, redirect_uri, OAuth, callback) {
    let tokenConfig = {
        code: authCode,
        redirect_uri: redirect_uri
    };

    OAuth.authorizationCode.getToken(tokenConfig, (error, result) => {
        if (error) {
            callback('Cannot obtain access token. ' + error);
        } else {
            let token = OAuth.accessToken.create(result).token;
            callback(null, token);
        }
    });
}

/**
* Start a local server and listen the response from LWA,
* then extract authorization code from it.
* @param PORT
* @param OAuth
* @param callback Authorization code
* @private
*/
function _listenResponseFromLWA(PORT, callback) {
    let listenSpinner;
    const server = http.createServer(handleServerRequest);
    server.on('connection', (socket) => {
        socket.unref();
        return;
    });
    server.listen(PORT, () => {
        listenSpinner = new SpinnerView();
        listenSpinner.start(` Listening on http://localhost:${PORT}...`);
    });

    function handleServerRequest(request, response) {
        response.on('close', () => {
            request.socket.destroy();
        });
        const requestQuery = url.parse(request.url, true).query;
        listenSpinner.terminate();
        server.close();
        server.unref();
        if (request.url.startsWith('/cb?code')) {
            response.end('Sign in was successful. Close browser and return to the command line interface.');
            const authCode = requestQuery.code;
            callback(null, authCode);
        } else if (request.url.startsWith('/cb?error')) {
            response.statusCode = 403;
            response.end(`Error: ${requestQuery.error}\nError description: ${requestQuery.error_description}`);
            callback('Access not granted. Please verify your account credentials are correct.\nIf this is your first time getting the error, '
            + 'please retry "ask init" to ensure any browser-cached tokens are refreshed.');
        }
    }
}
