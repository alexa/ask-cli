const fs = require('fs-extra');
const R = require('ramda');
const path = require('path');

const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const ResourcesConfig = require('@src/model/resources-config');
const CONSTANTS = require('@src/utils/constants');

module.exports = {
    createV2ProjectSkeleton,
    downloadSkillPackage,
    handleExistingLambdaCode
};

/**
 * To create v2 project structure for an Alexa hosted skill project
 * @param {String} rootPath the root path
 * @param {String} skillId the skill id
 * @param {String} profile the profile
 */
function createV2ProjectSkeleton(rootPath, skillId, profile) {
    // prepare skill package folder
    const skillPackagePath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE);
    fs.ensureDirSync(skillPackagePath);
    // prepare skill code folder
    const skillCodePath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA);
    fs.ensureDirSync(skillCodePath);
    // prepare ask-resources config
    const askResourcesJson = R.clone(ResourcesConfig.BASE);
    askResourcesJson.profiles[profile] = {
        skillId
    };
    const askResourcesFilePath = path.join(rootPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG);
    fs.writeJSONSync(askResourcesFilePath, askResourcesJson, { spaces: CONSTANTS.CONFIGURATION.JSON_DISPLAY_INDENT });
}

/**
 * To download skill project for an Alexa hosted skill project
 * @param {String} rootPath the root path
 * @param {String} skillId the skill id
 * @param {String} skillStage the skill stage
 * @param {String} profile the profile
 * @param {Boolean} doDebug the debug flag
 * @param {callback} callback { err }
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
    const deployState = {
        repository: {
            type: 'GIT',
            url: gitRepoUrl
        }
    };
    ResourcesConfig.getInstance().setSkillInfraDeployState(profile, deployState);
    // 3. copy code from v1 project to v2
    const v1CodePath = path.join(legacyFolderPath, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA);
    const v2CodePath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA);
    fs.copySync(v1CodePath, v2CodePath);
    ResourcesConfig.getInstance().write();
}
