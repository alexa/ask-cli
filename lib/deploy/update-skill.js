'use strict';

const apiWrapper = require('../api/api-wrapper');
const parser = require('../utils/skill-parser');
const tools = require('../utils/tools');
const jsonRead = require('../utils/json-read');
const async = require('async');
const path = require('path');
const fs = require('fs');
const clui = require('clui');
const POLLING_INTERVAL = 5000;

// Public
module.exports = {
    update: (skillId, isModelIncluded, isWaiting, callback) => {
        if (!isModelIncluded) {
            highLevelUpdateSkill(skillId, () => {
                console.log('Done with updating skill.\n');
                if (typeof callback === 'function') {
                    callback();
                }
            });
        } else {
            checkBuildStatus(skillId, () => {
                highLevelUpdateSkill(skillId, () => {
                    console.log('Done with skill update.\n');
                    deployModels(skillId, isWaiting, callback);
                });
            });
        }
    }
};

// Private
function deployModels(skillId, isWaiting, callback) {
    let skillSchema = jsonRead.readFile(path.join(process.cwd(), 'skill.json'));
    if (!skillSchema) {
        return;
    }
    let localeList = parser.parseLocaleList(skillSchema);
    async.each(localeList, (locale, deployModelCallback) => {
        highLevelUpdateModel(skillId, locale, null, () => {
            console.log('Model for ' + locale + ' submitted.');
            deployModelCallback();
        });
    }, () => {
        if (isWaiting) {
            pollingStatus(skillId, localeList, callback);
        } else {
            console.log('Please select from the following command(s) to track the build status:');
            localeList.forEach((locale) => {
                console.log('    ask api get-build-status -s ' + skillId + ' -l '+ locale);
            });
            console.log();
            callback();
        }
    });
}

function checkBuildStatus(skillId, callback) {
    let skillSchema = jsonRead.readFile(path.join(process.cwd(), 'skill.json'));
    if (!skillSchema) {
        return;
    }
    let localeList = parser.parseLocaleList(skillSchema);
    async.each(localeList, (locale, buildStatusCallback) => {
        apiWrapper.callGetBuildStatus(skillId, locale, (data) => {
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
            callback();
        } else {
            console.log('Model build in progress. Please try again when previous build finishes.');
        }
    });
}

function highLevelUpdateSkill(skillId, callback) {
    let skillFile = path.join(process.cwd(), 'skill.json');
    if (!fs.existsSync(skillFile)) {
        console.log("Can't find skill.json in current working directory.");
        return;
    }
    apiWrapper.callUpdateSkill(skillId, skillFile, callback);
}

function highLevelUpdateModel(skillId, locale, eTag, callback) {
    let modelFile = path.join(process.cwd(), 'models', locale + '.json');
    if (!fs.existsSync(modelFile)) {
        console.log("Can't find " + locale + '.json in /models/.');
        return;
    }
    apiWrapper.callUpdateModel(skillId, locale, modelFile, eTag, callback);
}


function pollingStatus(skillId, localeList, callback) {
    let Spinner = clui.Spinner;
    let pollingStatusSpinner = new Spinner(' polling the status for all models...');
    pollingStatusSpinner.start();
    async.groupBy(localeList, (locale, modelBuildStatusCallback) => {
        keepPollingModelBuildStatus(skillId, locale, modelBuildStatusCallback);
    }, (err, results) => {
        if (err) {
            console.error('Polling build status error:\n', err);
            process.exit();
        }
        pollingStatusSpinner.stop();
        let failedModelBuildingLocale = results.FAILURE;
        let successfulModelBuidingLocale = results.SUCCESS;
        if (successfulModelBuidingLocale) {
            printOutModelBuildingStatus(successfulModelBuidingLocale, 'Success');
        }
        if (failedModelBuildingLocale) {
            printOutModelBuildingStatus(failedModelBuildingLocale, 'Failure');
            console.error('Deployment process stops due to model buidling failure.');
        } else {
            console.log();
            callback();
        }
    });
}

function printOutModelBuildingStatus(modelLocaleList, status) {
    for (let locale of modelLocaleList) {
        console.log('[' + status + '] ' + locale);
    }
}

function keepPollingModelBuildStatus(skillId, locale, callback){
    apiWrapper.callGetBuildStatus(skillId, locale, (data) => {
        if (data === 404){
            setTimeout(() => {
                keepPollingModelBuildStatus(skillId, locale, callback);
            }, POLLING_INTERVAL);
        } else {
            let buildResponse = tools.convertDataToJsonObject(data);
            if (buildResponse && buildResponse.status === 'IN_PROGRESS') {
                setTimeout(() => {
                    keepPollingModelBuildStatus(skillId, locale, callback);
                }, POLLING_INTERVAL);
            } else if (buildResponse && buildResponse.status === 'FAILURE') {
                callback(null, 'FAILURE');
            } else if (buildResponse && buildResponse.status === 'SUCCESS') {
                callback(null, 'SUCCESS');
            }
        }
    });
}
