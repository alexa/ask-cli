'use strict';

const apiWrapper = require('./api-wrapper');
const tools = require('../utils/tools');
const fs = require('fs');

// Public
module.exports = {
    createCommand: (commander) => {
        buildCreateSkillCommand(commander);
        buildGetSkillCommand(commander);
        buildUpdateSkillCommand(commander);
    }
};

// Private
function buildCreateSkillCommand(commander) {
    commander
        .command('create-skill')
        .description('create skill with skill schema')
        .option('-f||--file <file-path>', 'path for skill schema')
        .action(handle);

    function handle(options) {
        if (!options.file) {
            console.warn('Please input required parameter: file.');
            return;
        }
        if (!fs.existsSync(options.file)) {
            console.warn('Please verify skill schema is in current working directory.');
            return;
        }
        apiWrapper.callCreateSkill(options.file, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log('Skill created successfully.\n' +
                'Skill ID: ' + response.skillId + '\n' +
                'Skill Stage: ' + response.stage);
            }
        });
    }
}

function buildGetSkillCommand(commander) {
    commander
        .command('get-skill')
        .description('get skill schema')
        .option('-s|--skill-id <skill-id>', 'skill-id for the skill')
        .option('--stage <stage>', 'stage for the skill')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        apiWrapper.callGetSkill(options.skillId, options.stage, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log(JSON.stringify(response, null, 2));
            }
        });
    }
}

function buildUpdateSkillCommand(commander) {
    commander
        .command('update-skill')
        .description('update skill with skill schema')
        .option('-s|--skill-id <skill-id>', 'skill-id for the skill')
        .option('-f||--file <file-path>', 'path for skill schema')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        if (!options.file) {
            console.warn('Please input required parameter: file.');
            return;
        }
        if (!fs.existsSync(options.file)) {
            console.warn('Please verify skill schema is in current working directory.');
            return;
        }
        apiWrapper.callUpdateSkill(options.skillId, options.file, () => {
            console.log('Skill updated successfully.');
        });
    }
}
