'use strict';

const initHomeConfig = require('./init-home-config');
const setVendor = require('./set-vendor');
const checkAWS = require('./check-aws');
const lwa = require('./lwa');

module.exports = {
    createCommand: (commander) => {
        commander
            .command('init')
            .description('initialization of ASK cli')
            .option('--no-browser', 'prevent the command of the authorization by launching a browser.')
            .action(handle);

        function handle(options) {
            console.log('-------------------- Initialize CLI --------------------');
            initHomeConfig.initHomeConfig();
            checkAWS.checkAWS(() => {
                lwa.login(options.browser, () => {
                    setVendor.setVendorId();
                });
            });
        }
    }
};
