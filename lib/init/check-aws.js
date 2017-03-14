'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

module.exports.checkAWS = (callback) => {
    let awsConfig = path.join(os.homedir(), '.aws', 'credentials');
    if (!fs.existsSync(awsConfig)) {
        console.warn('AWS credential not set yet.\n' +
            'Please turn to README for AWS setup instructions.');
    } else {
        console.log('AWS credential detected.');
        callback();
    }
};
