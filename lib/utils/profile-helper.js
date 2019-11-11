const R = require('ramda');
const fs = require('fs');
const os = require('os');
const path = require('path');
const jsonUtility = require('./json-utility');
const CONSTANT = require('./constants');

const FORMATTER_SPACING = 26;

module.exports = {
    runtimeProfile,
    checkASKProfileExist,
    setupProfile,
    deleteProfile,
    getListProfile,
    displayProfile,
    stringFormatter,
    resolveVendorId,
    askProfileSyntaxValidation
};

function runtimeProfile(profile) {
    const askProfile = profile || _findEnvProfile() || process.env.ASK_DEFAULT_PROFILE || 'default';
    if (!module.exports.checkASKProfileExist(askProfile)) {
        throw (`Cannot resolve profile [${askProfile}]`);
    }
    return askProfile;
}

function _findEnvProfile() {
    if ((process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    && (process.env.ASK_REFRESH_TOKEN || process.env.ASK_ACCESS_TOKEN)
    && process.env.ASK_VENDOR_ID) {
        // Only when user set every required parameter in ENV, we will treat profile as ENV
        return CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
    }
    return null;
}

function checkASKProfileExist(profileName) {
    if (profileName === CONSTANT.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
        return true;
    }
    const askCliConfig = path.join(os.homedir(), '.ask', 'cli_config');
    const askProfile = JSON.parse(fs.readFileSync(askCliConfig, 'utf-8'));
    return Object.prototype.hasOwnProperty.call(askProfile.profiles, profileName);
}

function setupProfile(awsProfile, askProfile) {
    const homeConfig = path.join(os.homedir(), '.ask', 'cli_config');
    const propertyPathArray = ['profiles', askProfile, 'aws_profile'];
    jsonUtility.writeToProperty(homeConfig, propertyPathArray, awsProfile);
}

function deleteProfile(profile) {
    const configPath = path.join(os.homedir(), '.ask', 'cli_config');
    const targetPath = ['profiles', profile];
    jsonUtility.deleteProperty(configPath, targetPath);
}

function getListProfile() {
    const askConfig = path.join(os.homedir(), '.ask', 'cli_config');
    if (!fs.existsSync(askConfig)) {
        return null;
    }
    const { profiles } = jsonUtility.read(askConfig);
    if (!profiles || Object.keys(profiles).length === 0) {
        return null;
    }
    const printOut = [];
    for (const profile of Object.getOwnPropertyNames(profiles)) {
        printOut.push({
            askProfile: profile,
            awsProfile: profiles[profile].aws_profile
        });
    }
    return printOut;
}

function displayProfile() {
    const HEADER = 'Profile              Associated AWS Profile';
    const profileList = stringFormatter(getListProfile());
    if (!profileList) {
        console.warn('ask-cli has not set up any profiles yet.');
        return;
    }
    profileList.splice(0, 0, HEADER);
    profileList.forEach((profile) => {
        console.log(`   ${profile}`);
    });
}

function stringFormatter(profileList) {
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

function resolveVendorId(profile) {
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

function askProfileSyntaxValidation(profileName) {
    return /^[a-zA-Z0-9-_]+$/g.test(profileName);
}
