'use strict';

const template = require('../utils/template');
const tools = require('../utils/tools');
const path = require('path');
const fs = require('fs');

// Public
module.exports = {
    clone: (newProjectRootPath, skillId, skillName, skillInfo) => {
        createProjectDirectory(newProjectRootPath, skillInfo);
        createProjectConfig(path.join(newProjectRootPath, '.ask/config'), skillId);
        console.log('Project directory for ' + skillName + ' created at\n' +
            '    ./'+ skillName + '\n');
    }
};

// Private
function createProjectDirectory(newProjectRootPath, skillInfo) {
    let modelPath = path.join(newProjectRootPath, 'models');
    let lambdaPath = path.join(newProjectRootPath, 'lambda');
    let askConfigPath = path.join(newProjectRootPath, '.ask');

    if (fs.existsSync(newProjectRootPath)) {
        console.warn('Project with same name existed. Project will be overwritten.\n');
        tools.removeDirectory(newProjectRootPath);
    }
    fs.mkdirSync(newProjectRootPath);
    if (!fs.existsSync(askConfigPath)) {
        fs.mkdirSync(askConfigPath);
    }
    if (skillInfo.hasOwnProperty('custom')) {
        if (!fs.existsSync(modelPath)) {
            fs.mkdirSync(modelPath);
        }
    }
    Object.keys(skillInfo).forEach((domain) => {
        if (!fs.existsSync(lambdaPath)) {
            fs.mkdirSync(lambdaPath);
        }
        fs.mkdirSync(path.join(lambdaPath, domain));
    });
}

function createProjectConfig(configPath, skillId) {
    template.copyConfig(configPath, skillId, true);
}
