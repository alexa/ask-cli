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
            .action(handle);

        function handle() {
            console.log('-------------------- Initialize CLI --------------------');
            initHomeConfig.initHomeConfig();
            checkAWS.checkAWS(() => {
                lwa.login(() => {
                    setVendor.setVendorId();
                });
            });
        }
    }
};
