'use strict';

const apiWrapper = require('../api/api-wrapper');
const parser = require('../utils/skill-parser');
const tools = require('../utils/tools');
const jsonRead = require('../utils/json-read');
const async = require('async');
const path = require('path');
const fs = require('fs');

// Public
module.exports = {
    update: (skillId, isModelIncluded, callback) => {
        if (!isModelIncluded) {
            highLevelUpdateSkill(skillId, () => {
                console.log('Done with updating skill.\n');
                callback();
            });
        } else {
            checkBuildStatus(skillId, () => {
                highLevelUpdateSkill(skillId, () => {
                    console.log('Done with skill update.\n');
                    deployModels(skillId, callback);
                });
            });
        }
    }
};

// Private
function deployModels(skillId, callback) {
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
        console.log('Please select from the following command(s) to track the build status:');
        localeList.forEach((locale) => {
            console.log('    ask api get-build-status -s ' + skillId + ' -l '+ locale);
        });
        console.log();
        callback();
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
