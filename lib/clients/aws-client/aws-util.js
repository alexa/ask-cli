const aws = require('aws-sdk');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const R = require('ramda');

const CONSTANT = require('@src/utils/constants');

module.exports = {
    getAWSProfile,
    getCLICompatibleDefaultRegion
};

/**
 * function used to retrieve aws profile name
 * @param {string} askProfile cli profile name
 */
function getAWSProfile(askProfile) {
    if (askProfile === CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
        const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

        if (awsAccessKeyId && awsSecretAccessKey) {
            return CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS;
        }
    }
    const askConfig = fs.readJSONSync(path.join(os.homedir(), '.ask', 'cli_config'));
    return R.view(R.lensPath(['profiles', askProfile, 'aws_profile']), askConfig);
}

// We face the same issue as mentioned in https://github.com/aws/aws-sdk-js/issues/2181
// Issue is about when we instantiate the aws-sdk, the region value is not passed in correctly based on the profile.
// Temporary solution is to mimic aws-sdk's credential provider chain and wait for the solution.
class SharedIniFile {
    constructor(options) {
        options = options || {};
        this.isConfig = options.isConfig === true;
        this.filename = options.filename || this._getDefaultFilepath();
    }

    getProfile(profile) {
        const profileIndex = profile !== aws.util.defaultProfile && this.isConfig ? `profile ${profile}` : profile;
        const configFile = this._ensureFileLoaded();
        return configFile ? configFile[profileIndex] : null;
    }

    _getDefaultFilepath() {
        return path.join(os.homedir(), '.aws', this.isConfig ? 'config' : 'credentials');
    }

    _ensureFileLoaded() {
        if (fs.existsSync(this.filename)) {
            const contents = fs.readFileSync(this.filename, 'utf-8').toString();
            return aws.util.ini.parse(contents);
        }
        return null;
    }
}

/**
 * function used to retrieve default aws region or return a global default aws region if a set one is not found.
 * @param {string} runtimeProfile aws profile name
 */
function getCLICompatibleDefaultRegion(awsProfile) {
    const profile = awsProfile || process.env.AWS_PROFILE || process.env.AWS_DEFAULT_PROFILE || 'default';
    const toCheck = [
        {
            filename: process.env.AWS_SHARED_CREDENTIALS_FILE
        },
        {
            isConfig: true,
            filename: process.env.AWS_CONFIG_FILE
        }
    ];
    let region = process.env.AWS_REGION || process.env.AMAZON_REGION || process.env.AWS_DEFAULT_REGION || process.env.AMAZON_DEFAULT_REGION;
    while (!region && toCheck.length > 0) {
        const configFile = new SharedIniFile(toCheck.shift());
        const section = configFile.getProfile(profile);
        region = section && section.region;
    }
    return region || CONSTANT.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION;
}
