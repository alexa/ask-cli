const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const awsProfileHandler = require('aws-profile-handler');

const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');
const helper = require('./aws-setup-helper');
const messages = require('./messages');
const ui = require('./ui');


module.exports = {
    startFlow,
    createAwsProfileFlow
};

function startFlow(isBrowser, askProfile, callback) {
    let awsProfileList;
    try {
        const awsPath = path.join(os.homedir(), CONSTANTS.FILE_PATH.AWS.HIDDEN_FOLDER, CONSTANTS.FILE_PATH.AWS.CREDENTIAL_FILE);
        awsProfileList = fs.existsSync(awsPath) ? awsProfileHandler.listProfiles(awsPath) : [];
    } catch (error) {
        return process.nextTick(() => {
            callback(error);
        });
    }
    // 1.confirm if using AWS profile from prompt
    ui.confirmSettingAws((setupChoice) => {
        if (!setupChoice) {
            console.log(messages.SKIP_AWS_INITIALIZATION);
            return callback();
        }
        // 2.check if using environment variable AWS profile
        helper.handleEnvironmentVariableAwsSetup(askProfile, (envVarErr, isAwsProfile) => {
            if (envVarErr) {
                return callback(envVarErr);
            }
            if (isAwsProfile) {
                return callback(null, isAwsProfile);
            }
            // 3.create new AWS profile or select and update the existing one
            if (awsProfileList.length === 0) {
                module.exports.createAwsProfileFlow(isBrowser, askProfile, awsProfileList, callback);
            } else {
                ui.createNewOrSelectAWSProfile(awsProfileList, (awsProfile) => {
                    if (awsProfile === 'Create new profile') {
                        module.exports.createAwsProfileFlow(isBrowser, askProfile, awsProfileList, callback);
                    } else {
                        profileHelper.setupProfile(awsProfile, askProfile);
                        callback(null, awsProfile);
                    }
                });
            }
        });
    });
}


function createAwsProfileFlow(isBrowser, askProfile, awsProfileList, callback) {
    // 1.create .aws folders if necessary
    try {
        const awsCredentialsFile = path.join(os.homedir(), '.aws', 'credentials');
        fs.ensureFileSync(awsCredentialsFile);
    } catch (error) {
        return callback(error);
    }
    // 2.profile name settle down
    helper.decideAwsProfileName(awsProfileList, (awsProfileName) => {
        // 3.create IAM user based on profile name
        const iamUserName = `ask-cli-${stringUtils.filterNonAlphanumeric(awsProfileName)}`;
        helper.openIamCreateUserPage(isBrowser, iamUserName, () => {
            // 4.let users input their AWS user credentials
            ui.addNewCredentials((credentialObject) => {
                awsProfileHandler.addProfile(awsProfileName, credentialObject);
                profileHelper.setupProfile(awsProfileName, askProfile);
                console.log(`\nAWS profile "${awsProfileName}" was successfully created. \
The details are recorded in aws credentials file ($HOME/.aws/credentials).`);
                callback(null, awsProfileName);
            });
        });
    });
}
