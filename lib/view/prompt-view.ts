import {accessSync, constants} from "fs";
import inquirer from "inquirer";
import {filterNonAlphanumeric} from "../utils/string-utils";
import {uiCallback} from "../model/callback";

/**
 * To get user's input project folder name
 * @param {string} defaultName a default project name
 * @param {uiCallback} callback { error, response }
 */
export function getProjectFolderName(defaultName: string, callback: uiCallback) {
  inquirer
    .prompt([
      {
        message: "Please type in your folder name for the skill project (alphanumeric): ",
        type: "input",
        default: defaultName,
        name: "projectFolderName",
        validate: (input) => {
          if (!input || filterNonAlphanumeric(input) === "") {
            return 'Project folder name should consist of alphanumeric character(s) plus "-" only.';
          }
          try {
            accessSync(process.cwd(), constants.W_OK);
          } catch (error) {
            return `No write access inside of the folder: ${process.cwd()}.`;
          }
          return true;
        },
      },
    ])
    .then((answer) => {
      callback(null, filterNonAlphanumeric(answer.projectFolderName));
    })
    .catch((error) => {
      callback(error);
    });
}
