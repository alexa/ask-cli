'use strict';

const template = require('../utils/template');
const tools = require('../utils/tools');
const path = require('path');
const fs = require('fs');

// Public
module.exports = {
    clone: (newProjectRootPath, skillId, skillName, skillType) => {
        createProjectDirectory(newProjectRootPath, skillType);
        createProjectConfig(path.join(newProjectRootPath, '.ask/config'), skillId);
        console.log('Project directory for ' + skillName + ' created at\n' +
            '    ./'+ skillName + '\n');
    }
};

// Private
function createProjectDirectory(newProjectRootPath, skillType) {
    let modelPath = path.join(newProjectRootPath, 'models');
    let lambdaPath = path.join(newProjectRootPath, 'lambda');
    let customPath = path.join(lambdaPath, 'custom');
    let smarthomePath = path.join(lambdaPath, 'smartHome');
    let askConfigPath = path.join(newProjectRootPath, '.ask');

    if (fs.existsSync(newProjectRootPath)) {
        console.warn('Project with same name existed. Project will be overwritten.\n');
        tools.removeDirectory(newProjectRootPath);
    }
    fs.mkdirSync(newProjectRootPath);
    if (!fs.existsSync(askConfigPath)) {
        fs.mkdirSync(askConfigPath);
    }
    if (skillType !== 'flashbriefing') {
        if (skillType === 'custom' && !fs.existsSync(modelPath)) {
            fs.mkdirSync(modelPath);
        }
        if (!fs.existsSync(lambdaPath)) {
            fs.mkdirSync(lambdaPath);
            if (skillType === 'custom') {
                fs.mkdirSync(customPath);
            }
            if (skillType === 'smarthome') {
                fs.mkdirSync(smarthomePath);
            }
        }
    }
}

function createProjectConfig(configPath, skillId) {
    template.copyConfig(configPath, skillId, true);
}
