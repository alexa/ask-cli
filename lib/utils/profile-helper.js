const R = require('ramda');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const CONSTANT = require('./constants');

module.exports = {
    runtimeProfile,
    isEnvProfile,
    isEnvProfileName,
    checkASKProfileExist,
    setupProfile,
    resolveVendorId
};

function runtimeProfile(profile) {
    const askProfile = profile || process.env.ASK_DEFAULT_PROFILE || _findEnvProfile() || 'default';
    if (!module.exports.checkASKProfileExist(askProfile)) {
        throw (`Can't resolve profile [${askProfile}] as it doesn't exist. Please run "ask configure --profile ${askProfile}" first.`);
    }
    return askProfile;
}

function isEnvProfile() {
    return !!((process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    && (process.env.ASK_REFRESH_TOKEN || process.env.ASK_ACCESS_TOKEN)
    && process.env.ASK_VENDOR_ID);
}

function isEnvProfileName(profileName) {
    return profileName === CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
}

function _findEnvProfile() {
    if (isEnvProfile()) {
        // Only when user set every required parameter in ENV, we will treat profile as ENV
        return CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
    }
    return null;
}

function checkASKProfileExist(profileName) {
    if (isEnvProfileName(profileName) || isEnvProfile()) {
        return true;
    }
    const askCliConfig = path.join(os.homedir(), '.ask', 'cli_config');
    const askProfile = JSON.parse(fs.readFileSync(askCliConfig, 'utf-8'));
    return Object.prototype.hasOwnProperty.call(askProfile.profiles, profileName);
}

function setupProfile(awsProfile, askProfile) {
    const homeConfigPath = path.join(os.homedir(), '.ask', 'cli_config');
    const homeConfig = fs.readJSONSync(homeConfigPath);
    const updatedConfig = R.set(R.lensPath(['profiles', askProfile, 'aws_profile']), awsProfile, homeConfig);
    fs.writeJSONSync(homeConfigPath, updatedConfig);
}

function resolveVendorId(profile) {
    const askVendorId = process.env.ASK_VENDOR_ID;
    if (isEnvProfileName(profile) || askVendorId) {
        return askVendorId;
    }

    const configFile = path.join(os.homedir(), '.ask', 'cli_config');
    if (!fs.existsSync(configFile)) {
        throw new Error('The app config for ask-cli does not exist. Please run "ask configure" to complete the CLI initialization.');
    } else {
        const cliConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        return R.view(R.lensPath(['profiles', profile, 'vendor_id']), cliConfig);
    }
}
