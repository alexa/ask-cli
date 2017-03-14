'use strict';

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Public
module.exports.convertDataToJsonObject = (data) => {
    let response;
    try {
        response = JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse the API response.');
        return null;
    }
    if (response.hasOwnProperty('skillDefinition')) {
        response.skillDefinition = JSON.parse(response.skillDefinition);
    }
    if (response.hasOwnProperty('modelDefinition')) {
        response.modelDefinition = JSON.parse(response.modelDefinition);
    }
    if (response.hasOwnProperty('accountLinkingInfo')) {
        response.accountLinkingInfo = JSON.parse(response.accountLinkingInfo);
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
