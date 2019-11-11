module.exports.AUTH_MESSAGE = 'Switch to "Login with Amazon" page and sign-in with your Amazon developer credentials.\n'
+ 'If your browser did not open the page, run the configuration process again with command "ask configure --no-browser".\n';

module.exports.PORT_OCCUPIED_WARN_MESSAGE = '[Warn]: 9090 port on localhost has been occupied, '
+ 'ask-cli cannot start a local server for receiving authorization code.\nPlease either abort any processes running on port 9090\n'
+ 'or add `--no-browser` flag to the command as an alternative approach.';

module.exports.ASK_SIGN_IN_SUCCESS_MESSAGE = 'Sign in was successful. Close browser and return to the command line interface.';

module.exports.ASK_ENV_VARIABLES_ERROR_MESSAGE = 'Could not find either of the environment variables: ASK_ACCESS_TOKEN, ASK_REFRESH_TOKEN';
