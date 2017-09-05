'use strict';

const apiWrapper = require('../api/api-wrapper');
const tools = require('../utils/tools');
const jsonUtility = require('../utils/json-utility');
const async = require('async');
const path = require('path');
const fs = require('fs');
const clui = require('clui');

const POLLING_INTERVAL = 5000;

// Public
module.exports.deployModel = (skillId, skillInfo, isWaiting, profile, doDebug, callback) => {
    if (!skillId) {
        console.error('[Error]: Cannot find skill ID to deploy the model to.');
        process.exit(1);
    }
    let isModelIncluded = skillInfo.domainList.indexOf('custom') !== -1;
    if (isModelIncluded) {
        let localeList = getModelListFromProject(skillInfo.publishLocaleList);
        if (!localeList || localeList.length === 0) {
            console.log('No model need to be deployed.');
            if (callback && typeof callback === 'function') {
                callback();
            }
            return;
        }

        checkBuildStatus(skillId, localeList, profile, doDebug, () => {
            updateModel(skillId, localeList, isWaiting, profile, doDebug, callback);
        });
    } else {
        callback();
    }
};


/*
 * Get model list from skill project.
 * Model list should be subset of skillInfo.publishLocaleList
 *
 * @params skillInfo.publishLocaleList
 * @return true list of models to be deployed
 */
function getModelListFromProject(publishLocaleList) {
    let modelFolderPath = path.join(process.cwd(), 'models');
    if (!fs.existsSync(modelFolderPath)) {
        return false;
    }
    let localeList = fs.readdirSync(modelFolderPath).map((file) => {
        return path.basename(file, '.json');
    });
    return localeList.filter((locale) => {
        return publishLocaleList.indexOf(locale) !== -1;
    });
}

function updateModel(skillId, localeList, isWaiting, profile, doDebug, callback) {
    async.each(localeList, (locale, deployModelCallback) => {
        highLevelUpdateModel(skillId, locale, null, profile, doDebug, () => {
            // console.log('Model for ' + locale + ' submitted.');
            deployModelCallback();
        });
    }, () => {
        if (isWaiting) {
            pollingStatus(skillId, localeList, profile, doDebug, callback);
        } else {
            console.log('\nModel submitted. Please use following command(s) to track the model build status:');
            localeList.forEach((locale) => {
                console.log('    ask api get-model-status -s ' + skillId + ' -l '+ locale);
            });
            console.log();
            if (typeof callback === 'function' && callback) {
                callback();
            }
        }
    });
}

function checkBuildStatus(skillId, localeList, profile, doDebug, callback) {
    let Spinner = clui.Spinner;
    let checkBuildStatusSpinner = new Spinner(' model status checking...');
    checkBuildStatusSpinner.start();
    async.each(localeList, (locale, buildStatusCallback) => {
        apiWrapper.callGetModelStatus(skillId, locale, profile, doDebug, (data) => {
            if (data === 404) {
                buildStatusCallback(null);
            } else {
                let buildResponse = tools.convertDataToJsonObject(data);
                if (buildResponse && buildResponse.status === 'IN_PROGRESS') {
                    buildStatusCallback(true);
                } else {
                    buildStatusCallback(null);
                }
            }
        });
    }, (statusInProgress) => {
        if (!statusInProgress) {
            checkBuildStatusSpinner.stop();
            callback();
        } else {
            checkBuildStatusSpinner.stop();
            console.log('Model build in progress. Please try again when previous build finishes.');
            process.exit();
        }
    });
}

function highLevelUpdateModel(skillId, locale, eTag, profile, doDebug, callback) {
    let modelFile = path.join(process.cwd(), 'models', locale + '.json');
    if (!fs.existsSync(modelFile)) {
        console.log("Can't find " + locale + '.json in ./models');
        return;
    }
    let modelSchema = jsonUtility.read(modelFile);
    apiWrapper.callUpdateModel(skillId, locale, modelSchema, eTag, profile, doDebug, callback);
}


function pollingStatus(skillId, localeList, profile, doDebug, callback) {
    let Spinner = clui.Spinner;
    let pollingStatusSpinner = new Spinner(' polling the status for all models...');
    pollingStatusSpinner.start();
    async.groupBy(localeList, (locale, modelBuildStatusCallback) => {
        keepPollingModelBuildStatus(skillId, locale, profile, doDebug, modelBuildStatusCallback);
    }, (err, results) => {
        if (err) {
            console.error('Polling model build status error:\n', err);
            process.exit(1);
        }
        pollingStatusSpinner.stop();
        let failedModelBuildingLocale = results.FAILURE;
        // TODO add verbose flag so that CLI can display all the current info, such as model success for certain region.
        // let successfulModelBuidingLocale = results.SUCCESS;
        // if (successfulModelBuidingLocale) {
        //     printOutModelBuildingStatus(successfulModelBuidingLocale, 'Success');
        // }
        if (failedModelBuildingLocale) {
            printOutModelBuildingStatus(failedModelBuildingLocale, 'Failure');
            console.error('Deployment process stops due to model buidling failure.');
        } else {
            console.log('Model deployment finished.');
            if (typeof callback === 'function' && callback) {
                callback();
            }
        }
    });
}

function printOutModelBuildingStatus(modelLocaleList, status) {
    for (let locale of modelLocaleList) {
        console.log('[' + status + '] ' + locale);
    }
}

function keepPollingModelBuildStatus(skillId, locale, profile, doDebug, callback){
    apiWrapper.callGetModelStatus(skillId, locale, profile, doDebug, (data) => {
        if (data === 404){
            setTimeout(() => {
                keepPollingModelBuildStatus(skillId, locale, profile, doDebug, callback);
            }, POLLING_INTERVAL);
        } else {
            let buildResponse = tools.convertDataToJsonObject(data);
            if (buildResponse && buildResponse.status === 'IN_PROGRESS') {
                setTimeout(() => {
                    keepPollingModelBuildStatus(skillId, locale, profile, doDebug, callback);
                }, POLLING_INTERVAL);
            } else if (buildResponse && buildResponse.status === 'FAILURE') {
                callback(null, 'FAILURE');
            } else if (buildResponse && buildResponse.status === 'SUCCESS') {
                callback(null, 'SUCCESS');
            }
        }
    });
}
