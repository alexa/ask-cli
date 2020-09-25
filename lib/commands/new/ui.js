const R = require('ramda');
const chalk = require('chalk');
const path = require('path');
const inquirer = require('inquirer');

const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');

const SKIP_DEPLOY_DELEGATE_SELECTION = 'self-hosted and manage your own hosting';

module.exports = {
    getSkillName,
    getSkillLocale,
    getSkillDefaultRegion,
    getProjectFolderName,
    selectSkillCodeLanguage,
    getTargetTemplateName,
    confirmUsingUnofficialTemplate,
    getDeploymentType,

    SKIP_DEPLOY_DELEGATE_SELECTION
};

function getSkillName(url, callback) {
    const defaultName = url ? path.basename(url, path.extname(url)) : CONSTANTS.HOSTED_SKILL.DEFAULT_SKILL_NAME;
    inquirer.prompt([{
        message: 'Please type in your skill name: ',
        type: 'input',
        default: defaultName,
        name: 'skillName',
        validate: (input) => {
            if (!stringUtils.isNonBlankString(input)) {
                return 'Skill name can\'t be empty.';
            }
            return true;
        }
    }]).then((answer) => {
        callback(null, answer.skillName.trim());
    }).catch((error) => {
        callback(error);
    });
}

function getSkillLocale(callback) {
    inquirer.prompt([{
        message: 'Choose the default locale for your skill: ',
        type: 'list',
        choices: CONSTANTS.HOSTED_SKILL.LOCALES,
        name: 'locale',
        pageSize: 5
    }]).then((answer) => {
        callback(null, answer.locale);
    }).catch((error) => {
        callback(error);
    });
}

function getSkillDefaultRegion(callback) {
    inquirer.prompt([{
        message: 'Choose the default region for your skill: ',
        type: 'list',
        choices: Object.keys(CONSTANTS.HOSTED_SKILL.REGIONS),
        name: 'region'
    }]).then((answer) => {
        callback(null, CONSTANTS.HOSTED_SKILL.REGIONS[answer.region]);
    }).catch((error) => {
        callback(error);
    });
}

function getProjectFolderName(defaultName, callback) {
    inquirer.prompt([{
        message: 'Please type in your folder name for the skill project (alphanumeric): ',
        type: 'input',
        default: defaultName,
        name: 'projectFolderName',
        validate: (input) => {
            if (!input || stringUtils.filterNonAlphanumeric(input) === '') {
                return 'Project folder name should be consisted of alphanumeric character(s) plus "-" only.';
            }
            return true;
        }
    }]).then((answer) => {
        callback(null, stringUtils.filterNonAlphanumeric(answer.projectFolderName));
    }).catch((error) => {
        callback(error);
    });
}

function selectSkillCodeLanguage(callback) {
    inquirer.prompt([{
        type: 'list',
        message: 'Choose the programming language you will use to code your skill: ',
        name: 'language',
        choices: Object.keys(CONSTANTS.TEMPLATES.LANGUAGE_MAP)
    }]).then((answer) => {
        callback(null, answer.language.trim());
    }).catch((error) => {
        callback(error);
    });
}

function getTargetTemplateName(templateMap, callback) {
    const templateList = R.keys(templateMap).map((templateName) => {
        const description = templateMap[templateName].description || '';
        return `${templateName}\n  ${chalk.gray(description)}`;
    });
    inquirer.prompt([{
        type: 'list',
        message: 'Choose a template to start with: ',
        name: 'templateName',
        choices: templateList,
        pageSize: 30,
        filter: input => input.replace(/\n.*/g, '')
    }]).then((answer) => {
        callback(null, answer.templateName);
    }).catch((error) => {
        callback(error);
    });
}

function confirmUsingUnofficialTemplate(callback) {
    inquirer.prompt([{
        message: 'Would you like to continue download the skill template? ',
        type: 'confirm',
        name: 'confirmation',
        default: false
    }]).then((answer) => {
        callback(null, answer.confirmation);
    }).catch((error) => {
        callback(error);
    });
}

function getDeploymentType(deployType, callback) {
    const deployDelegateChoices = R.values(deployType).map(
        (deployer) => `${deployer.OPTION_NAME}\n  ${chalk.gray(deployer.DESCRIPTION)}`
    );
    deployDelegateChoices.push(new inquirer.Separator());
    deployDelegateChoices.push(SKIP_DEPLOY_DELEGATE_SELECTION);
    inquirer.prompt([{
        message: 'Choose a method to host your skill\'s backend resources: ',
        type: 'list',
        name: 'deployDelegate',
        choices: deployDelegateChoices,
        pageSize: 30,
        filter: input => input.replace(/\n.*/g, '')
    }]).then((answer) => {
        if (answer.deployDelegate === SKIP_DEPLOY_DELEGATE_SELECTION) {
            return callback();
        }
        callback(null, R.find(R.propEq('OPTION_NAME', answer.deployDelegate))(R.values(deployType)).NAME);
    }).catch((error) => {
        callback(error);
    });
}
