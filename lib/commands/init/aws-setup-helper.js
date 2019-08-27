const querystring = require('querystring');
const opn = require('opn');

const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');
const ui = require('./ui');
const messages = require('./messages');

module.exports = {
    handleEnvironmentVariableAwsSetup,
    decideAwsProfileName,
    openIamCreateUserPage
};

function handleEnvironmentVariableAwsSetup(askProfile, callback) {
    if (!_hasEnvironmentVariables()) {
        return process.nextTick(() => {
            callback(null, false);
        });
    }
    ui.selectEnvironmentVariables((selectEnvVarChoice) => {
        if (selectEnvVarChoice === 'No') {
            callback(null, false);
        } else {
            profileHelper.setupProfile(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS, askProfile);
            callback(null, CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
        }
    });
}

function _hasEnvironmentVariables() {
    const accessKeyID = process.env.AWS_ACCESS_KEY_ID;
    const accessSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    return stringUtils.isNonBlankString(accessKeyID) && stringUtils.isNonBlankString(accessSecretKey);
}

function decideAwsProfileName(awsProfileList, callback) {
    if (awsProfileList.length === 0) {
        // if the credential file is empty, CLI will name the first profile as 'ask_cli_default'
        process.nextTick(() => callback(CONSTANTS.COMMAND.INIT.AWS_DEFAULT_PROFILE_NAME));
    } else {
        ui.requestAwsProfileName(awsProfileList, (userInputName) => {
            callback(userInputName);
        });
    }
}

function openIamCreateUserPage(isBrowser, userName, callback) {
    const params = {
        accessKey: true,
        step: 'review',
        userNames: userName,
        permissionType: 'policies',
        policies: [
            CONSTANTS.AWS.IAM.POLICY_ARN.IAM_FULL,
            CONSTANTS.AWS.IAM.POLICY_ARN.CFN_FULL,
            CONSTANTS.AWS.IAM.POLICY_ARN.S3_FULL,
            CONSTANTS.AWS.IAM.POLICY_ARN.LAMBDA_FULL
        ]
    };
    const awsIamUrl = `${CONSTANTS.AWS.IAM.NEW_USER_BASE_URL}${querystring.stringify(params)}`;
    console.log(messages.AWS_CREATE_PROFILE_TITLE);
    if (isBrowser) {
        setTimeout(() => {
            opn(awsIamUrl);
            callback();
        }, CONSTANTS.CONFIGURATION.OPN_BROWSER_DELAY);
    } else {
        console.log(messages.AWS_CREATE_PROFILE_NO_BROWSER_OPEN_BROWSER);
        console.log(`    ${awsIamUrl}`);
        process.nextTick(() => {
            callback();
        });
    }
}
