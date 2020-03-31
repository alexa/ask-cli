const fs = require('fs-extra');
const path = require('path');
const R = require('ramda');

const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const awsUtil = require('@src/clients/aws-client/aws-util');
const CliError = require('@src/exceptions/cli-error');
const ResourcesConfig = require('@src/model/resources-config');
const AskResources = require('@src/model/resources-config/ask-resources');
const AskStates = require('@src/model/resources-config/ask-states');
const Messenger = require('@src/view/messenger');
const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');
const hashUtils = require('@src/utils/hash-utils');
const urlUtils = require('@src/utils/url-utils');

const ui = require('./ui');

module.exports = {
    extractUpgradeInformation,
    previewUpgrade,
    moveOldProjectToLegacyFolder,
    createV2ProjectSkeletonAndLoadModel,
    downloadSkillPackage,
    handleExistingLambdaCode
};

/**
 * To extract upgrade information from v1 project
 * @param {String} v1RootPath the v1 file path
 * @param {String} profile the profile
 * @returns upgradeInfo { skillId, isHosted, gitRepoUrl, lambdaResources }
 *          upgradeInfo.lambdaResources { $alexaRegion: { arn, codeUri, v2CodeUri, runtime, handler, revisionId } }
 * @throws validationError
 */
function extractUpgradeInformation(v1RootPath, profile) {
    // 1.check v1 .ask/config exists
    const hiddenConfigPath = path.join(v1RootPath, '.ask', 'config');
    if (!fs.existsSync(hiddenConfigPath)) {
        throw new CliError('Failed to find ask-cli v1 project. Please make sure this command is called at the root of the skill project.');
    }
    const hiddenConfig = fs.readJsonSync(hiddenConfigPath, 'utf-8');
    const v1ProjData = {
        skillId: R.view(R.lensPath(['deploy_settings', profile, 'skill_id']), hiddenConfig),
        isHosted: R.view(R.lensPath(['alexaHosted', 'isAlexaHostedSkill']), hiddenConfig) || false,
        lambdaList: R.view(R.lensPath(['deploy_settings', profile, 'resources', 'lambda']), hiddenConfig) || []
    };
    // 2.check if skillId exists
    if (!stringUtils.isNonBlankString(v1ProjData.skillId)) {
        throw new CliError(`Failed to find skill_id for profile [${profile}]. \
If the skill has never been deployed in v1 ask-cli, please start from v2 structure.`);
    }
    if (v1ProjData.isHosted) {
        // 3. check git credentials
        const hostInfo = R.view(R.lensPath(['alexaHosted', 'gitCredentialsCache']), hiddenConfig);
        if (!hostInfo) {
            throw new CliError('Failed to find gitCredentialsCache for an Alexa hosted skill.');
        }
        return {
            skillId: v1ProjData.skillId,
            isHosted: v1ProjData.isHosted,
            gitRepoUrl: `${hostInfo.protocol}://${hostInfo.host}/${hostInfo.path}`
        };
    }

    // 3.resolve Lambda codebase for each region
    const lambdaMapByRegion = {};
    for (const lambdaResource of v1ProjData.lambdaList) {
        _collectLambdaMapFromResource(lambdaMapByRegion, lambdaResource);
    }
    return {
        skillId: v1ProjData.skillId,
        lambdaResources: lambdaMapByRegion
    };
}

function _collectLambdaMapFromResource(lambdaMapByRegion, lambdaResource) {
    const { alexaUsage, arn, codeUri, runtime, handler, revisionId } = _validateLambdaResource(lambdaResource);
    if (!urlUtils.isLambdaArn(arn)) {
        Messenger.getInstance().warn(`Skip Lambda resource with alexaUsage "${lambdaResource.alexaUsage}" since this Lambda is not deployed.`);
        return;
    }
    for (let index = 0; index < alexaUsage.length; index++) {
        const region = alexaUsage[index].split('/')[1];
        // make sure there aren't multiple codebases for a single region
        if (lambdaMapByRegion[region]) {
            if (lambdaMapByRegion[region].codeUri !== codeUri) {
                Messenger.getInstance().warn(`Currently ask-cli requires one Lambda codebase per region. \
You have multiple Lambda codebases for region ${region}, we will use "${lambdaMapByRegion[region].codeUri}" as the codebase for this region.`);
            }
        } else {
            // set Lambda info for each alexaRegion and only re-use the Lambda ARN for the first alexaRegion (let the rest create their own Lambda)
            const v2CodeUri = `.${path.sep}${CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA}${path.sep}${stringUtils.filterNonAlphanumeric(codeUri)}`;
            lambdaMapByRegion[region] = {
                arn: index === 0 ? arn : undefined,
                codeUri,
                v2CodeUri,
                runtime: index === 0 ? runtime : undefined,
                handler: index === 0 ? handler : undefined,
                revisionId: index === 0 ? revisionId : undefined,
            };
        }
    }
}

function _validateLambdaResource(lambdaResource) {
    const { alexaUsage, codeUri, runtime, handler } = lambdaResource;
    if (!alexaUsage || alexaUsage.length === 0) {
        throw new CliError('Please make sure your alexaUsage is not empty.');
    }
    if (!stringUtils.isNonBlankString(codeUri)) {
        throw new CliError('Please make sure your codeUri is set to the path of your Lambda code.');
    }
    if (!stringUtils.isNonBlankString(runtime)) {
        throw new CliError(`Please make sure your runtime for codeUri ${codeUri} is set.`);
    }
    if (!stringUtils.isNonBlankString(handler)) {
        throw new CliError(`Please make sure your handler for codeUri ${codeUri} is set.`);
    }
    return lambdaResource;
}

/**
 * To confirm users with the upgrade changes
 * @param {Object} upgradeInfo the upgrade info { skillId, isHosted,lambdaResources }
 * @param {callback} callback { err, previewConfirm }
 */
function previewUpgrade(upgradeInfo, callback) {
    ui.displayPreview(upgradeInfo);
    ui.confirmPreview((confirmErr, previewConfirm) => {
        callback(confirmErr, confirmErr ? null : previewConfirm);
    });
}

/**
 * To move v1 project to legacy folder
 * @param {string} v1RootPath the v1 root path
 */
function moveOldProjectToLegacyFolder(v1RootPath) {
    const oldFiles = fs.readdirSync(v1RootPath);
    const legacyPath = path.join(v1RootPath, CONSTANTS.FILE_PATH.LEGACY_PATH);
    fs.ensureDirSync(legacyPath);
    oldFiles.forEach((file) => {
        if (file.startsWith('.') && file !== '.ask') {
            return;
        }
        const filePathInLegacy = path.join(legacyPath, file);
        fs.moveSync(file, filePathInLegacy);
    });
}

/**
 * To create v2 project structure
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
    askResources.profiles[profile] = {
        skillMetadata: {},
        code: {}
    };
    const askStates = R.clone(AskStates.BASE);
    askStates.profiles[profile] = {
        skillId,
        skillMetadata: {},
        code: {}
    };
    AskResources.withContent(askResourcesFilePath, askResources);
    AskStates.withContent(askStatesFilePath, askStates);
    new ResourcesConfig(askResourcesFilePath);
}

/**
 * To download skill project
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
        hashUtils.getHash(CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE, (hashErr, currentHash) => {
            if (hashErr) {
                return callback(hashErr);
            }
            ResourcesConfig.getInstance().setSkillMetaSrc(profile, './skill-package');
            ResourcesConfig.getInstance().setSkillMetaLastDeployHash(profile, currentHash);
            ResourcesConfig.getInstance().write();
            callback();
        });
    });
}

/**
 * To handle existing lambda code and update ask-resources.js
 * @param {String} rootPath the root path
 * @param {Object} lambdaResourcesMap the lambda code resources from old project
 *                 lambdaResourcesMap { $alexaRegion: { arn, codeUri, handler, revisionId, runtime, v2CodeUri} }
 * @param {String} profile the profile
 */
function handleExistingLambdaCode(rootPath, lambdaResourcesMap, profile) {
    // 1.update skill infra type
    ResourcesConfig.getInstance().setSkillInfraType(profile, CONSTANTS.DEPLOYER_TYPE.LAMBDA.NAME);
    // 2.set userConfig from default region Lambda configuration
    // default will always exist as it's required in a set of valid Lambda resources from the v1 project
    let defaultRuntime, defaultHandler;
    if (lambdaResourcesMap.default) {
        const { runtime, handler } = lambdaResourcesMap.default;
        defaultRuntime = runtime;
        defaultHandler = handler;
        const awsProfile = awsUtil.getAWSProfile(profile);
        const awsDefaultRegion = awsUtil.getCLICompatibleDefaultRegion(awsProfile); // use system default Lambda regardless of Lambda ARN
        const userConfig = { runtime, handler, awsRegion: awsDefaultRegion };
        ResourcesConfig.getInstance().setSkillInfraUserConfig(profile, userConfig);
    }
    // 3.copy Lambda code from legacy folder and set deployState for each region
    const legacyFolderPath = path.join(rootPath, CONSTANTS.FILE_PATH.LEGACY_PATH);
    R.keys(lambdaResourcesMap).forEach((region) => {
        const { arn, codeUri, v2CodeUri, runtime, handler, revisionId } = lambdaResourcesMap[region];
        // 3.1 copy code from v1 project to v2
        const v1CodePath = path.join(legacyFolderPath, codeUri);
        const v2CodePath = path.join(rootPath, v2CodeUri);
        fs.copySync(v1CodePath, v2CodePath);
        // 3.2 update skill code setting
        ResourcesConfig.getInstance().setCodeSrcByRegion(profile, region, path.relative(rootPath, v2CodePath));
        // 3.3 update regional skill infrastructure deployState
        const deployState = ResourcesConfig.getInstance().getSkillInfraDeployState(profile) || {};
        deployState[region] = {
            lambda: {
                arn,
                revisionId
            }
        };
        ResourcesConfig.getInstance().setSkillInfraDeployState(profile, deployState);
        // 3.4 update skill infra userConfig with regionalOverrides excluding default region
        if (region !== 'default') {
            if (defaultRuntime !== runtime || defaultHandler !== handler) {
                const userConfig = ResourcesConfig.getInstance().getSkillInfraUserConfig(profile);
                if (!userConfig.regionalOverrides) {
                    userConfig.regionalOverrides = {};
                }
                userConfig.regionalOverrides[region] = { runtime, handler };
                ResourcesConfig.getInstance().setSkillInfraUserConfig(profile, userConfig);
            }
        }
    });
    ResourcesConfig.getInstance().write();
}
