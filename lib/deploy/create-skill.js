'use strict';

const apiWrapper = require('../api/api-wrapper');
const parser = require('../utils/skill-parser');
const template = require('../utils/template');
const tools = require('../utils/tools');
const path = require('path');
const fs = require('fs');

// Public
module.exports = {
    create: (skillSchema, lambdaCallback) => {
        let skillType = parser.parseSkillType(skillSchema);
        let skillName = parser.parseSkillName(skillSchema);
        if (!skillName || !skillName.length) {
            console.warn('Skill name should not be empty. Please set skill name in skill.json.');
            return;
        }
        if (parser.isSkillNameValid(skillName)) {
            console.log('-------------------- Create Skill Project --------------------');
            highLevelCreateSkill((data) => {
                let skillData = tools.convertDataToJsonObject(data);
                if (skillData) {
                    console.log('Done with creating new skill.');
                    console.log('    Skill ID: ' + skillData.skillId + '\n');
                    resetLambdaFolder(skillType);
                    lambdaCallback(skillData);
                }
            });
        } else {
            console.warn('Skill name is not valid.\n' +
                'Pattern of the name should be /[a-zA-Z0-9-_]+/.');
        }
    }
};


// Private
function highLevelCreateSkill(callback) {
    let skillFile = path.join(process.cwd(), 'skill.json');
    if (!fs.existsSync(skillFile)) {
        console.warn("Can't find skill.json in current working directory.");
        return;
    }
    apiWrapper.callCreateSkill(skillFile, callback);
}

function resetLambdaFolder(skillType) {
    let currentDir = process.cwd();
    let customFolder = path.join(currentDir, 'lambda', 'custom');
    let smarthomeFolder = path.join(currentDir, 'lambda', 'smarthome');
    if (skillType === 'flashbriefing') {
        if (fs.existsSync(customFolder)) {
            tools.removeDirectory(customFolder);
        }
    }
    if (skillType === 'smarthome') {
        if (fs.existsSync(customFolder)) {
            tools.removeDirectory(customFolder);
        }
        if (!fs.existsSync(smarthomeFolder)) {
            fs.mkdirSync(smarthomeFolder);
            template.copyLambda(smarthomeFolder);
        }
    }
}
