import {find, propEq, view, lensPath} from "ramda";
import {gray} from "chalk";
import inquirer from "inquirer";
import {HOSTED_SKILL} from "../../utils/constants";
import {callbackError, uiCallback} from "../../model/callback";
import {isNonBlankString} from "../../utils/string-utils";
import {
  NewSkillDeployerTypeInfo,
  NewSkillCodeLanguage,
} from ".";
import {SampleTemplate} from "../../model/sample-template";

/**
 * Prompts the user to type a skill name and defaults to the name of the repo in the URL argument if provided.
 *
 * @param {string} url A url of the skill sample repository, used to determine the default skill name
 * @param {uiCallback} callback function that will be called with the resulting value or error
 */
export function getSkillName(callback: uiCallback): void {
  inquirer
    .prompt([
      {
        message: "Please type in your skill name: ",
        type: "input",
        default: HOSTED_SKILL.DEFAULT_SKILL_NAME,
        name: "skillName",
        validate: (input) => {
          if (!isNonBlankString(input)) {
            return "Skill name can't be empty.";
          }
          return true;
        },
      },
    ])
    .then((answer) => {
      callback(null, answer.skillName.trim());
    })
    .catch((error) => {
      callback(error);
    });
}

/**
 * Prompts for the default locale to use for the skill
 * i.e.  en-US, de-DE, fr-FR...
 *
 * @param {uiCallback} callback function that will be called with the resulting value or error
 */
export function getSkillLocale(callback: uiCallback): void {
  inquirer
    .prompt([
      {
        message: "Choose the default locale for your skill: ",
        type: "list",
        choices: HOSTED_SKILL.LOCALES,
        name: "locale",
        pageSize: 5,
      },
    ])
    .then((answer) => {
      callback(null, answer.locale);
    })
    .catch((error) => {
      callback(error);
    });
}

/**
 * Prompts the user to select the default AWS Region to deploy the skill resources to
 * ie. us-east-1
 *
 * @param {uiCallback} callback function that will be called with the resulting value or error
 */
export function getSkillDefaultRegion(callback: uiCallback): void {
  inquirer
    .prompt([
      {
        message: "Choose the default region for your skill: ",
        type: "list",
        choices: Object.keys(HOSTED_SKILL.REGIONS),
        name: "region",
      },
    ])
    .then((answer) => {
      callback(null, answer.region);
    })
    .catch((error) => {
      callback(error);
    });
}

/**
 * Prompts the user to select what coding language to use for the sample skill
 * i.e. NodeJs, Python, Java
 *
 * @param {NewSkillCodeLanguage[]} languages to offer as options
 * @param {uiCallback} callback function that will be called with the resulting value or error
 */
export function selectSkillCodeLanguage(languages: NewSkillCodeLanguage[], callback: uiCallback): void {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Choose the programming language you will use to code your skill: ",
        name: "language",
        choices: languages,
      },
    ])
    .then((answer) => {
      callback(null, answer.language.trim());
    })
    .catch((error) => {
      callback(error);
    });
}

/**
 * Prompts the user to select what Template they want to clone
 *
 * @param {SampleTemplate[]} templateMap the list of templates to select from
 * @param {uiCallback} callback function that will be called with the resulting value or error
 */
export function getTargetTemplateName(
  templateMap: SampleTemplate[],
  callback: (err: callbackError, sampleTemplate: SampleTemplate | undefined) => void,
): void {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Choose a template to start with: ",
        name: "templateName",
        choices: templateMap.map((sampleTemplate) => `${String(sampleTemplate.name)}\n  ${gray(sampleTemplate.desc)}`),
        pageSize: 30,
        filter: (input_1) => input_1.replace(/\n.*/g, ""),
      },
    ])
    .then((answer) => {
      callback(
        null,
        templateMap.find((sampletemplate) => sampletemplate.name === answer.templateName),
      );
    })
    .catch((error) => {
      callback(error, undefined);
    });
}

/**
 * Prompts the user to continue [yes or no] cloning the remote repo locally.
 * ie. if the repository is not an official Amazon Alexa Skill sample template
 *
 * @param {uiCallback} callback function that will be called with the resulting value or error
 */
export function confirmUsingUnofficialTemplate(callback: uiCallback): void {
  inquirer
    .prompt([
      {
        message: "Would you like to continue download the skill template? ",
        type: "confirm",
        name: "confirmation",
        default: false,
      },
    ])
    .then((answer) => {
      callback(null, answer.confirmation);
    })
    .catch((error) => {
      callback(error);
    });
}

/**
 * Prompts the user to select a Deployment Type
 * i.e. Lambda vs CloudFormation vs Alexa hosted vs self hosted
 *
 * @param {NewSkillDeployerTypeInfo[]} deployType An array of possible deployment types
 * @param {uiCallback} callback function that will be called with the resulting value or error
 */
export function getDeploymentType(deployType: NewSkillDeployerTypeInfo[], callback: uiCallback): void {
  const deployDelegateChoices = deployType.map((deployer) => `${deployer.OPTION_NAME}\n  ${gray(deployer.DESCRIPTION)}`);
  inquirer
    .prompt([
      {
        message: "Choose a method to host your skill's backend resources: ",
        type: "list",
        name: "deployDelegate",
        choices: deployDelegateChoices,
        pageSize: 30,
        filter: (input) => input.replace(/\n.*/g, ""),
      },
    ])
    .then((answer) => {
      const selectedDeployDelegate = find(propEq("OPTION_NAME", answer.deployDelegate))(deployType);
      callback(null, view(lensPath(["NAME"]), selectedDeployDelegate));
    })
    .catch((error) => {
      callback(error);
    });
}
