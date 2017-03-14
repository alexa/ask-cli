'use strict';

const apiWrapper = require('../api/api-wrapper');
const tools = require('../utils/tools');
const jsonRead = require('../utils/json-read');
const jsonfile = require('jsonfile');
const async = require('async');
const path = require('path');
const fs = require('fs');

// Public
module.exports = {
    getSkill: (skillId, stage, callback) => {
        highLevelGetSkill(skillId, stage, (data) => {
            let skillSchema = tools.convertDataToJsonObject(data);
            if (skillSchema) {
                callback(skillSchema);
            }
        });
    },
    clone: (projectPath, skillId, skillName, skillType, lambdaArns, localeList,
        skillSchema, lambdaCallBack) => {
        let skillPath = path.join(projectPath, 'skill.json');
        let modelPath = path.join(projectPath, 'models');
        let lambdaPath = path.join(projectPath, 'lambda');

        createSkillSchema(skillPath, skillSchema);
        console.log('Skill schema for ' + skillName + ' created at\n' +
            '    ./' + skillName + '/skill.json\n');

        if (skillType === 'custom') {
            createModelSchema(modelPath, skillId, skillName, localeList, () => {
                lambdaCallBack(lambdaPath, lambdaArns);
            });
        } else if (skillType === 'smarthome'){
            lambdaCallBack(lambdaPath, lambdaArns);
        }
    }
};

// Private
function createSkillSchema(skillSchemaPath, skillSchema) {
    jsonfile.writeFileSync(skillSchemaPath, skillSchema, {spaces: 2});
}

function createModelSchema(newProjectRootPath, skillId, skillName, localeList, callback) {
    async.each(localeList, (locale, createCallback) => {
        highLevelGetModel(skillId, locale, (data) => {
            let modelSchemaPath = path.join(newProjectRootPath, (locale + '.json'));
            let modelSchema = tools.convertDataToJsonObject(data);
            if (modelSchema) {
                jsonfile.writeFileSync(modelSchemaPath, modelSchema, {spaces: 2});
                console.log('Skill model for ' + locale + ' created at\n' +
                    '    ./' + skillName + '/models/' + locale + '.json');
            }
            createCallback(null);
        });
    }, () => {
        console.log();
        callback();
    });
}

function highLevelGetSkill(skillId, stage, callback) {
    let finalSkillId = getSkillIdFromInputOrDefault(skillId);
    if (!finalSkillId) {
        return;
    }
    apiWrapper.callGetSkill(finalSkillId, stage, callback);
}

function highLevelGetModel(skillId, locale, callback) {
    let finalSkillId = getSkillIdFromInputOrDefault(skillId);
    if (!finalSkillId) {
        return;
    }
    apiWrapper.callGetModel(finalSkillId, locale, callback);
}

function getSkillIdFromInputOrDefault(skillId) {
    if (skillId) {
        return skillId;
    } else {
        let projectConfigFile = path.join(process.cwd() + '.ask', 'config');
        if (fs.existsSync(projectConfigFile)) {
            let projectConfig = jsonRead.readFile(projectConfigFile);
            if (!projectConfig) {
                return;
            }
            let defaultSkillId = jsonRead
                .getProperty(projectConfig, 'deploy_settings.default.skill_id');
            if (!defaultSkillId) {
                return;
            }
            if (!defaultSkillId) {
                console.warn('Skill ID in project config is not set yet.');
                return null;
            }
            return defaultSkillId;
        } else {
            console.warn('Please run the command under the root of the skill project.');
            return null;
        }
    }
}
