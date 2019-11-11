const inquirer = require('inquirer');
const Messenger = require('@src/view/messenger');
const stringUtils = require('@src/utils/string-utils');

const messages = require('./messages');
const questions = require('./questions');

module.exports = {
    createNewProfile,
    chooseVendorId,
    requestAwsProfileName,
    confirmSettingAws,
    selectEnvironmentVariables,
    addNewCredentials,
    createOrUpdateProfile,
    createNewOrSelectAWSProfile,
    getAuthCode,
    profileFormatter
};

/**
* Ask the auth code from the user.
* @param callback Authorization code
* @private
*/
function getAuthCode(callback) {
    inquirer.prompt(questions.REQUEST_AUTH_CODE).then((answer) => {
        callback(null, answer.authCode);
    }).catch((error) => {
        callback(error);
    });
}

// ASK profile setup flow

/**
* Requests for a new profile name.
* @param {Function} callback
*/
function createNewProfile(callback) {
    inquirer.prompt(questions.REQUEST_ASK_PROFILE_NAME).then((answer) => {
        const newProfileName = answer.profile.trim();
        if (!stringUtils.validateSyntax('PROFILE_NAME', newProfileName)) {
            return callback(messages.PROFILE_NAME_VALIDATION_ERROR);
        }
        callback(null, newProfileName);
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Requests selection of a vendor ID (if multiple exist).
 * @param {Number} VENDOR_PAGE_SIZE | vendor page size.
 * @param {Object} vendorInfo | object encapsulating vendor name and ID.
 * @param {Function} callback
 */
function chooseVendorId(VENDOR_PAGE_SIZE, vendorInfo, callback) {
    const question = questions.SELECT_VENDOR_ID;
    question[0].pageSize = VENDOR_PAGE_SIZE;
    question[0].choices = _buildVendorJSONString(vendorInfo);
    inquirer.prompt(question).then((answers) => {
        const vendorId = answers.selectedVendor.substr(answers.selectedVendor.lastIndexOf(':') + 2);
        callback(null, vendorId);
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Helper function to map vendor info object to a string.
 * @param {Object} vendorInfo | object encapsulating vendor name and ID.
 */
function _buildVendorJSONString(vendorInfo) {
    return vendorInfo.map(vendor => `${vendor.name}: ${vendor.id}`);
}

/**
 * Requests confirmation for creation of new profile or update existing profile.
 * @param {Function} callback
 */
function createOrUpdateProfile(profiles, callback) {
    const profileList = profileFormatter(profiles);
    const NUMBER_OF_PROFILES_PER_PAGE = 50;
    const HEADER = 'Profile              Associated AWS Profile';
    const CREATE_PROFILE_MESSAGE = 'Create new profile';
    profileList.splice(0, 0, new inquirer.Separator());
    profileList.splice(1, 0, CREATE_PROFILE_MESSAGE);
    profileList.splice(2, 0, new inquirer.Separator());
    profileList.splice(3, 0, new inquirer.Separator(HEADER));
    const question = questions.CREATE_NEW_OR_OVERRIDE;
    question[0].pageSize = NUMBER_OF_PROFILES_PER_PAGE;
    question[0].choices = profileList;
    inquirer.prompt(question).then((answers) => {
        if (answers.profile === CREATE_PROFILE_MESSAGE) {
            createNewProfile((error, profileName) => {
                if (error) {
                    return callback(error);
                }
                callback(null, profileName);
            });
        } else {
            const profile = answers.profile.split(' ')[0].trim().replace(/\[/, '').replace(/\]/, '');
            if (!stringUtils.validateSyntax('PROFILE_NAME', profile)) {
                callback(messages.PROFILE_NAME_VALIDATION_ERROR);
                return;
            }
            callback(null, profile);
        }
    }).catch((error) => {
        callback(error);
    });
}

// AWS Profile setup flow

/**
 * Request AWS profile name.
 * @param {Array} awsProfileList | list of aws profile names.
 * @param {Function} callback
 */
function requestAwsProfileName(awsProfileList, callback) {
    inquirer.prompt(questions.REQUEST_AWS_PROFILE_NAME(awsProfileList)).then((answer) => {
        callback(null, answer.awsProfileName.trim());
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Requests confirmation of setting up AWS profile.
 * @param {Function} callback
 */
function confirmSettingAws(callback) {
    inquirer.prompt(questions.SET_UP_AWS_PROFILE).then((answer) => {
        callback(null, answer.choice);
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Requests selection of environment variables.
 * @param {Function} callback
 */
function selectEnvironmentVariables(callback) {
    inquirer.prompt(questions.USE_ENVIRONMENT_VARIABLES).then((answer) => {
        callback(null, answer.choice);
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Requests access key and secret key.
 * @param {Function} callback
 */
function addNewCredentials(callback) {
    Messenger.getInstance().info(messages.ACCESS_SECRET_KEY_AND_ID_SETUP);
    inquirer.prompt(questions.REQUEST_ACCESS_SECRET_KEY_AND_ID).then((answer) => {
        const credentialObject = {
            aws_access_key_id: answer.accessKeyId.trim(),
            aws_secret_access_key: answer.secretAccessKey.trim()
        };
        callback(null, credentialObject);
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Requests confirmation for creation of new profile or selection of existing profile.
 * @param {Function} callback
 */
function createNewOrSelectAWSProfile(awsProfileList, callback) {
    const AWS_DISPLAY_PAGE_SIZE = 25;
    const CREATE_NEW_PROFILE = 'Create new profile';
    awsProfileList.push(new inquirer.Separator());
    awsProfileList.push(CREATE_NEW_PROFILE);
    awsProfileList.push(new inquirer.Separator());
    const question = questions.SELECT_OR_CREATE_AWS_PROFILE;
    question[0].pageSize = AWS_DISPLAY_PAGE_SIZE;
    question[0].choices = awsProfileList;
    inquirer.prompt(question).then((answer) => {
        callback(null, answer.chosenProfile);
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Helper function to format input profiles' list into inquirer input format.
 * @param {Array} profileList array of ASK profiles.
 * @private
 */
function profileFormatter(profileList) {
    const FORMATTER_SPACING = 26;
    if (!profileList || profileList.length === 0) {
        return null;
    }
    const formattedProfileList = [];
    for (const profileObj of profileList) {
        const formattedASKProfile = `[${profileObj.askProfile}]`;
        let fillingSpace = ' ';
        if (formattedASKProfile.length <= FORMATTER_SPACING) {
            fillingSpace = ' '.repeat(FORMATTER_SPACING - formattedASKProfile.length);
        }
        if (!profileObj.awsProfile) {
            formattedProfileList.push(`${formattedASKProfile}${fillingSpace}** NULL **`);
            continue;
        }
        formattedProfileList.push(`${formattedASKProfile}${fillingSpace}"${profileObj.awsProfile}"`);
    }
    return formattedProfileList;
}
