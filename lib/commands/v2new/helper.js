const path = require('path');
const fs = require('fs-extra');

const gitClient = require('@src/clients/git-client');
const httpClient = require('@src/clients/http-client');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const DeployDelegate = require('@src/controllers/skill-infrastructure-controller/deploy-delegate');
const Messenger = require('@src/view/messenger');
const urlUtils = require('@src/utils/url-utils');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');
const ui = require('./ui');

module.exports = {
    loadSkillProjectModel,
    updateSkillProjectWithUserSettings,
    bootstrapProject,
    newWithOfficialTemplate,
    newWithCustomTemplate,
    downloadTemplateFromGit
};

/**
 * Validate if ask-resources config and skill.json exist in the skill pacakge template
 * @param {String} projectPath path for the skill project
 * @param {String} profile ask-cli profile
 */
function loadSkillProjectModel(projectPath, profile) {
    try {
        new ResourcesConfig(path.join(projectPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
    } catch (resourceConfigErr) {
        throw resourceConfigErr;
    }

    const skillMetaSrc = ResourcesConfig.getInstance().getSkillMetaSrc(profile);
    if (!stringUtils.isNonBlankString(skillMetaSrc)) {
        throw new Error('[Error]: Invalid skill project structure. Please set the "src" field in skillMetada resource.');
    }
    const skillPackageSrc = path.isAbsolute(skillMetaSrc) ? skillMetaSrc : path.join(projectPath, skillMetaSrc);
    if (!fs.existsSync(skillPackageSrc)) {
        throw new Error(`[Error]: Invalid skill package src. Attempt to get the skill package but doesn't exist: ${skillPackageSrc}.`);
    }
    const manifestPath = path.join(skillPackageSrc, 'skill.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`[Error]: Invalid skill project structure. Please make sure skill.json exists in ${skillPackageSrc}.`);
    }
    new Manifest(manifestPath);
}

/**
 * Filter the downloaded skill project by
 * 1.Remov the .git folder to avoid obfuscated git history
 * 2.Update skill name in the skill.json
 * @param {String} skillName
 * @param {String} projectPath
 * @param {String} profile
 */
function updateSkillProjectWithUserSettings(skillName, projectPath, profile) {
    // update skill name
    Manifest.getInstance().setSkillName(skillName);
    // update ask-resources config with profile name
    const defaultProfileObject = ResourcesConfig.getInstance().getProfile('default');
    ResourcesConfig.getInstance().setProfile('default', undefined);
    ResourcesConfig.getInstance().setProfile(profile, defaultProfileObject);
    // remove .git folder
    const hiddenGitFolder = path.join(projectPath, '.git');
    fs.removeSync(hiddenGitFolder);
}

/**
 * Ask users' choices for deploy delegate, and then trigger the bootstrap process from the deploy delegate
 * @param {String} infrastructurePath the root path for current deploy delegate's files in skill's project
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {Function} callback (error)
 */
function bootstrapProject(infrastructurePath, profile, doDebug, callback) {
    // 1.Ask user for the type of deploy delegate
    ui.getDeployDelegateType(DeployDelegate.builtin, (getDDErr, deployDelegateType) => {
        if (getDDErr) {
            return callback(getDDErr);
        }
        if (deployDelegateType === ui.SKIP_DEPLOY_DELEGATE_SELECTION) {
            return callback();
        }
        // 2.Initiate ask-resources config for skillInfrastructure field
        const ddFolderPath = deployDelegateType.startsWith('@ask-cli/') ? deployDelegateType.replace('@ask-cli/', '') : deployDelegateType;
        const workspacePath = path.join(infrastructurePath, stringUtils.filterNonAlphanumeric(ddFolderPath));
        fs.ensureDirSync(workspacePath);
        ResourcesConfig.getInstance().setSkillInfra(profile, {
            type: deployDelegateType,
            userConfig: ResourcesConfig.getInstance().getSkillInfraUserConfig(profile),
            deployState: {}
        });
        // 3.Bootstrap skill project with deploy delegate logic
        const skillInfraController = new SkillInfrastructureController({ profile, doDebug });
        skillInfraController.bootstrapInfrastructures(workspacePath, (bootstrapErr) => {
            if (bootstrapErr) {
                return callback(bootstrapErr);
            }
            callback();
        });
    });
}

/**
 * Create new skill templates by downloading from official provisions
 * @param {Boolean} doDebug
 * @param {Function} callback (error, userInput{ skillName, projectFolderPath })
 */
function newWithOfficialTemplate(doDebug, callback) {
    ui.selectSkillCodeLanguage((languageErr, language) => {
        if (languageErr) {
            return callback(languageErr);
        }
        const templateIndexUrl = CONSTANTS.TEMPLATES.LANGUAGE_MAP[language].TEMPLATE_INDEX;
        _retrieveTemplateIndexMap(templateIndexUrl, doDebug, (httpErr, templateIndexMap) => {
            if (httpErr) {
                return callback(httpErr);
            }
            ui.getTargetTemplateName(templateIndexMap, (templateNameErr, templateName) => {
                if (templateNameErr) {
                    return callback(templateNameErr);
                }
                const templateUrl = templateIndexMap[templateName].url;
                module.exports.downloadTemplateFromGit(templateName, templateUrl, (downloadErr, userInput) => {
                    if (downloadErr) {
                        return callback(downloadErr);
                    }
                    callback(null, userInput);
                });
            });
        });
    });
}

/**
 * Create new skill project using the template provided by custom repository url
 * @param {String} templateUrl url string for the custom template
 * @param {Boolean} doDebug
 * @param {Function} callback (error, userInput{ skillName, projectFolderPath })
 */
function newWithCustomTemplate(templateUrl, doDebug, callback) {
    if (urlUtils.isUrlWithGitExtension(templateUrl)) {
        _confirmDownloadIfNotOfficialTemplate(templateUrl, (confirmErr, confirmResult) => {
            if (confirmErr) {
                return callback(confirmErr);
            }
            if (!confirmResult) {
                return callback();
            }
            module.exports.downloadTemplateFromGit(null, templateUrl, (gitErr, userInput) => {
                if (gitErr) {
                    return callback(gitErr);
                }
                callback(null, userInput);
            });
        });
    } else {
        process.nextTick(() => {
            callback(`[Error]: The provided template url ${templateUrl} is not a supported type. \
We currently only support ".git" url for user's custom template.`);
        });
    }
}

/**
 * Common method to download the template from git
 * @param {String} templateName name of the template if it's offical repository
 * @param {String} templateUrl url for the template to download from
 * @param {Function} callback (error, userInput{ skillName, projectFolderPath })
 */
function downloadTemplateFromGit(templateName, templateUrl, callback) {
    ui.getSkillName(templateUrl, (getSkillNameErr, skillName) => {
        if (getSkillNameErr) {
            return callback(getSkillNameErr);
        }
        const suggestedProjectName = stringUtils.filterNonAlphanumeric(templateName) || stringUtils.filterNonAlphanumeric(skillName);
        ui.getProjectFolderName(suggestedProjectName, (getFolderNameErr, folderName) => {
            if (getFolderNameErr) {
                return callback(getFolderNameErr);
            }
            const projectFolderPath = path.join(process.cwd(), folderName);
            gitClient.clone(templateUrl, CONSTANTS.TEMPLATES.TEMPLATE_BRANCH_NAME, projectFolderPath, (cloneErr) => {
                if (cloneErr) {
                    return callback(cloneErr);
                }
                callback(null, { skillName, projectFolderPath });
            });
        });
    });
}

function _retrieveTemplateIndexMap(templateIndexUrl, doDebug, callback) {
    const params = {
        url: templateIndexUrl,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET
    };
    httpClient.request(params, 'getTemplatesMap', doDebug, (error, response) => {
        if (error || !response.statusCode || response.statusCode !== 200) {
            return callback('[Error]: Failed to retrieve the template list. Please run again with --debug to check more details.');
        }
        let templateIndexMap = response.body;
        if (typeof response.body === 'string') {
            templateIndexMap = JSON.parse(response.body);
        }
        callback(null, templateIndexMap);
    });
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
