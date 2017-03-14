'use strict';

const installNodeModule = require('./install-node-module');
const template = require('../utils/template');
const parser = require('../utils/skill-parser');
const fs = require('fs');
const path = require('path');

// Public
module.exports = {
    createCommand: (commander) => {
        commander
            .command('new')
            .description('create Alexa skill project')
            .option('-n|--skill-name <name>', 'create new skill project with skill name')
            .action(handle);

        function handle(options) {
            if (!options.skillName) {
                console.warn('Please enter the skill-name for the new project.');
                return;
            }
            if (parser.isSkillNameValid(options.skillName)) {
                newSkillScaffold(options.skillName);
            } else {
                console.warn('Skill name is not valid.\n' +
                    'Pattern of the name should be /[a-zA-Z0-9-_]+/.');
            }
        }
    }
};

// Private
function newSkillScaffold(skillName) {
    let currentDir = process.cwd();
    fs.access(currentDir, (fs.constants || fs).W_OK, (err) => {
        if (err) {
            console.error('No permission to write for the current path.');
        } else {
            let newProjDir = path.join(currentDir, skillName);
            if (fs.existsSync(newProjDir)) {
                console.warn('Failed to create skill project with the name already existed.');
                return;
            }

            let configFilePath = path.join(newProjDir, '.ask', 'config');
            let modelFilePath = path.join(newProjDir, 'models', 'en-US.json');
            let skillFilePath = path.join(newProjDir, 'skill.json');
            let customLambdaPath = path.join(newProjDir, 'lambda', 'custom');

            fs.mkdirSync(newProjDir);
            fs.mkdirSync(path.join(newProjDir, '.ask'));
            fs.mkdirSync(path.join(newProjDir, 'lambda'));
            fs.mkdirSync(path.join(newProjDir, 'lambda', 'custom'));
            fs.mkdirSync(path.join(newProjDir, 'models'));

            template.copyConfig(configFilePath);
            template.copyModel(modelFilePath);
            template.copySkill(skillFilePath, skillName);
            template.copyLambda(customLambdaPath);

            installNodeModule.install(customLambdaPath, true, () => {
                console.log('New project for Alexa skill created.');
            });
        }
    });
}
