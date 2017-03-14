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
            profiles: {
                default: {
                    token: {
                        access_token: "",
                        refresh_token: "",
                        token_type: "",
                        expires_in: "",
                        expires_at: ""
                    },
                    vendor_id: "",
                    aws_profile: "default"
                }
            }
        };
        jsonfile.writeFileSync(homeConfig, newConfig, {spaces: 2});
        console.log('ASK CLI config created.\nCurrent profile is "default".');
    }
};
