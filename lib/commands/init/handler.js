const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');
const lwaUtil = require('@src/utils/lwa');
const stringUtils = require('@src/utils/string-utils');
const awsSetupWizard = require('./aws-setup-wizard');
const askSetupHelper = require('./ask-setup-helper');
const messages = require('./messages');
const ui = require('./ui');

const LIST_PAGE_SIZE = 50;

module.exports = {
    handleOptions
};

function handleOptions(options) {
    if (options && typeof options === 'string') {
        console.error(`[Error]: ${messages.INVALID_COMMAND_ERROR}`);
        process.exit(1);
    } else if (options.listProfiles) {
        profileHelper.displayProfile();
    } else {
        initProcessHandler(options);
    }
}

function initProcessHandler(options) {
    console.log(messages.ASK_CLI_INITIALIZATION_MESSAGE);
    // if first time creation (create the config file) or explicit profile setting, direct go to the init setup
    if (askSetupHelper.isFirstTimeCreation() || options.profile) {
        const askProfile = (options.profile || CONSTANTS.COMMAND.INIT.ASK_DEFAULT_PROFILE_NAME).trim();
        if (!profileHelper.askProfileSyntaxValidation(askProfile)) {
            console.error(`[Error]: ${messages.PROFILE_NAME_VALIDATION_ERROR}`);
            process.exit(1);
            return;
        }
        directInitProcess(options.browser, askProfile, options.debug);
    } else {
        listInitProcess(options.browser, options.debug);
    }
}

function directInitProcess(isBrowser, askProfile, doDebug) {
    // Step 1 ASK profile setup and VendorId retrieval
    lwaUtil.accessTokenGenerator(isBrowser, {}, (tokenGeneratorError, token) => {
        if (tokenGeneratorError) {
            console.error(`[Error]: ${tokenGeneratorError}`);
            process.exit(1);
            return;
        }
        askSetupHelper.setupAskConfig(token, askProfile, (configSetupError) => {
            if (configSetupError) {
                console.error(`[Error]: ${configSetupError}`);
                process.exit(1);
                return;
            }
            console.log(`ASK Profile "${askProfile}" was successfully created. The details are recorded in ask-cli config ($HOME/.ask/cli_config).`);
            askSetupHelper.setVendorId(askProfile, doDebug, (vendorIdError, vendorId) => {
                if (vendorIdError) {
                    console.error(`[Error]: ${vendorIdError}`);
                    process.exit(1);
                    return;
                }
                console.log(`Vendor ID set as ${vendorId}.`);
                console.log();
                // Step 2 AWS profile setup
                console.log(messages.AWS_INITIALIZATION_MESSAGE);
                awsSetupWizard.startFlow(isBrowser, askProfile, (resolveAwsProfileError, awsProfile) => {
                    if (resolveAwsProfileError) {
                        console.error(`[Error]: ${resolveAwsProfileError}`);
                        process.exit(1);
                        return;
                    }
                    if (awsProfile) {
                        console.log(`AWS profile "${awsProfile}" was successfully associated with your ASK profile "${askProfile}".`);
                    }
                    console.log();
                    console.log('------------------------- Initialization Complete -------------------------');
                    displayInitResult(askProfile, vendorId, awsProfile);
                    process.exit();
                });
            });
        });
    });
}

function listInitProcess(isBrowser, doDebug) {
    const profileList = profileHelper.stringFormatter(profileHelper.getListProfile());
    ui.createOrUpdateProfile(LIST_PAGE_SIZE, profileList, (error, askProfile) => {
        if (error) {
            console.error(`[Error]: ${messages.PROFILE_NAME_VALIDATION_ERROR}`);
            process.exit(1);
            return;
        }
        directInitProcess(isBrowser, askProfile, doDebug);
    });
}

function displayInitResult(askProfile, vendorId, awsProfile) {
    console.log('Here is the summary for the profile setup: ');
    console.log(`  ASK Profile: ${askProfile}`);
    if (stringUtils.isNonBlankString(awsProfile)) {
        console.log(`  AWS Profile: ${awsProfile}`);
    } else {
        console.log(`  No AWS profile linked to profile "${askProfile}"`);
    }
    console.log(`  Vendor ID: ${vendorId}`);
}
