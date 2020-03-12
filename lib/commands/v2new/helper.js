const fs = require('fs-extra');
const path = require('path');

const GitClient = require('@src/clients/git-client');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const Manifest = require('@src/model/manifest');
const ResourcesConfig = require('@src/model/resources-config');
const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');

const ui = require('./ui');

module.exports = {
    initializeDeployDelegate,
    downloadTemplateFromGit,
    loadSkillProjectModel,
    updateSkillProjectWithUserSettings,
    bootstrapProject
};

/**
 * To initialize Deploy Engine or not by selected deployment type
 * @param {String} deploymentType the deployer type
 * @param {String} infrastructurePath the root path for current deploy delegate's files in skill's project
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {callback} callback { error, ddType } return the selected deploy delegate type
 */
function initializeDeployDelegate(deploymentType, projectFolderPath, profile, doDebug, callback) {
    if (deploymentType === ui.SKIP_DEPLOY_DELEGATE_SELECTION) {
        return callback();
    }
    const infrastructurePath = path.join(projectFolderPath, CONSTANTS.FILE_PATH.SKILL_INFRASTRUCTURE.INFRASTRUCTURE);
    bootstrapProject(deploymentType, infrastructurePath, profile, doDebug, (bootstrapErr) => {
        if (bootstrapErr) {
            return callback(bootstrapErr);
        }
        const ddType = ResourcesConfig.getInstance().getSkillInfraType(profile);
        callback(null, ddType);
    });
}

/**
 * Download the template from git
 * @param {Object} userInput user input initialization setting
 * @param {Function} callback (error, projectFolderPath)
 */
function downloadTemplateFromGit(userInput, doDebug, callback) {
    const projectFolderPath = path.join(process.cwd(), userInput.projectFolderName);
    const gitClient = new GitClient(projectFolderPath, { showOutput: !!doDebug, showCommand: !!doDebug });
    gitClient.clone(userInput.templateInfo.templateUrl, CONSTANTS.TEMPLATES.TEMPLATE_BRANCH_NAME, projectFolderPath);
    callback(null, projectFolderPath);
}

/**
 * Validate if ask-resources config and skill.json exist in the skill package template
 * @param {String} projectPath path for the skill project
 * @param {String} profile ask-cli profile
 */
function loadSkillProjectModel(projectPath, profile) {
    new ResourcesConfig(path.join(projectPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));

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
 * 1.Remove the .git folder to avoid obfuscated git history
 * 2.Update skill name in the skill.json
 * @param {String} skillName the skill name
 * @param {String} projectPath the project file path
 * @param {String} profile ask-cli profile
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
 * Trigger the bootstrap process from the selected deploy delegate
 * @param {String} infrastructurePath the root path for current deploy delegate's files in skill's project
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {Function} callback (error)
 */
function bootstrapProject(deployDelegateType, infrastructurePath, profile, doDebug, callback) {
    // 1.Initiate ask-resources config for skillInfrastructure field
    const ddFolderPath = deployDelegateType.startsWith('@ask-cli/') ? deployDelegateType.replace('@ask-cli/', '') : deployDelegateType;
    const workspacePath = path.join(infrastructurePath, stringUtils.filterNonAlphanumeric(ddFolderPath));
    fs.ensureDirSync(workspacePath);
    ResourcesConfig.getInstance().setSkillInfra(profile, {
        type: deployDelegateType,
        userConfig: ResourcesConfig.getInstance().getSkillInfraUserConfig(profile),
        deployState: {}
    });
    // 2.Bootstrap skill project with deploy delegate logic
    const skillInfraController = new SkillInfrastructureController({ profile, doDebug });
    skillInfraController.bootstrapInfrastructures(workspacePath, (bootstrapErr) => {
        if (bootstrapErr) {
            return callback(bootstrapErr);
        }
        callback();
    });
}
