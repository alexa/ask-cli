'use strict';

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Public
module.exports.convertDataToJsonObject = (data) => {
    let response = data;
    try {
        if (typeof(data) === 'string') {
            response = JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to parse the response from Alexa Skill Management API Service.');
        return null;
    }
    return response;
};

module.exports.removeDirectory = function removeDirectory(dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
            let curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                removeDirectory(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dir);
    }
};

module.exports.generateSID = () => {
    let part0 = 'lc-';
    let part1 = randString(8) + '-';
    let part2 = randString(4) + '-';
    let part3 = randString(4) + '-';
    let part4 = randString(4) + '-';
    let part5 = randString(12);
    return part0 + part1 + part2 + part3 + part4 + part5;
};

// Private
function randString(n) {
    if (n<0) {
        return '';
    }
    return crypto.randomBytes(Math.ceil(n/2)).toString('hex').slice(0,n);
}
