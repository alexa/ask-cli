import fs from 'fs';
import inquirer from 'inquirer';

import stringUtils from '@src/utils/string-utils';

/**
 * To get user's input project folder name
 * @param {string} defaultName a default project name
 * @param {callback} callback { error, response }
 */
export function getProjectFolderName(
    defaultName: string,
    callback: (err: Error | null, name?: string) => void
) {
    inquirer.prompt([{
        message: 'Please type in your folder name for the skill project (alphanumeric): ',
        type: 'input',
        default: defaultName,
        name: 'projectFolderName',
        validate: (input) => {
            if (!input || stringUtils.filterNonAlphanumeric(input) === '') {
                return 'Project folder name should consist of alphanumeric character(s) plus "-" only.';
            }
            try {
                fs.accessSync(process.cwd(), fs.constants.W_OK);
            } catch (error) {
                return `No write access inside of the folder: ${process.cwd()}.`;
            }
            return true;
        }
    }]).then((answer) => {
        callback(null, stringUtils.filterNonAlphanumeric(answer.projectFolderName));
    }).catch((error: Error) => {
        callback(error);
    });
}
