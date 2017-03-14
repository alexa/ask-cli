'use strict';

const apiWrapper = require('../api/api-wrapper');
const tools = require('../utils/tools');
const jsonRead = require('../utils/json-read');
const inquirer = require('inquirer');
const jsonfile = require('jsonfile');
const path = require('path');
const os = require('os');

module.exports.setVendorId = () => {
    apiWrapper.callListVendor(null, (data) => {
        let homeConfigFile = path.join(os.homedir(), '.ask', 'cli_config');
        let homeConfig = jsonRead.readFile(homeConfigFile);
        if (!homeConfig) {
            return;
        }
        let vendorInfo = tools.convertDataToJsonObject(data).vendors;
        if (!vendorInfo) {
            process.exit();
        }
        if (vendorInfo.length === 0) {
            console.warn('There is no vendor ID for your account.');
            process.exit();
        }
        if (vendorInfo.length === 1) {
            homeConfig.profiles.default.vendor_id = vendorInfo[0].id;
            jsonfile.writeFileSync(homeConfigFile, homeConfig, {spaces: 2});
            console.log('Profile Vendor ID set as ' + vendorInfo[0].id + '\n');
            process.exit();
        }
        let vendorList = vendorInfo.map((vendor) => {
            return vendor.name + ': ' + vendor.id;
        });
        inquirer.prompt([{
            type: 'rawlist',
            message: 'Choose the vendor ID for the skills you want to manage',
            name: 'selectedVendor',
            pageSize: 20,
            choices: vendorList
        }]).then((answers) => {
            let vendorId = answers.selectedVendor
                .substring(answers.selectedVendor.lastIndexOf(':') + 2);
            homeConfig.profiles.default.vendor_id = vendorId;
            jsonfile.writeFileSync(homeConfigFile, homeConfig, {spaces: 2});
            console.log('Profile Vendor ID updated.\n');
            process.exit();
        });
    });
};
