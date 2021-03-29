const DeployDelegate = require('@src/controllers/skill-infrastructure-controller/deploy-delegate');
const Messenger = require('@src/view/messenger');
const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');
const urlUtils = require('@src/utils/url-utils');

const ui = require('./ui');

module.exports = {
    collectUserCreationProjectInfo
};

/**
 * Ask for user input to create a project
 * @param {Object} cmd command object
 * @param {Function} callback | error
 *                            | userInput | language
 *                                        | deploymentType
 *                                        | templateInfo  | templateUrl
 *                                                        | templateName
 *                                        | skillName
 *                                        | projectFolderName
 */
function collectUserCreationProjectInfo(cmd, callback) {
    const userInput = {};
    _getSkillCodeLanguage(cmd, (languageErr, language) => {
        if (languageErr) {
            return callback(languageErr);
        }
        userInput.language = language;
        ui.getDeploymentType(CONSTANTS.DEPLOYER_TYPE, (deploymentErr, deploymentType) => {
            if (deploymentErr) {
                return callback(deploymentErr);
            }
            userInput.deploymentType = deploymentType;

            _getSkillLocale(userInput, (localeErr, locale) => {
                if (localeErr) {
                    return callback(localeErr);
                }
                userInput.locale = locale;
                _getSkillDefaultRegion(userInput, (regionErr, region) => {
                    if (regionErr) {
                        return callback(regionErr);
                    }
                    userInput.region = region;
                    _getTemplateInfo(cmd, userInput, (templateErr, templateInfo) => {
                        if (templateErr) {
                            return callback(templateErr);
                        }
                        if (!templateInfo) {
                            return callback();
                        }
                        userInput.templateInfo = templateInfo;
                        ui.getSkillName(userInput.templateInfo.templateUrl, (getSkillNameErr, skillName) => {
                            if (getSkillNameErr) {
                                return callback(getSkillNameErr);
                            }
                            userInput.skillName = skillName;
                            const suggestedProjectName = stringUtils.filterNonAlphanumeric(skillName);
                            ui.getProjectFolderName(suggestedProjectName, (getFolderNameErr, folderName) => {
                                if (getFolderNameErr) {
                                    return callback(getFolderNameErr);
                                }
                                userInput.projectFolderName = folderName;
                                callback(null, userInput);
                            });
                        });
                    });
                });
            });
        });
    });
}

function _getSkillCodeLanguage(cmd, callback) {
    if (cmd.templateUrl) {
        return callback();
    }
    ui.selectSkillCodeLanguage((err, res) => callback(err || null, res));
}

function _getSkillLocale(userInput, callback) {
    if (userInput.deploymentType !== CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME) {
        return callback();
    }
    // FIX hard coding until backend for hosted skills supports all locales
    callback(null, 'en-US');
    // ui.getSkillLocale((err, res) => callback(err || null, res));
}

function _getSkillDefaultRegion(userInput, callback) {
    if (userInput.deploymentType !== CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME) {
        return callback();
    }
    ui.getSkillDefaultRegion((err, res) => callback(err || null, res));
}

/**
 * Get template info for non-hosted skill
 * @param {Object} cmd command object
 * @param {Object} userInput user input initialization setting
 * @param {Function} callback (error, templateInfo { templateUrl, templateName})
 */
function _getTemplateInfo(cmd, userInput, callback) {
    if (userInput.deploymentType === CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME) {
        if (userInput.language === 'Java') {
            return callback('Alexa hosted skills don\'t support Java currently.');
        }
        if (cmd.templateUrl) {
            return callback('No custom template allowed for an Alexa hosted skill.');
        }
        process.nextTick(() => {
            callback(null, { templateUrl: null, templateName: null, templateBranch: null });
        });
    } else {
        if (cmd.templateUrl) {
            return _newWithCustomTemplate(cmd.templateUrl, cmd.debug, (templateErr, templateInfo) => {
                if (templateErr) {
                    return callback(templateErr);
                }
                if (!templateInfo) {
                    return callback();
                }
                templateInfo.templateBranch = cmd.templateBranch;
                return callback(null, templateInfo);
            });
        }
        _newWithOfficialTemplate(userInput.language, userInput.deploymentType, cmd.debug, (templateErr, templateInfo) => {
            if (templateErr) {
                return callback(templateErr);
            }
            callback(null, templateInfo);
        });
    }
}

/**
 * Retrieve templates list by deployment type and language, then ask user to select a template
 * @param {Boolean} doDebug ASK CLI debug mode
 * @param {Function} callback (error, userInput{ skillName, projectFolderPath })
 */
function _newWithOfficialTemplate(language, deploymentType, doDebug, callback) {
    let templateIndexUrl;
    if (!deploymentType) {
        templateIndexUrl = CONSTANTS.TEMPLATES.PROJECT_BY_CODE_LANGUAGE[language].TEMPLATE_INDEX;
    } else {
        templateIndexUrl = DeployDelegate.builtin[deploymentType].templates.language_map[language];
    }
    _retrieveTemplateIndexMap(templateIndexUrl, doDebug, (httpErr, templateIndexMap) => {
        if (httpErr) {
            return callback(httpErr);
        }
        ui.getTargetTemplateName(templateIndexMap, (templateNameErr, templateName) => {
            if (templateNameErr) {
                return callback(templateNameErr);
            }
            callback(null, { templateUrl: templateIndexMap[templateName].url, templateName, templateBranch: templateIndexMap[templateName].branch });
        });
    });
}

/**
 * Ask user's deployment type, create new skill project using the template provided by custom repository url
 * @param {String} templateUrl url string for the custom template
 * @param {Boolean} doDebug ASK CLI debug mode
 * @param {Function} callback (error, userInput{ skillName, projectFolderPath })
 */
function _newWithCustomTemplate(templateUrl, doDebug, callback) {
    if (urlUtils.isValidUrl(templateUrl)) {
        _confirmDownloadIfNotOfficialTemplate(templateUrl, (confirmErr, confirmResult) => {
            if (confirmErr) {
                return callback(confirmErr);
            }
            if (!confirmResult) {
                return callback();
            }
            callback(null, { templateUrl, templateName: null });
        });
    } else {
        process.nextTick(() => {
            callback(`The provided template url ${templateUrl} is not a valid url.`);
        });
    }
}

function _retrieveTemplateIndexMap(templateIndexUrl, doDebug, callback) {
    // Hard coding it to a static response for now
    callback(null, {
        'Hello world': {
            url: 'https://github.com/alexa/skill-sample-nodejs-hello-world.git',
            description: 'Alexa\'s hello world skill to send the greetings to the world!'
        },
        'Fact skill': {
            url: 'https://github.com/alexa/skill-sample-nodejs-fact.git',
            description: 'Quick sample skill to manage a collection of voice data.'
        },
        'Empty (Beta)': {
            url: 'https://ask-acdl-private-beta-at-131402019841:iEQIGuVR9iIVtRMsmB6B7IO5dHKb2+vr8RyCT3hRDcA=@'
                    + 'git-codecommit.us-west-2.amazonaws.com/v1/repos/empty_acdl_template',
            description: 'Quick sample empty skill using Alexa Conversations ACDL.',
            branch: 'master'
        },
        'Weather Bot (Beta)': {
            url: 'https://ask-acdl-private-beta-at-131402019841:iEQIGuVR9iIVtRMsmB6B7IO5dHKb2+vr8RyCT3hRDcA=@'
                    + 'git-codecommit.us-west-2.amazonaws.com/v1/repos/weather_bot',
            description: 'Quick sample weather bot skill using Alexa Conversations ACDL.',
            branch: 'master'
        },
        'Pizza Bot (Beta)': {
            url: 'https://ask-acdl-private-beta-at-131402019841:iEQIGuVR9iIVtRMsmB6B7IO5dHKb2+vr8RyCT3hRDcA=@'
                    + 'git-codecommit.us-west-2.amazonaws.com/v1/repos/pizza_bot',
            description: 'Quick sample pizza bot skill using Alexa Conversations ACDL.',
            branch: 'master'
        }
    });

    // const params = {
    //     url: templateIndexUrl,
    //     method: CONSTANTS.HTTP_REQUEST.VERB.GET
    // };
    // httpClient.request(params, 'getTemplatesMap', doDebug, (error, response) => {
    //     if (error || !response.statusCode || response.statusCode !== 200) {
    //         return callback('Failed to retrieve the template list. Please run again with --debug to check more details.');
    //     }
    //     let templateIndexMap = response.body;
    //     if (typeof response.body === 'string') {
    //         templateIndexMap = JSON.parse(response.body);
    //     }
    //     callback(null, templateIndexMap);
    // });
}

function _confirmDownloadIfNotOfficialTemplate(templateUrl, callback) {
    if (urlUtils.isUrlOfficialTemplate(templateUrl)) {
        return process.nextTick(() => {
            callback(null, true);
        });
    }
    Messenger.getInstance().warn(`CLI is about to download the skill template from unofficial template ${templateUrl}. \
Please make sure you understand the source code to best protect yourself from malicious usage.`);
    ui.confirmUsingUnofficialTemplate((confirmErr, confirmResult) => {
        callback(confirmErr, confirmErr ? null : confirmResult);
    });
}
