const AppConfig = require('@src/model/app-config');
const Messenger = require('@src/view/messenger');

const askProfileSetupHelper = require('./ask-profile-setup-helper');
const awsProfileSetupHelper = require('./aws-profile-setup-helper');
const messages = require('./messages');

module.exports = {
    initiateAskProfileSetup
};

/**
 * Initialization process for a new profile.
 * @param {Object} config
 * @param {Function} callback
 */
function initiateAskProfileSetup(config, callback) {
    Messenger.getInstance().warn(messages.LWA_TOKEN_SHARE_WARN_MESSAGE);
    askProfileSetupHelper.setupAskToken(config, (accessTokenError, accessToken) => {
        if (accessTokenError) {
            return callback(accessTokenError);
        }
        AppConfig.getInstance().setToken(config.askProfile, accessToken);
        Messenger.getInstance().info(`ASK Profile "${config.askProfile}" was successfully created. `
        + 'The details are recorded in ask-cli config file (.ask/cli_config) located at your **HOME** folder.');
        AppConfig.getInstance().write();

        askProfileSetupHelper.setupVendorId(config, (vendorIdError, vendorId) => {
            if (vendorIdError) {
                return callback(vendorIdError);
            }
            AppConfig.getInstance().setVendorId(config.askProfile, vendorId);
            Messenger.getInstance().info(`Vendor ID set as ${vendorId}.\n`);
            AppConfig.getInstance().write();

            Messenger.getInstance().info(messages.AWS_CONFIGURATION_MESSAGE);
            Messenger.getInstance().warn(messages.AWS_SECRET_ACCESS_KEY_AND_ID_SHARE_WARN_MESSAGE);
            awsProfileSetupHelper.setupAwsProfile(config, (awsProfileError, awsProfile) => {
                if (awsProfileError) {
                    return callback(awsProfileError);
                }
                if (awsProfile) {
                    Messenger.getInstance().info(`AWS profile "${awsProfile}" was successfully `
                    + `associated with your ASK profile "${config.askProfile}".\n`);
                }
                AppConfig.getInstance().setAwsProfile(config.askProfile, awsProfile);
                callback(null, config.askProfile);
            });
        });
    });
}
