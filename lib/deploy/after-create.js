'use strict';

const jsonRead = require('../utils/json-read');
const parser = require('../utils/skill-parser');
const domainRegistry = require('../utils/domain-registry');
const jsonfile = require('jsonfile');
const path = require('path');

// Public
module.exports = {
    updateSkillConfig: (skillId) => {
        let projectConfigFile = path.join(process.cwd(), '.ask', 'config');
        let projectConfig = jsonRead.readFile(projectConfigFile);
        if (!projectConfig) {
            return;
        }
        projectConfig.deploy_settings.default.skill_id = skillId;
        jsonfile.writeFileSync(projectConfigFile, projectConfig, {spaces: 2});
    },
    shouldCreateLambda: (skillSchema, skillInfo) => {
        let createResult = {
            willCreate: false,
            createList: []
        };
        if (Object.keys(skillInfo).length === 0) {
            return createResult;
        }
        Object.keys(skillInfo).forEach((domain) => {
            let propertyTrack = '.skillDefinition.' + domainRegistry.getSkillSchemaKey(domain);
            let info = jsonRead.getProperty(skillSchema, propertyTrack);
            if (!info.hasOwnProperty('endpointsByRegion')) {
                createResult.willCreate = true;
                createResult.createList.push(domain);
            } else {
                let endpoints = jsonRead.getProperty(info, '.endpointsByRegion');
                if (hasPlaceholderUrl(endpoints)) {
                    createResult.willCreate = true;
                    createResult.createList.push(domain);
                }
            }
        });
        return createResult;
    },
    updateSkillSchema: (skillInfoToCreate) => {
        let skillSchemaFile = path.join(process.cwd(), 'skill.json');
        let skillSchema = jsonRead.readFile(skillSchemaFile);
        if (!skillSchema) {
            return;
        }
        skillSchema = parser.setLambdaWithSkillInfo(skillSchema, skillInfoToCreate);
        jsonfile.writeFileSync(skillSchemaFile, skillSchema, {spaces: 2});
    }
};


// Private
function hasPlaceholderUrl(endpoints) {
    let urlArray = Object.keys(endpoints).map((locale) => {
        return jsonRead.getProperty(endpoints, '.' + locale + '.url');
    });
    for (let url of urlArray) {
        if (url === 'TO_BE_REPLACED') {
            return true;
        }
    }
    return false;
}
