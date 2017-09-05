'use strict';

const apiWrapper = require('../api/api-wrapper');
const tools = require('../utils/tools');
const jsonfile = require('jsonfile');
const async = require('async');
const path = require('path');

module.exports = {
    cloneModel: cloneModel
};

function cloneModel(modelPath, skillId, skillInfo, profile, doDebug, callback) {
    refineLocalListByHeadModel(skillId, skillInfo.publishLocaleList, profile, doDebug, (customLocalList) => {
        // customLocalList is the sub-set of publishLocaleList
        createModelSchema(modelPath, skillId, skillInfo, customLocalList, profile, doDebug, () => {
            callback();
        });
    });
}

function createModelSchema(modelPath, skillId, skillInfo, customLocalList, profile, doDebug, callback) {
    async.each(customLocalList, (locale, createCallback) => {
        apiWrapper.callGetModel(skillId, locale, profile, doDebug, (data) => {
            let modelSchemaPath = path.join(modelPath, (locale + '.json'));
            let modelSchema = tools.convertDataToJsonObject(data);
            if (modelSchema) {
                jsonfile.writeFileSync(modelSchemaPath, modelSchema, {spaces: 2});
                console.log('Skill model for ' + locale + ' created at\n' +
                    '    ./' + skillInfo.skillName + '/models/' + locale + '.json');
                createCallback();
            } else {
                createCallback('Cannot retrieve model data.');
            }
        });
    }, (error) => {
        if (error) {
            console.error(error);
            return;
        }
        console.log();
        callback();
    });
}

function refineLocalListByHeadModel(skillId, localList, profile, doDebug, callback) {
    let customLocalList = [];
    async.each(localList, (locale, checkCallBack) => {
        apiWrapper.callGetModelStatus(skillId, locale, profile, doDebug, (data) => {
            if (data !== 404) {
                customLocalList.push(locale);
            }
            checkCallBack();
        });
    }, (error) => {
        if (error) {
            console.error(error);
            return;
        }
        callback(customLocalList);
    });
}
