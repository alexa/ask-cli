const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');

module.exports = {
    REQUEST_ASK_PROFILE_NAME: [{
        message: `Please provide a profile name or press enter to use ${CONSTANTS.ASK_DEFAULT_PROFILE_NAME} as the profile name: `,
        type: 'input',
        name: 'profile',
        default: CONSTANTS.ASK_DEFAULT_PROFILE_NAME
    }],
    SELECT_VENDOR_ID: [{
        type: 'rawlist',
        message: 'Your Amazon developer account has multiple Vendor IDs. Please choose the Vendor ID for the skills you want to manage.',
        name: 'selectedVendor'
    }],
    CREATE_NEW_OR_OVERRIDE: [{
        type: 'list',
        message: 'Please create a new profile or overwrite the existing profile.\n',
        name: 'profile'
    }],
    REQUEST_AWS_PROFILE_NAME: existingProfiles => [{
        type: 'input',
        name: 'awsProfileName',
        message: 'Please provide your AWS profile name: ',
        default: existingProfiles.includes(CONSTANTS.AWS_DEFAULT_PROFILE_NAME) ? null
            : CONSTANTS.AWS_DEFAULT_PROFILE_NAME,
        validate: (input) => {
            if (!stringUtils.isNonBlankString(input)) {
                return 'Profile name can not be blank string.';
            }
            if (existingProfiles.includes(input.trim())) {
                return `[${input}] already exists in existing AWS profiles. Please try again with another name.`;
            }
            return true;
        }
    }],
    CONFIRM_OVERRIDING_PROFILE: [{
        type: 'confirm',
        name: 'overwrite',
        default: true
    }],
    USE_ENVIRONMENT_VARIABLES: [{
        message: 'We have detected you have AWS environment variables. Would you like to setup your profile using those?',
        type: 'list',
        name: 'choice',
        choices: ['Yes', 'No']
    }],
    SET_UP_AWS_PROFILE: [{
        message: 'Do you want to link your AWS account in order to host your Alexa skills?',
        type: 'confirm',
        name: 'choice',
        default: true
    }],
    SELECT_OR_CREATE_AWS_PROFILE: [{
        type: 'list',
        name: 'chosenProfile',
        message: 'Please choose from the following existing AWS profiles or create a new one.'
    }],
    REQUEST_ACCESS_SECRET_KEY_AND_ID: [
        {
            type: 'input',
            name: 'accessKeyId',
            message: 'AWS Access Key ID: ',
            validate(input) {
                if (!input.trim()) {
                    return '"AWS Access Key ID" cannot be empty.';
                }
                return true;
            }
        },
        {
            type: 'password',
            name: 'secretAccessKey',
            message: 'AWS Secret Access Key: ',
            validate(input) {
                if (!input.trim()) {
                    return '"AWS Secret Access Key" cannot be empty.';
                }
                return true;
            }
        }
    ],
    REQUEST_AUTH_CODE: [
        {
            type: 'input',
            name: 'authCode',
            message: 'Please enter the Authorization Code: ',
            validate: (value) => {
                if (!stringUtils.isNonBlankString(value.trim())) {
                    return 'Please enter a valid Authorization Code.';
                }
                return true;
            }
        }
    ]
};
