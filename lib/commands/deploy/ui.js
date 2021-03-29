const inquirer = require('inquirer');
const path = require('path');
const CONSTANTS = require('@src/utils/constants');
const fs = require('fs');

module.exports = {
    confirmDeploymentIfNeeded
};

/**
 * Confirms the deployment before deploying the skill.
 * Today, confirmation is rendered only when skill project has ACDL files in it.
 */
function confirmDeploymentIfNeeded(callback) {
    const conversationsPath = path.join(
        process.cwd(),
        CONSTANTS.COMPILER.ROOTDIR,
        CONSTANTS.COMPILER.SKILL_PACKAGE.CONVERSATIONS
    );

    if(fs.existsSync(conversationsPath)) {    
        inquirer.prompt([{
            message: 'Skills with ACDL are not yet compatible with the https://developer.amazon.com, hence this skill will be disabled on the Developer Console. Would you like to proceed?',
            type: 'confirm',
            name: 'confirmation',
            default: false
        }]).then((answer) => {
            callback(null, answer.confirmation);
        }).catch((error) => {
            callback(error);
        });
    } else {
        callback(null, true);
    }
}