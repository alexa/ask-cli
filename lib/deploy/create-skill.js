'use strict';

const apiWrapper = require('../api/api-wrapper');
const installNodeModule = require('../new/install-node-module');
const parser = require('../utils/skill-parser');
const template = require('../utils/template');
const tools = require('../utils/tools');
const path = require('path');
const async = require('async');
const clui = require('clui');
const fs = require('fs');

// Public
module.exports = {
    create: (skillInfo, skillName, lambdaCallback) => {
        if (!skillName || !skillName.length) {
            console.warn('Skill name should not be empty. Please set skill name in skill.json.');
            return;
        }
        if (parser.isSkillNameValid(skillName)) {
            console.log('-------------------- Create Skill Project --------------------');
            highLevelCreateSkill((data) => {
                let Spinner = clui.Spinner;
                let createSkillSpinner = new Spinner(' Creating new skill...');
                createSkillSpinner.start();
                updateLambdaDirectory(skillInfo, (err) => {
                    createSkillSpinner.stop();
                    if (err) {
                        console.error(err);
                        return;
                    }
                    let skillData = tools.convertDataToJsonObject(data);
                    if (skillData) {
                        console.log('Done with creating new skill.');
                        console.log('    Skill ID: ' + skillData.skillId + '\n');
                        lambdaCallback(skillData);
                    }
                });
            });
        } else {
            console.warn('Skill name is not valid.\n' +
                'Pattern of the name should be /[a-zA-Z0-9-_]+/.');
        }
    }
};


// Private
function updateLambdaDirectory(skillInfo, callback) {
    // TODO Currently use custom template for all types. Need to change to its own template
    async.each(Object.keys(skillInfo), (domain, updateDirCallback) => {
        let lambdaPath = path.join(process.cwd(), 'lambda', domain);
        if (!fs.existsSync(lambdaPath)) {
            fs.mkdirSync(lambdaPath);
        }
        fs.readdir(lambdaPath, (err, data) => {
            if (err) {
                updateDirCallback(err);
                return;
            }
            if (data.length === 0) {
                template.copyLambda(lambdaPath);
                installNodeModule.install(lambdaPath, false, () => {
                    updateDirCallback();
                });
            } else {
                updateDirCallback();
            }
        });
    }, (err) => {
        if (err) {
            callback(err);
        } else {
            callback();
        }
    });
}

function highLevelCreateSkill(callback) {
    let skillFile = path.join(process.cwd(), 'skill.json');
    if (!fs.existsSync(skillFile)) {
        console.warn("Can't find skill.json in current working directory.");
        return;
    }
    apiWrapper.callCreateSkill(skillFile, callback);
}
