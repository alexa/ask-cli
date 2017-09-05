'use strict';

const apiWrapper = require('../api/api-wrapper');
const tools = require('../utils/tools');
const jsonRead = require('../utils/json-read');
const inquirer = require('inquirer');
const path = require('path');
const os = require('os');
const jsonUtility = require('../utils/json-utility');
const VENDOR_PAGE_SIZE = 50;

module.exports.setVendorId = (profile, doDebug) => {
    apiWrapper.callListVendor(profile, doDebug, (data) => {
        let homeConfigFile = path.join(os.homedir(), '.ask', 'cli_config');
        let propertyPathArray = ['profiles', profile, 'vendor_id'];

        let homeConfig = jsonRead.readFile(homeConfigFile);
        if (!homeConfig) {
            return;
        }
        let vendorInfo = tools.convertDataToJsonObject(data).vendors;
        if (!vendorInfo) {
            process.exit(1);
        }
        if (vendorInfo.length === 0) {
            console.error('There is no vendor ID for your account.');
            process.exit(1);
        }
        if (vendorInfo.length === 1) {
            jsonUtility.writeToProperty(homeConfigFile, propertyPathArray, vendorInfo[0].id);
            console.log('Vendor ID set as ' + vendorInfo[0].id + '\n');
            console.log('Profile [' + profile + '] initialized successfully.');
            process.exit();
        }
        let vendorList = vendorInfo.map((vendor) => {
            return vendor.name + ': ' + vendor.id;
        });
        inquirer.prompt([{
            type: 'rawlist',
            message: 'Choose the vendor ID for the skills you want to manage',
            name: 'selectedVendor',
            pageSize: VENDOR_PAGE_SIZE,
            choices: vendorList
        }]).then((answers) => {
            let vendorId = answers.selectedVendor
                .substr(answers.selectedVendor.lastIndexOf(':') + 2);
            jsonUtility.writeToProperty(homeConfigFile, propertyPathArray, vendorId);
            console.log('Vendor ID updated for the profile.\n');
            console.log('Profile [' + profile + '] initialized successfully.');
            process.exit();
        });
    });
};
