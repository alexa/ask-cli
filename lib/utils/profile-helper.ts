import R from 'ramda';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import * as CONSTANT from './constants';

function runtimeProfile(profile: string) {
    const askProfile = profile || _findEnvProfile() || process.env.ASK_DEFAULT_PROFILE || 'default';
    if (!checkASKProfileExist(askProfile)) {
        throw (`Can't resolve profile [${askProfile}] as it doesn't exist. Please run "ask configure --profile ${askProfile}" first.`);
    }
    return askProfile;
}

function isEnvProfile() {
    return !!((process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    && (process.env.ASK_REFRESH_TOKEN || process.env.ASK_ACCESS_TOKEN)
    && process.env.ASK_VENDOR_ID);
}

function _findEnvProfile() {
    if (isEnvProfile()) {
        // Only when user set every required parameter in ENV, we will treat profile as ENV
        return CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
    }
    return null;
}

function checkASKProfileExist(profileName: string) {
    if (profileName === CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
        return true;
    }
    const askCliConfig = path.join(os.homedir(), '.ask', 'cli_config');
    const askProfile = JSON.parse(fs.readFileSync(askCliConfig, 'utf-8'));
    return Object.prototype.hasOwnProperty.call(askProfile.profiles, profileName);
}

function setupProfile(awsProfile: string, askProfile: string) {
    const homeConfigPath = path.join(os.homedir(), '.ask', 'cli_config');
    const homeConfig = fs.readJSONSync(homeConfigPath);
    const updatedConfig = R.set(R.lensPath(['profiles', askProfile, 'aws_profile']), awsProfile, homeConfig);
    fs.writeJSONSync(homeConfigPath, updatedConfig);
}

function resolveVendorId(profile: string) {
    if (profile === CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
        return process.env.ASK_VENDOR_ID;
    }

    const configFile = path.join(os.homedir(), '.ask', 'cli_config');
    if (!fs.existsSync(configFile)) {
        throw new Error('The app config for ask-cli does not exist. Please run "ask configure" to complete the CLI initialization.');
    } else {
        const cliConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        return R.view(R.lensPath(['profiles', profile, 'vendor_id']), cliConfig);
    }
}

export default {
    runtimeProfile,
    isEnvProfile,
    checkASKProfileExist,
    setupProfile,
    resolveVendorId
};
