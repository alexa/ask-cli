'use strict';

const createSkill = require('./create-skill');
const createLambda = require('./create-lambda');
const updateSkill = require('./update-skill');
const updateLambda = require('./update-lambda');
const afterCreate = require('./after-create');
const checkClone = require('./check-clone');
const parser = require('../utils/skill-parser');
const jsonRead = require('../utils/json-read');
const path = require('path');
const fs = require('fs');

// Public
module.exports = {
    createCommand: (commander) => {
        commander
            .command('deploy')
            .description('deploy Alexa skill')
            .option('-t|--target <target>', 'deploy lambda or skill or both')
            .option('--wait', 'keep polling status until the model build is finished')
            .action(handle);

        function handle(options) {
            let currentDir = process.cwd();
            let target = options.target;
            let isWaiting = options.wait;
            if (isWaiting === undefined) {
                isWaiting = false;
            }
            if (target) {
                target = target.toLowerCase();
            }
            if (target && target !== 'all' && target !== 'lambda' && target !== 'skill') {
                console.warn('Target not recognized. ' +
                    'Options can only be "all", "lambda", "skill".');
                return;
            }
            let skillFile = path.join(currentDir, 'skill.json');
            if (!fs.existsSync(skillFile)) {
                console.warn("Can't find skill.json in current working directory.");
                return;
            }
            let skillSchema = jsonRead.readFile(skillFile);
            if (!skillSchema) {
                return;
            }
            let skillInfo = parser.extractSkillInfo(skillSchema);
            if (!skillInfo) {
                return;
            }
            let projectConfigFile = path.join(currentDir, '.ask', 'config');
            if (!fs.existsSync(projectConfigFile)) {
                console.warn('Failed to deploy. ' +
                    "Please ensure current working directory is skill project's root directory and contains .ask directory.");
                return;
            }
            let projectConfig = jsonRead.readFile(projectConfigFile);
            if (!projectConfig) {
                return;
            }
            let defaultSkillId = jsonRead.getProperty(projectConfig,
                '.deploy_settings.default.skill_id');
            if (defaultSkillId) {
                updateDeploy(defaultSkillId, skillInfo, target, isWaiting);
            } else {
                if (target) {
                    console.warn('No target for the first time deploy.\n' +
                    'Please run "ask deploy" only.');
                } else {
                    createDeploy(skillSchema, skillInfo, isWaiting);
                }
            }
        }
    }
};

// Private
function createDeploy(skillSchema, skillInfo, isWaiting) {
    let skillName = parser.parseSkillName(skillSchema);
    if (!skillName) {
        return;
    }
    createSkill.create(skillInfo, skillName, (skillData) => {
        afterCreate.updateSkillConfig(skillData.skillId);
        let createResult = afterCreate.shouldCreateLambda(skillSchema, skillInfo);
        if (!createResult) {
            return;
        }
        if (createResult.willCreate) {
            createLambda.create(skillName, skillData.skillId, skillInfo, createResult.createList, (skillInfoToCreate) => {
                console.log('-------------------- Update Skill Project --------------------');
                afterCreate.updateSkillSchema(skillInfoToCreate);
                updateSkill.update(skillData.skillId, skillInfo.hasOwnProperty('custom'), isWaiting, () => {
                    updateLambda.update(skillData.skillId);
                });
            });
        } else {
            Object.keys(skillInfo).forEach((domain) => {
                console.log('Lambda ARN for ' + domain + ' skill: ' + skillInfo[domain].url);
            });
            console.log('Lambda ARN(s) already been specified. No Lambda function created.\n');
            console.log('-------------------- Update Skill Project --------------------');
            updateSkill.update(skillData.skillId, skillInfo.hasOwnProperty('custom'), isWaiting, () => {
                updateLambda.update(skillData.skillId);
            });
        }
    });
}

function updateDeploy(skillId, skillInfo, target, isWaiting) {
    checkClone.check(skillInfo, () => {
        console.log('-------------------- Update Skill Project --------------------');
        if (!target || target === 'all') {
            updateSkill.update(skillId, skillInfo.hasOwnProperty('custom'), isWaiting, () => {
                updateLambda.update(skillId);
            });
        } else if (target === 'lambda') {
            updateLambda.update(skillId);
        } else if (target === 'skill') {
            updateSkill.update(skillId, skillInfo.hasOwnProperty('custom'), isWaiting, () => {});
        }
    });
}
