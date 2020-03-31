const awsProfileHandler = require('aws-profile-handler');
const fs = require('fs-extra');
const open = require('open');
const os = require('os');
const path = require('path');
const querystring = require('querystring');

const CONSTANTS = require('@src/utils/constants');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');

const messages = require('./messages');
const ui = require('./ui');

module.exports = {
    setupAwsProfile,
};

/**
 * Initiates Aws profile setup.
 * @param {Object} config
 * @param {Function} callback
 */
function setupAwsProfile(config, callback) {
    let awsProfileList;
    try {
        const awsPath = path.join(os.homedir(), CONSTANTS.FILE_PATH.AWS.HIDDEN_FOLDER, CONSTANTS.FILE_PATH.AWS.CREDENTIAL_FILE);
        awsProfileList = fs.existsSync(awsPath) ? awsProfileHandler.listProfiles(awsPath) : [];
    } catch (error) {
        return process.nextTick(() => {
            callback(error);
        });
    }
    _initiateAwsProfileSetup(config, awsProfileList, (err, awsProfile) => callback(err, err === null ? awsProfile : err));
}

/**
 * Initiate aws profile setup.
 * @param {Object} config
 * @param {Array} awsProfileList
 * @param {Function} callback
 * @private
 */
function _initiateAwsProfileSetup(config, awsProfileList, callback) {
    // 1.confirm if using AWS profile from prompt
    ui.confirmSettingAws((setUpError, setupChoice) => {
        if (setUpError) {
            return callback(setUpError);
        }
        if (!setupChoice) {
            Messenger.getInstance().info(messages.SKIP_AWS_CONFIGURATION);
            return callback();
        }
        // 2.check if using environment variable AWS profile
        _handleEnvironmentVariableAwsSetup(config, (envVarErr, isAwsProfile) => {
            if (envVarErr) {
                return callback(envVarErr);
            }
            if (isAwsProfile) {
                return callback(null, isAwsProfile);
            }
            // 3.create new AWS profile or select and update the existing one
            if (awsProfileList.length === 0) {
                _createAwsProfileFlow(config, awsProfileList, (error, awsProfile) => callback(error, error === null ? awsProfile : error));
            } else {
                ui.createNewOrSelectAWSProfile(awsProfileList, (err, awsProfile) => {
                    if (err) {
                        return callback(err);
                    }
                    if (awsProfile === 'Create new profile') {
                        _createAwsProfileFlow(config, awsProfileList, (error, newAwsProfile) => {
                            if (error) {
                                return callback(error);
                            }
                            callback(null, newAwsProfile);
                        });
                    } else {
                        profileHelper.setupProfile(awsProfile, config.askProfile);
                        callback(null, awsProfile);
                    }
                });
            }
        });
    });
}

/**
 * Creates config folders, IAM roles based on input credentials.
 * @param {Object} config
 * @param {Array} awsProfileList
 * @param {Function} callback
 * @private
 */
function _createAwsProfileFlow(config, awsProfileList, callback) {
    // 1.create .aws folders if necessary
    try {
        const awsCredentialsFile = path.join(os.homedir(), CONSTANTS.FILE_PATH.AWS.HIDDEN_FOLDER, CONSTANTS.FILE_PATH.AWS.CREDENTIAL_FILE);
        fs.ensureFileSync(awsCredentialsFile);
        fs.chmodSync(awsCredentialsFile, CONSTANTS.FILE_PERMISSION.USER_READ_WRITE);
    } catch (error) {
        return callback(error);
    }
    // 2.profile name settle down
    _decideAwsProfileName(awsProfileList, (error, awsProfileName) => {
        if (error) {
            return callback(error);
        }
        // 3.create IAM user based on profile name
        const iamUserName = `ask-cli-${stringUtils.filterNonAlphanumeric(awsProfileName)}`;
        _openIamCreateUserPage(config.needBrowser, iamUserName, () => {
            // 4.let users input their AWS user credentials
            ui.addNewCredentials((err, credentialObject) => {
                if (err) {
                    return callback(error);
                }
                awsProfileHandler.addProfile(awsProfileName, credentialObject);
                profileHelper.setupProfile(awsProfileName, config.askProfile);
                Messenger.getInstance().info(`\nAWS profile "${awsProfileName}" was successfully created. \
The details are recorded in aws credentials file (.aws/credentials) located at your **HOME** folder.`);
                callback(null, awsProfileName);
            });
        });
    });
}

/**
 * requests selection of profile setup using environment variables.
 * @param {Function} callback
 * @private
 */
function _handleEnvironmentVariableAwsSetup(config, callback) {
    if (!_hasEnvironmentVariables()) {
        return process.nextTick(() => {
            callback(null, false);
        });
    }
    ui.selectEnvironmentVariables((err, selectEnvVarChoice) => {
        if (err) {
            return callback(err);
        }
        if (selectEnvVarChoice === 'No') {
            callback(null, false);
        } else {
            profileHelper.setupProfile(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS, config.askProfile);
            callback(null, CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
        }
    });
}

/**
 * Checks existence of environment variables.
 * @private
 */
function _hasEnvironmentVariables() {
    const accessKeyID = process.env.AWS_ACCESS_KEY_ID;
    const accessSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    return stringUtils.isNonBlankString(accessKeyID) && stringUtils.isNonBlankString(accessSecretKey);
}

/**
 * Opens IAM create user page for confirmation of permissions.
 * @param {Boolean} isBrowser
 * @param {String} userName
 * @param {Function} callback
 * @private
 */
function _openIamCreateUserPage(isBrowser, userName, callback) {
    const params = {
        accessKey: true,
        step: 'review',
        userNames: userName,
        permissionType: 'policies',
        policies: [
            CONSTANTS.AWS.IAM.USER.POLICY_ARN.IAM_FULL,
            CONSTANTS.AWS.IAM.USER.POLICY_ARN.CFN_FULL,
            CONSTANTS.AWS.IAM.USER.POLICY_ARN.S3_FULL,
            CONSTANTS.AWS.IAM.USER.POLICY_ARN.LAMBDA_FULL
        ]
    };
    const awsIamUrl = `${CONSTANTS.AWS.IAM.USER.NEW_USER_BASE_URL}${querystring.stringify(params)}`;
    Messenger.getInstance().info(messages.AWS_CREATE_PROFILE_TITLE);
    if (isBrowser) {
        setTimeout(() => {
            open(awsIamUrl);
            callback();
        }, CONSTANTS.CONFIGURATION.OPEN_BROWSER_DELAY);
    } else {
        Messenger.getInstance().info(messages.AWS_CREATE_PROFILE_NO_BROWSER_OPEN_BROWSER);
        Messenger.getInstance().info(`    ${awsIamUrl}`);
        process.nextTick(() => {
            callback();
        });
    }
}

/**
 * Requests for confirmation of AWS profle name.
 * @param {Array} awsProfileList
 * @param {Function} callback
 * @private
 */
function _decideAwsProfileName(awsProfileList, callback) {
    if (awsProfileList.length === 0) {
        // if the credential file is empty, CLI will name the first profile as 'ask_cli_default'
        process.nextTick(() => callback(null, CONSTANTS.AWS_DEFAULT_PROFILE_NAME));
    } else {
        ui.requestAwsProfileName(awsProfileList, (error, userInputName) => {
            if (error) {
                return callback(error);
            }
            callback(null, userInputName);
        });
    }
}
