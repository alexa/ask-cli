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
            .action(handle);

        function handle(options) {
            let currentDir = process.cwd();
            let target = options.target;
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
            let skillType = parser.parseSkillType(skillSchema);
            if (!skillType) {
                return;
            }
            let projectConfigFile = path.join(currentDir, '.ask', 'config');
            if (!fs.existsSync(projectConfigFile)) {
                console.warn('Failed to deploy. ' +
                    'Please check if this is the root of skill project.');
                return;
            }
            let projectConfig = jsonRead.readFile(projectConfigFile);
            if (!projectConfig) {
                return;
            }
            let defaultSkillId = jsonRead.getProperty(projectConfig,
                '.deploy_settings.default.skill_id');
            if (defaultSkillId) {
                updateDeploy(defaultSkillId, skillType, target);
            } else {
                if (target) {
                    console.warn('No target for the first time deploy.\n' +
                    'Please run "ask deploy" only.');
                    return;
                }
                createDeploy();
            }
        }
    }
};

// Private
function createDeploy() {
    let skillSchema = jsonRead.readFile(path.join(process.cwd(), 'skill.json'));
    if (!skillSchema) {
        return;
    }
    let skillType = parser.parseSkillType(skillSchema);
    if (!skillType) {
        return;
    }
    createSkill.create(skillSchema, (skillData) => {
        afterCreate.updateSkillConfig(skillData.skillId);

        let willCreateLambda = afterCreate.shouldCreateLambda(skillSchema, skillType);
        if (willCreateLambda === null) {
            return;
        }
        if (willCreateLambda) {
            let skillName = parser.parseSkillName(skillSchema);
            if (!skillName) {
                return;
            }
            createLambda.create(skillName, skillType, skillData.skillId, (lambdaData) => {
                console.log('-------------------- Update Skill Project --------------------');
                afterCreate.updateSkillSchema(skillType, lambdaData);
                updateSkill.update(skillData.skillId, skillType === 'custom', () => {
                    updateLambda.update();
                });
            });
        } else {
            let lambdaArns = parser.parseLambdaWithSkillType(skillSchema, skillType);
            if (lambdaArns) {
                Object.keys(lambdaArns).forEach((type) => {
                    console.log('Lambda ARN for ' + type + ' skill: ' + lambdaArns[type]);
                });
                console.log('Lambda ARN(s) already been specified. No Lambda function created.\n');
                console.log('-------------------- Update Skill Project --------------------');
                updateSkill.update(skillData.skillId, skillType === 'custom', () => {
                    updateLambda.update();
                });
            }
        }
    });
}

function updateDeploy(skillId, skillType, target) {
    checkClone.check(skillType, () => {
        console.log('-------------------- Update Skill Project --------------------');
        if (!target || target === 'all') {
            updateSkill.update(skillId, skillType === 'custom', () => {
                updateLambda.update(skillId);
            });
        } else if (target === 'lambda') {
            updateLambda.update(skillId);
        } else if (target === 'skill') {
            updateSkill.update(skillId, skillType === 'custom', () => {});
        }
    });
}
