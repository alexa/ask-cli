const profileHelper = require('@src/utils/profile-helper');
const inquirer = require('inquirer');
const questions = require('./questions');
const messages = require('./messages');

module.exports = {
    createNewProfile,
    chooseVendorId,
    createOrUpdateProfile,
    createNewOrSelectAWSProfile,
    confirmSettingAws,
    addNewCredentials,
    confirmOverwritingProfile,
    selectEnvironmentVariables,
    requestAwsProfileName
};

function confirmSettingAws(callback) {
    inquirer.prompt(questions.SET_UP_AWS_PROFILE).then((answer) => {
        callback(answer.choice);
    });
}

function selectEnvironmentVariables(callback) {
    inquirer.prompt(questions.USE_ENVIRONMENT_VARIABLES).then((answer) => {
        callback(answer.choice);
    });
}

function addNewCredentials(callback) {
    console.log(messages.ACCESS_SECRET_KEY_AND_ID_SETUP);
    inquirer.prompt(questions.REQUEST_ACCESS_SECRET_KEY_AND_ID).then((answer) => {
        const credentialObject = {
            aws_access_key_id: answer.accessKeyId.trim(),
            aws_secret_access_key: answer.secretAccessKey.trim()
        };
        callback(credentialObject);
    });
}

function confirmOverwritingProfile(profileName, callback) {
    const question = questions.CONFIRM_OVERRIDING_PROFILE;
    question[0].message = `The profile ${profileName} already exists. Do you want to overwrite the existing credentials?`;
    inquirer.prompt(question).then((answer) => {
        callback(answer.overwrite);
    });
}

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
        callback(answer.chosenProfile);
    });
}

function createNewProfile(callback) {
    inquirer.prompt(questions.REQUEST_ASK_PROFILE_NAME).then((answer) => {
        const newProfileName = answer.profile.trim();
        if (!profileHelper.askProfileSyntaxValidation(newProfileName)) {
            return callback(messages.PROFILE_NAME_VALIDATION_ERROR);
        }
        callback(null, newProfileName);
    });
}

function buildVendorJSONString(vendorInfo) {
    return vendorInfo.map(vendor => `${vendor.name}: ${vendor.id}`);
}

function chooseVendorId(VENDOR_PAGE_SIZE, vendorInfo, callback) {
    const question = questions.SELECT_VENDOR_ID;
    question[0].pageSize = VENDOR_PAGE_SIZE;
    question[0].choices = buildVendorJSONString(vendorInfo);
    inquirer.prompt(question).then((answers) => {
        const vendorId = answers.selectedVendor.substr(answers.selectedVendor.lastIndexOf(':') + 2);
        callback(vendorId);
    });
}

function createOrUpdateProfile(LIST_PAGE_SIZE, profileList, callback) {
    const HEADER = 'Profile              Associated AWS Profile';
    const CREATE_PROFILE_MESSAGE = 'Create new profile';
    profileList.splice(0, 0, new inquirer.Separator());
    profileList.splice(1, 0, CREATE_PROFILE_MESSAGE);
    profileList.splice(2, 0, new inquirer.Separator());
    profileList.splice(3, 0, new inquirer.Separator(HEADER));
    const question = questions.CREATE_NEW_OR_OVERRIDE;
    question[0].pageSize = LIST_PAGE_SIZE;
    question[0].choices = profileList;
    inquirer.prompt(question).then((answers) => {
        if (answers.profile === CREATE_PROFILE_MESSAGE) {
            createNewProfile(callback);
        } else {
            const profile = answers.profile.split(' ')[0].trim().replace(/\[/, '').replace(/\]/, '');
            if (!profileHelper.askProfileSyntaxValidation(profile)) {
                callback(messages.PROFILE_NAME_VALIDATION_ERROR);
                return;
            }
            callback(null, profile);
        }
    });
}

function requestAwsProfileName(awsProfileList, callback) {
    inquirer.prompt(questions.REQUEST_AWS_PROFILE_NAME(awsProfileList)).then((answer) => {
        callback(answer.awsProfileName.trim());
    });
}
