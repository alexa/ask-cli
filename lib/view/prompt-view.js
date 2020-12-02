const inquirer = require('inquirer');

const stringUtils = require('@src/utils/string-utils');

module.exports = {
    getProjectFolderName
};

/**
 * To get user's input project folder name
 * @param {string} defaultName a default project name
 * @param {callback} callback { error, response }
 */
function getProjectFolderName(defaultName, callback) {
    inquirer.prompt([{
        message: 'Please type in your folder name for the skill project (alphanumeric): ',
        type: 'input',
        default: defaultName,
        name: 'projectFolderName',
        validate: (input) => {
            if (!input || stringUtils.filterNonAlphanumeric(input) === '') {
                return 'Project folder name should consist of alphanumeric character(s) plus "-" only.';
            }
            return true;
        }
    }]).then((answer) => {
        callback(null, stringUtils.filterNonAlphanumeric(answer.projectFolderName));
    }).catch((error) => {
        callback(error);
    });
}
