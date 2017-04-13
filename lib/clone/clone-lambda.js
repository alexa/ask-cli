'use strict';

const download = require('../lambda/download');
const path = require('path');

module.exports = {
    clone: (lambdaPath, skillInfo) => {
        if (Object.keys(skillInfo).length === 0) {
            console.log('No Lambda function in skill schema. Lambda clone skipped.\n');
            return;
        }
        console.log('Downloading Lambda functions...');
        Object.keys(skillInfo).forEach((domain) => {
            let domainPath = path.join(lambdaPath, domain);
            let lambdaArn = skillInfo[domain].url;
            if (lambdaArn === 'TO_BE_REPLACED') {
                console.log('No Lambda function for the ' + domain + ' skill. Lambda clone skipped.');
            } else {
                download.downloadByName(lambdaArn, domainPath);
            }
        });
    }
};
