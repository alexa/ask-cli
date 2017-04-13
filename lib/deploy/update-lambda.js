'use strict';

const afterCreate = require('./after-create');
const createLambda = require('./create-lambda');
const updateSkill = require('./update-skill');
const upload = require('../lambda/upload');
const parser = require('../utils/skill-parser');
const jsonRead = require('../utils/json-read');
const path = require('path');

module.exports = {
    update: (skillId) => {
        let currentDir = process.cwd();
        let skillSchema = jsonRead.readFile(path.join(currentDir, 'skill.json'));
        if (!skillSchema) {
            return;
        }
        let skillInfo = parser.extractSkillInfo(skillSchema);
        if (!skillInfo) {
            return;
        }
        if (Object.keys(skillInfo).length === 0) {
            console.log('No Lambda function deploy for this skill.\n');
            return;
        }
        let createResult = afterCreate.shouldCreateLambda(skillSchema, skillInfo);
        if (createResult.willCreate === null) {
            return;
        }
        if (createResult.willCreate) {
            let skillName = parser.parseSkillName(skillSchema);
            if (!skillName) {
                return;
            }
            console.log('Creating Lambda function since no Lambda function found from skill.json.');
            createLambda.create(skillName, skillId, skillInfo, createResult.createList, (skillInfoToCreate) => {
                afterCreate.updateSkillSchema(skillInfoToCreate);
                skillInfo = parser.extractSkillInfo(skillSchema);
                updateSkill.update(skillId, false);
            });
        } else {
            console.log('Updating Lambda function...');

            Object.keys(skillInfo).forEach((domain) => {
                upload.uploadByName(skillInfo[domain].url, path.join(currentDir, 'lambda', domain));
            });
        }
    }
};
