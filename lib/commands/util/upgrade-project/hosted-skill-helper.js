const fs = require('fs-extra');
const R = require('ramda');
const path = require('path');

const HostedSkillController = require('@src/controllers/hosted-skill-controller');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const CliError = require('@src/exceptions/cli-error');
const ResourcesConfig = require('@src/model/resources-config');
const AskResources = require('@src/model/resources-config/ask-resources');
const AskStates = require('@src/model/resources-config/ask-states');
const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');

module.exports = {
    checkIfDevBranchClean,
    createV2ProjectSkeletonAndLoadModel,
    downloadSkillPackage,
    handleExistingLambdaCode,
    postUpgradeGitSetup
};

/**
 * To check dev branch status is clean before upgrading
 * @param {Object} gitClient the git client
 */
function checkIfDevBranchClean(gitClient) {
    gitClient.checkoutBranch('dev');
    const statusOutput = gitClient.shortStatus();
    if (statusOutput.toString()) {
        throw new CliError(`Commit the following files in the dev branch before upgrading project:\n${statusOutput}`);
    }
    try {
        _compareCommitsWithDev(gitClient, 'origin/dev');
        _compareCommitsWithDev(gitClient, 'master');
    } catch (error) {
        throw error.message;
    }
}

function _compareCommitsWithDev(gitClient, branch) {
    const upgradeInstruction = 'Please follow the project upgrade instruction from '
    + 'https://github.com/alexa/ask-cli/blob/develop/docs/Upgrade-Project-From-V1.md#upgrade-steps '
    + 'to clean your working branch before upgrading project.';
    let diffCount = gitClient.countCommitDifference(branch, 'dev');
    diffCount = diffCount.toString().replace(/\D/g, '');
    if (stringUtils.isNonBlankString(diffCount) && diffCount !== '0') {
        throw new CliError(`Upgrade project failed. Your branch is ahead of ${branch} by ${diffCount} commit(s), ${upgradeInstruction}`);
    }
}

/**
 * To create v2 project structure for an Alexa hosted skill project
 * @param {String} rootPath the root path
 * @param {String} skillId the skill id
 * @param {String} profile the profile
 */
function createV2ProjectSkeletonAndLoadModel(rootPath, skillId, profile) {
    // prepare skill package folder
    const skillPackagePath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE);
    fs.ensureDirSync(skillPackagePath);
    // prepare skill code folder
    const skillCodePath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA);
    fs.ensureDirSync(skillCodePath);
    // prepare resources config
    const askResourcesFilePath = path.join(rootPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG);
    const askStatesFilePath = path.join(rootPath, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, CONSTANTS.FILE_PATH.ASK_STATES_JSON_CONFIG);
    const askResources = R.clone(AskResources.BASE);
    askResources.profiles[profile] = {};
    const askStates = R.clone(AskStates.BASE);
    askStates.profiles[profile] = {
        skillId
    };
    AskResources.withContent(askResourcesFilePath, askResources);
    AskStates.withContent(askStatesFilePath, askStates);
    new ResourcesConfig(askResourcesFilePath);
}

/**
 * To download skill project for an Alexa hosted skill project
 * @param {String} rootPath the root path
 * @param {String} skillId the skill id
 * @param {String} skillStage the skill stage
 * @param {String} profile the profile
 * @param {Boolean} doDebug the debug flag
 * @param {callback} callback { error }
 */
function downloadSkillPackage(rootPath, skillId, skillStage, profile, doDebug, callback) {
    const skillMetaController = new SkillMetadataController({ profile, doDebug });
    skillMetaController.getSkillPackage(rootPath, skillId, skillStage, (packageErr) => {
        if (packageErr) {
            return callback(packageErr);
        }
        callback();
    });
}

/**
 * To handle existing lambda code and update ask-resources.js for an Alexa hosted skill project
 * @param {String} rootPath the root path
 * @param {Object} lambdaResourcesMap the lambda code resources from old project { profile: { arn, codeUri, handler, revisionId, runtime, v2CodeUri} }
 * @param {String} profile the profile
 */
function handleExistingLambdaCode(rootPath, gitRepoUrl, profile) {
    // 1.update skill infra type
    ResourcesConfig.getInstance().setSkillInfraType(profile, CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME);
    // 2. set git repository url
    const legacyFolderPath = path.join(rootPath, CONSTANTS.FILE_PATH.LEGACY_PATH);
    // 3. copy code from v1 project to v2
    const v1CodePath = path.join(legacyFolderPath, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA);
    const v2CodePath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA);
    fs.copySync(v1CodePath, v2CodePath);
    ResourcesConfig.getInstance().write();
}

/**
 * To update git credential, checkout mater as default branch and set git pre-push template
 * @param {String} profile the profile
 * @param {Boolean} doDebug the debug flag
 * @param {String} gitClient the git client
 * @param {callback} callback { error }
 */
function postUpgradeGitSetup(profile, doDebug, gitClient, callback) {
    try {
        _setGitCredentialHelper(profile, gitClient);
        _setMasterAsDefault(gitClient);
        _updateGitIgnoreWithAskResourcesJson(gitClient);
    } catch (error) {
        return callback(error);
    }
    _setPrePushHookTemplate(profile, doDebug, (hooksErr) => callback(hooksErr || null));
}

function _setGitCredentialHelper(profile, gitClient) {
    const credentialHelperPath = `ask util git-credentials-helper --profile ${profile}`;
    gitClient.updateCredentialHelper(credentialHelperPath);
}

function _updateGitIgnoreWithAskResourcesJson(gitClient) {
    const fileToAdd = ['ask-resources.json', '.ask/'];
    gitClient.setupGitIgnore(fileToAdd);
}

function _setMasterAsDefault(gitClient) {
    gitClient.checkoutBranch('master');
    gitClient.merge('dev');
    gitClient.deleteBranch('dev');
}

function _setPrePushHookTemplate(profile, doDebug, callback) {
    const hostedSkillController = new HostedSkillController(profile, doDebug);
    const templateUrl = CONSTANTS.HOSTED_SKILL.GIT_HOOKS_TEMPLATES.PRE_PUSH.URL;
    const filePath = path.join('.git', 'hooks', 'pre-push');
    hostedSkillController.downloadGitHooksTemplate(templateUrl, filePath, (hooksErr) => callback(hooksErr || null));
}
