'use strict';

const template = require('../utils/template');
const path = require('path');
const fs = require('fs.extra');

// Public
module.exports = {
    clone: (newProjectRootPath, skillId, skillInfo, profile) => {
        createProjectDirectory(newProjectRootPath, skillInfo);
        template.copyConfig(path.join(newProjectRootPath, '.ask/config'), skillId, true, profile);
        console.log('Project directory for ' + skillInfo.skillName + ' created at\n' +
            '    ./'+ skillInfo.skillName + '\n');
    }
};

// Private
function createProjectDirectory(newProjectRootPath, skillInfo) {
    if (fs.existsSync(newProjectRootPath)) {
        console.warn('Project with same name existed. Project will be overwritten.\n');
        // TODO make an option to stop the process, and make a flag to enforce the process. so that the behaviour
        // will be: if someone uses the bash script, they can use clone with enforcing flag so prevent the promote
        // option. Otherwise, a promoter will pop out and ask a user whether to override the existing project or not.
        fs.removeSync(newProjectRootPath);
    }
    fs.mkdirSync(newProjectRootPath);

    let askConfigPath = path.join(newProjectRootPath, '.ask');
    if (!fs.existsSync(askConfigPath)) {
        fs.mkdirSync(askConfigPath);
    }

    if (skillInfo.domainList && skillInfo.domainList.indexOf('custom') !== -1) {
        let modelPath = path.join(newProjectRootPath, 'models');
        if (!fs.existsSync(modelPath)) {
            fs.mkdirSync(modelPath);
        }
    }

    if (skillInfo.hasLambdaFunction) {
        let lambdaPath = path.join(newProjectRootPath, 'lambda');
        if (!fs.existsSync(lambdaPath)) {
            fs.mkdirSync(lambdaPath);
        }
    }
}
