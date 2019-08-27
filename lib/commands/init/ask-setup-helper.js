const jsonfile = require('jsonfile');
const path = require('path');
const os = require('os');
const fs = require('fs');
const oauthWrapper = require('@src/utils/oauth-wrapper');
const apiWrapper = require('@src/api/api-wrapper');
const jsonRead = require('@src/utils/json-read');
const tools = require('@src/utils/tools');
const jsonUtility = require('@src/utils/json-utility');
const profileHelper = require('@src/utils/profile-helper');
const ui = require('./ui');
const messages = require('./messages');

const VENDOR_PAGE_SIZE = 50;

module.exports = {
    setupAskConfig,
    setVendorId,
    isFirstTimeCreation
};

function setupAskConfig(tokens, askProfile, callback) {
    try {
        oauthWrapper.writeToken(tokens, askProfile);
        callback();
    } catch (error) {
        callback(`Failed to update the cli_config file with the retrieved token. ${error}`);
    }
}

function setVendorId(profile, doDebug, callback) {
    apiWrapper.callListVendor(profile, doDebug, (data) => {
        const homeConfigFile = path.join(os.homedir(), '.ask', 'cli_config');
        const propertyPathArray = ['profiles', profile, 'vendor_id'];
        const homeConfig = jsonRead.readFile(homeConfigFile);
        if (!homeConfig) {
            callback(messages.ASK_CONFIG_NOT_FOUND_ERROR);
            return;
        }
        const vendorInfo = tools.convertDataToJsonObject(data.body).vendors;
        if (!vendorInfo) {
            callback(messages.VENDOR_INFO_FETCH_ERROR);
            return;
        }
        handleVendors(vendorInfo, homeConfigFile, propertyPathArray, callback);
    });
}

function handleVendors(vendorInfo, homeConfigFile, propertyPathArray, callback) {
    const numberOfVendors = vendorInfo.length;
    switch (numberOfVendors) {
    case 0:
        callback('There is no vendor ID for your account.');
        break;
    case 1:
        jsonUtility.writeToProperty(homeConfigFile, propertyPathArray, vendorInfo[0].id);
        callback(null, vendorInfo[0].id);
        break;
    default:
        ui.chooseVendorId(VENDOR_PAGE_SIZE, vendorInfo, (vendorId) => {
            jsonUtility.writeToProperty(homeConfigFile, propertyPathArray, vendorId);
            callback(null, vendorId);
        });
    }
}

function createConfigFile(askFolder, cliConfig, newConfig, writeFileOptions) {
    if (!fs.existsSync(askFolder)) {
        fs.mkdirSync(askFolder);
    }
    jsonfile.writeFileSync(cliConfig, newConfig, writeFileOptions);
}

function isFirstTimeCreation() {
    const askFolder = path.join(os.homedir(), '.ask');
    const cliConfig = path.join(askFolder, 'cli_config');
    if (!fs.existsSync(cliConfig)) {
        createConfigFile(askFolder, cliConfig, { profiles: {} }, { spaces: 2 });
        return true;
    }

    const rawProfileList = profileHelper.getListProfile();
    if (!rawProfileList || rawProfileList.length === 0) {
        createConfigFile(askFolder, cliConfig, { profiles: {} }, { spaces: 2 });
        return true;
    }

    return false;
}
