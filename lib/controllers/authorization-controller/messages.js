module.exports.AUTH_MESSAGE = 'Switch to "Login with Amazon" page and sign-in with your Amazon developer credentials.\n'
+ 'If your browser did not open the page, try to run the command again with "--no-browser" option.\n';

module.exports.PORT_OCCUPIED_WARN_MESSAGE = '[Warn]: 9090 port on localhost has been occupied, '
+ 'ask-cli cannot start a local server for receiving authorization code.\nPlease either abort any processes running on port 9090\n'
+ 'or add `--no-browser` flag to the command as an alternative approach.';

module.exports.ASK_SIGN_IN_SUCCESS_MESSAGE = `
<html>
    <head>
        <title>ask-cli Login with Amazon</title>
        <style>
            body {
                text-align: center;
            }
            .heading {
                background-color: #162A38;
            }
        </style>
    </head>
    <body>
        <p class="heading">
            <img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/avs/docs/ux/branding/mark1._TTH_.png"/>
        </p>
        <p style="text-align:center; background-color: rgb(167, 234, 255); line-height: 28px;">
            Sign in was successful. Close browser and return to the command line interface to continue the configure process.
        </p>
    </body>
</html>
`;

module.exports.ASK_SIGN_IN_FAILURE_MESSAGE = (error) => `
<html>
    <head>
        <title>ask-cli Login with Amazon</title>
        <style>
            body {
                text-align: center;
            }
            .heading {
                background-color: #162A38;
            }
        </style>
    </head>
    <body>
        <p class="heading">
            <img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/avs/docs/ux/branding/mark1._TTH_.png"/>
        </p>
        <p style="text-align:center; background-color: rgb(167, 234, 255); line-height: 28px;">
            ${error}
        </p>
    </body>
</html>
`;

module.exports.ASK_ENV_VARIABLES_ERROR_MESSAGE = 'Could not find either of the environment variables: ASK_ACCESS_TOKEN, ASK_REFRESH_TOKEN';
