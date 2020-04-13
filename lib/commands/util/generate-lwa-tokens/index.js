const { AbstractCommand } = require('@src/commands/abstract-command');
const configureUi = require('@src/commands/configure/ui');
const optionModel = require('@src/commands/option-model');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');

class GenerateLwaTokensCommand extends AbstractCommand {
    name() {
        return 'generate-lwa-tokens';
    }

    description() {
        return 'generate Login with Amazon tokens from any LWA client';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['client-id', 'client-confirmation', 'scopes', 'no-browser', 'debug'];
    }

    handle(cmd, cb) {
        const authConfig = {
            auth_client_type: 'LWA',
            clientId: cmd.clientId,
            clientConfirmation: cmd.clientConfirmation,
            scope: cmd.scopes,
            doDebug: cmd.debug
        }; // redirect_url must be pre-set depending on the CLI mode and with the trusted domain

        if (cmd.browser === false) {
            authConfig.redirectUri = CONSTANTS.LWA.S3_RESPONSE_PARSER_URL;
            const lwaController = new AuthorizationController(authConfig);
            const authorizeUrl = lwaController.getAuthorizeUrl();
            Messenger.getInstance().info(`Paste the following url to your browser:\n    ${authorizeUrl}`);
            configureUi.getAuthCode((uiErr, authCode) => {
                if (uiErr) {
                    Messenger.getInstance().error(uiErr);
                    return cb(uiErr);
                }
                lwaController.getAccessTokenUsingAuthCode(authCode, (getTokenErr, accessToken) => {
                    if (getTokenErr) {
                        Messenger.getInstance().error(getTokenErr);
                        return cb(getTokenErr);
                    }
                    Messenger.getInstance().info('\nThe LWA tokens result:');
                    Messenger.getInstance().info(jsonView.toString(accessToken));
                    return cb();
                });
            });
        } else {
            authConfig.redirectUri = `http://127.0.0.1:${CONSTANTS.LWA.LOCAL_PORT}/cb`;
            const lwaController = new AuthorizationController(authConfig);
            lwaController.getTokensByListeningOnPort((browserGetTokenErr, accessToken) => {
                if (browserGetTokenErr) {
                    Messenger.getInstance().error(browserGetTokenErr);
                    return cb(browserGetTokenErr);
                }
                Messenger.getInstance().info('The LWA tokens result:');
                Messenger.getInstance().info(jsonView.toString(accessToken));
                cb();
            });
        }
    }
}

module.exports = GenerateLwaTokensCommand;
module.exports.createCommand = new GenerateLwaTokensCommand(optionModel).createCommand();
