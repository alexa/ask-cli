'use strict';

const download = require('../lambda/download');
const path = require('path');

module.exports = {
    clone: (lambdaPath, lambdaArns) => {
        if (Object.keys(lambdaArns).length === 0) {
            console.log('No Lambda function in skill schema. Lambda clone skipped.\n');
            return;
        }
        console.log('Downloading Lambda functions...');
        if (lambdaArns.hasOwnProperty('custom')) {
            let customLambdaPath = path.join(lambdaPath, 'custom');
            download.downloadByName(lambdaArns.custom, customLambdaPath);
        }
        if (lambdaArns.hasOwnProperty('smarthome')) {
            let smarthomeLambdaPath = path.join(lambdaPath, 'smartHome');
            download.downloadByName(lambdaArns.smarthome, smarthomeLambdaPath);
        }
    }
};
