'use strict';

const apiWrapper = require('./api-wrapper');
const tools = require('../utils/tools');
const profileHelper = require('../utils/profile-helper');

// Public
module.exports = {
    createCommand: (commander) => {
        buildListVendorCommand(commander);
    }
};

// Private
function buildListVendorCommand(commander) {
    commander
        .command('list-vendors')
        .usage('[-p|--profile <profile>] [--debug]')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .description('get the vendor ID(s) associated with your developer account')
        .action(handle);

    function handle(options) {
        let profile = profileHelper.runtimeProfile(options.profile);
        apiWrapper.callListVendor(profile, options.debug, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log(JSON.stringify(response.vendors, null, 2));
            }
        });
    }
}
