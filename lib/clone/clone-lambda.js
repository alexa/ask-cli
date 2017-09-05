'use strict';

const download = require('../lambda/download');
const path = require('path');
const async = require('async');
const skillParser = require('../utils/skill-parser');
const mkdirp = require('mkdirp');
const profileHelper = require('../utils/profile-helper');

module.exports = {
    clone: (lambdaPath, skillInfo, profile, callback) => {
        let AWSProfile = profileHelper.getAWSProfile(profile);
        if (!AWSProfile || AWSProfile.length === 0) {
            console.log('No AWS credential setup for profile: [' + profile + ']. Lambda clone skipped.');
            callback(null, []);
            return;
        }
        console.log('Downloading Lambda functions...');
        let lambdaObjectList = skillParser.reorganizeToObjectList(skillInfo.endpointsInfo);
        async.each(lambdaObjectList, (lambdaMetaDataObject, downloadCallback) => {
            let lambdaArn = lambdaMetaDataObject.uri;
            let regionPath = path.join(lambdaPath, lambdaMetaDataObject.sourceDirFromDomainLevel);
            try {
                mkdirp.sync(regionPath);
            }
            catch (err) {
                console.error('Cannot create file path for:', regionPath);
                console.error(err);
            }
            download.downloadByName(lambdaArn, regionPath, profile, (err) => {
                if (err) {
                    downloadCallback(err);
                } else {
                    downloadCallback();
                }
            });
        }, (error) => {
            callback(error, lambdaObjectList);
        });
    }
};
