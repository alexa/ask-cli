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
        let skillType = parser.parseSkillType(skillSchema);
        if (skillType === 'flashbriefing') {
            console.log('No Lambda function deploy for this skill.\n');
            return;
        }
        let needCreateLambda = afterCreate.shouldCreateLambda(skillSchema, skillType);
        if (needCreateLambda === null) {
            return;
        }
        if (needCreateLambda) {
            let skillName = parser.parseSkillName(skillSchema);
            if (!skillName) {
                return;
            }
            console.log('Creating Lambda function since no Lambda function found from skill.json.');
            createLambda.create(skillName, skillType, skillId, (lambdaData) => {
                afterCreate.updateSkillSchema(skillType, lambdaData);
                updateSkill.update(skillId, false, () => {});
            });
        } else {
            let lambdaArn = parser.parseLambdaWithSkillType(skillSchema, skillType);
            console.log('Updating Lambda function...');
            if (lambdaArn.hasOwnProperty('custom')) {
                upload.uploadByName(lambdaArn.custom, path.join(currentDir, 'lambda', 'custom'));
            }
            if (lambdaArn.hasOwnProperty('smarthome')) {
                upload.uploadByName(lambdaArn.smarthome, path.join(currentDir, 'lambda', 'smarthome'));
            }
        }
    }
};
