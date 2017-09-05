'use strict';

const jsonfile = require('jsonfile');
const path = require('path');
const os = require('os');
const fs = require('fs');

module.exports.initHomeConfig = () => {
    let askFolder = path.join(os.homedir(), '.ask');
    let homeConfig = path.join(askFolder, 'cli_config');
    if (!fs.existsSync(askFolder) || !fs.existsSync(homeConfig)) {
        if (!fs.existsSync(askFolder)) {
            fs.mkdirSync(askFolder);
        }
        let newConfig = {
            profiles: {}
        };
        jsonfile.writeFileSync(homeConfig, newConfig, {spaces: 2});
    }
};
