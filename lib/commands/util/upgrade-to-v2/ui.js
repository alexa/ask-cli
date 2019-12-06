const R = require('ramda');
const path = require('path');
const inquirer = require('inquirer');
const Messenger = require('@src/view/messenger');
const CONSTANTS = require('@src/utils/constants');

module.exports = {
    displayPreview,
    confirmPreview
};

function displayPreview(upgradeInfo) {
    const { skillId, lambdaResources } = upgradeInfo;
    Messenger.getInstance().info(`Preview of the upgrade result from v1 to v2:
- The original v1 skill project will be entirely moved to .${path.sep}${CONSTANTS.FILE_PATH.LEGACY_PATH}${path.sep}
- JSON files for Skill ID ${skillId} (such as skill.json) will be moved to .${path.sep}${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE}${path.sep}
${_displayLambdaCodePreview(lambdaResources)}`);
}

function confirmPreview(callback) {
    const question = {
        type: 'confirm',
        name: 'confirmPreview',
        message: 'Do you want to execute the upgrade based on the preview above? '
    };
    inquirer.prompt(question).then((answer) => {
        callback(null, answer.confirmPreview);
    }).catch((err) => {
        callback(err);
    });
}

function _displayLambdaCodePreview(lambdaResources) {
    if (R.keys(lambdaResources).length === 0) {
        return '- No existing Lambda in the v1 "lambda" resource thus no action for Lambda codebase.';
    }
    let lambdaPreview = '- Existing Lambda codebase will be moved into "code" folder';
    R.keys(lambdaResources).forEach((region) => {
        const { codeUri, v2CodeUri, arn } = lambdaResources[region];
        // TODO check when codeUri is a single file
        if (arn) {
            lambdaPreview += `\n  - Region ${region}: v1 "${codeUri}" -> v2 "${v2CodeUri}" for existing Lambda ARN ${arn}`;
        } else {
            lambdaPreview += `\n  - Region ${region}: v1 "${codeUri}" -> v2 "${v2CodeUri}" and will create new Lambda`;
        }
    });
    return lambdaPreview;
}
