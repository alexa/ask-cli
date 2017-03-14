'use strict';

const apiWrapper = require('./api-wrapper');
const tools = require('../utils/tools');

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
        .option('--max <max>', 'max vendor-Ids returned (default 20)')
        .description('get vendors list')
        .action(handle);

    function handle(options) {
        apiWrapper.callListVendor(options.max, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log(JSON.stringify(response.vendors, null, 2));
            }
        });
    }
}
