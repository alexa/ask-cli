'use strict';

const createLambda = require('./lambda-operation/create-lambda');
const updateLambda = require('./lambda-operation/update-lambda');
const parser = require('../utils/skill-parser');
const profileHelper = require('../utils/profile-helper');
const fs = require('fs');


module.exports.deployLambda = (skillId, skillInfo, profile, callback) => {
    if (!skillId) {
        console.error('No skill ID found. Please first create skill, then deploy lambda.');
        process.exit(1);
    }

    let AWSProfile = profileHelper.getAWSProfile(profile);
    if (!AWSProfile) {
        console.warn('[Warning]: Lambda deployment skipped, since AWS credentials' +
            'for profile: [' + profile + '] hasn\'t been set up yet.');
        if (typeof callback === 'function' && callback) {
            callback();
        }
        return;
    }
    let updateLambdaList = [];
    let createLambdaList = [];
    for (let domain of Object.keys(skillInfo.endpointsInfo)) {
        for (let region of Object.keys(skillInfo.endpointsInfo[domain])) {
            separateLambdaCreateUpdate(skillInfo, domain, region, updateLambdaList, createLambdaList, profile);
        }
    }
    if (updateLambdaList.length === 0 && createLambdaList.length === 0) {
        console.log('[Info]: No lambda functions need to be deployed.');
        return;
    }
    createLambda.createLambda(skillId, skillInfo.skillName, createLambdaList, AWSProfile, (generatedLambda) => {
        updateLambda.updateLambda(updateLambdaList, AWSProfile, () => {
            console.log('Lambda deployment finished.');
            if (typeof callback === 'function' && callback) {
                callback(generatedLambda);
            }
        });
    });
};


/*
 * Separate Lambda by directly updating the createList amd updateList passed in as inputs
 *
 * Each list is consisted of metaData which contains following properties:
 * {uri, sourceDir, domain, region, customName, zipPath, arn}
 * 4 of them are guaranteed to exist: uri, sourceDir, domain, region
 *
 * For create deploy lambda, metaData has 4 at the beginning, and 2 extra after creation:
 * - customName: boolean, used to test if the createLambda's name is input by client
 *               or at 'ask new' stage (true)/ or just created on 'ask deploy'(false).
 * - arn: the actual lambda function arn from aws response.
 */
function separateLambdaCreateUpdate(skillInfo, domain, region, updateLambdaList, createLambdaList, profile) {
    let uri = skillInfo.endpointsInfo[domain][region].uri;
    let sourceDir = skillInfo.endpointsInfo[domain][region].sourceDir;

    if (!uri && sourceDir && sourceDir.length !== 0) {
        if (!fs.existsSync(sourceDir)) {
            console.error('Source directory is invalid, cannot deploy lambda function(s)');
            process.exit(1);
        }
        createLambdaList.push({
            uri: 'ask-' + domain + '-' + skillInfo.skillName + '-' + profile,
            sourceDir: sourceDir,
            domain: domain,
            region: region,
            customName: false
        });
    }
    if (parser.isAbsoluteURL(uri) && uri.substr(0, 6) === 'https:') {
        return;
    }
    if (parser.isAbsoluteURL(uri) && uri.substr(0, 4) === 'arn:') {
        if (!sourceDir) {
            return;
        } else if (!fs.existsSync(sourceDir)) {
            console.error('Source directory is invalid, cannot deploy lambda function(s)');
            process.exit(1);
        }
        updateLambdaList.push({
            uri: uri,
            sourceDir: sourceDir,
            domain: domain,
            region: region
        });
    } else if (uri) {
        // skillSchema has been preprocessed by fn: generateSubmittingReadySkillJson
        // so that if there is uri (functionName), then the funcationName has not been found
        // from the user's AWS, so that I can directly put into the createLambdaList group.
        createLambdaList.push({
            uri: uri,
            sourceDir: sourceDir,
            domain: domain,
            region: region,
            customName: true
        });
    }
}
