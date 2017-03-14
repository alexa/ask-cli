'use strict';

const jsonRead = require('../utils/json-read');
const parser = require('../utils/skill-parser');
const jsonfile = require('jsonfile');
const path = require('path');

// Public
module.exports = {
    shouldCreateLambda: (skillSchema, skillType) => {
        if (['smarthome', 'custom'].indexOf(skillType) === -1) {
            return false;
        } else {
            let skillTypeMapping = {
                custom: 'customInteractionModelInfo',
                smarthome: 'smartHomeInfo'
            };
            let propertyTrack = '.skillDefinition.' + skillTypeMapping[skillType];
            let info = jsonRead.getProperty(skillSchema, propertyTrack);
            if (!info.hasOwnProperty('endpointsByRegion')) {
                return true;
            }
            let endpoints = jsonRead.getProperty(info, '.endpointsByRegion');
            let urlArray = Object.keys(endpoints).map((locale) => {
                return jsonRead.getProperty(endpoints, '.' + locale + '.url');
            });
            if (urlArray.indexOf('') > -1) {
                return true;
            } else {
                return false;
            }
        }
    },
    updateSkillConfig: (skillId) => {
        let projectConfigFile = path.join(process.cwd(), '.ask', 'config');
        let projectConfig = jsonRead.readFile(projectConfigFile);
        if (!projectConfig) {
            return;
        }
        projectConfig.deploy_settings.default.skill_id = skillId;
        jsonfile.writeFileSync(projectConfigFile, projectConfig, {spaces: 2});
    },
    updateSkillSchema: (skillType, data) => {
        let skillSchemaFile = path.join(process.cwd(), 'skill.json');
        let skillSchema = jsonRead.readFile(skillSchemaFile);
        if (!skillSchema) {
            return;
        }

        if (skillType === 'custom') {
            skillSchema = parser.setLambdaWithArns(skillSchema, {
                custom: data.FunctionArn
            });
            jsonfile.writeFileSync(skillSchemaFile, skillSchema, {spaces: 2});
        }
        if (skillType === 'smarthome') {
            skillSchema = parser.setLambdaWithArns(skillSchema, {
                smarthome: data.FunctionArn
            });
            jsonfile.writeFileSync(skillSchemaFile, skillSchema, {spaces: 2});
        }
        if (skillType === 'flashbriefing') {
            jsonfile.writeFileSync(skillSchemaFile, data, {spaces: 2});
        }
    }
};
