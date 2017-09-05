'use strict';

const upload = require('../../lambda/upload');
const async = require('async');
const clui = require('clui');

module.exports = {
    updateLambda: (updateLambdaList, AWSProfile, callback) => {
        let Spinner = clui.Spinner;
        let uploadSpinner = new Spinner(' Updating Lambda function...');
        uploadSpinner.start();
        async.each(updateLambdaList, (metaData, asyncCallback) => {
            upload.uploadByName(metaData.uri, metaData.sourceDir, AWSProfile, (err) => {
                if (err) {
                    console.error('Updating Failed: ' + metaData.uri);
                    asyncCallback(err);
                } else {
                    asyncCallback();
                }
            });
        }, (err) => {
            if (err) {
                process.exit(1);
            }
            uploadSpinner.stop();
            callback();
        });
    }
};
