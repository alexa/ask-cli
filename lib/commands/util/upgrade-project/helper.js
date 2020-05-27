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
    loadV1ProjConfig,
    extractUpgradeInformation,
    previewUpgrade,
    moveOldProjectToLegacyFolder,
    createV2ProjectSkeletonAndLoadModel,
    downloadSkillPackage,
    handleExistingLambdaCode,
    attemptUpgradeUndeployedProject
};

function loadV1ProjConfig(v1RootPath, profile) {
    const hiddenConfigPath = path.join(v1RootPath, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, 'config');
    if (!fs.existsSync(hiddenConfigPath)) {
        throw new CliError('Failed to find ask-cli v1 project. Please make sure this command is called at the root of the skill project.');
    }
    const v1Config = fs.readJSONSync(hiddenConfigPath, 'utf-8');
    if (!R.hasPath(['deploy_settings', profile], v1Config)) {
        throw new CliError(`Profile [${profile}] is not configured in the v1 ask-cli's project. \
Please check ".ask/config" file and run again with the existing profile.`);
    }
    const isDeployed = stringUtils.isNonBlankString(R.view(R.lensPath(['deploy_settings', profile, 'skill_id']), v1Config)) || false;
    return { v1Config, isDeployed };
}

/**
 * To extract upgrade information from v1 project
 * @param {String} v1Config the v1 project config
 * @param {String} profile the profile
 * @returns upgradeInfo { skillId, isHosted, gitRepoUrl, lambdaResources }
 *          upgradeInfo.lambdaResources { $alexaRegion: { arn, codeUri, v2CodeUri, runtime, handler, revisionId } }
 * @throws validationError
 */
function extractUpgradeInformation(v1Config, profile) {
    // 1.check v1 .ask/config exists
    const v1ProjData = {
        skillId: R.view(R.lensPath(['deploy_settings', profile, 'skill_id']), v1Config),
        isHosted: R.view(R.lensPath(['alexaHosted', 'isAlexaHostedSkill']), v1Config) || false,
        lambdaList: R.view(R.lensPath(['deploy_settings', profile, 'resources', 'lambda']), v1Config) || []
    };
    // 2.check if skillId exists
    if (!stringUtils.isNonBlankString(v1ProjData.skillId)) {
        throw new CliError(`Failed to find skill_id for profile [${profile}]. \
If the skill has never been deployed in v1 ask-cli, please start from v2 structure.`);
    }
    if (v1ProjData.isHosted) {
        // 3. check git credentials
        const hostInfo = R.view(R.lensPath(['alexaHosted', 'gitCredentialsCache']), v1Config);
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
            return callback(`Failed to retrieve the skill-package for skillId: ${skillId}.\n${packageErr}`);
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

function attemptUpgradeUndeployedProject(v1RootPath, v1Config, profile) {
    const skillJsonPath = path.join(v1RootPath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST);
    if (!fs.existsSync(skillJsonPath)) {
        throw new CliError('Unable to upgrade the project. skill.json file must exist.');
    }
    // 1.extract codebase path and runtime
    let skillJson = fs.readJSONSync(skillJsonPath, 'utf-8');
    if (skillJson.skillManifest) {
        // some templates still use "skillManifest" which is the v0 manifest structure
        skillJson.manifest = R.clone(skillJson.skillManifest);
        skillJson = R.omit(['skillManifest'], skillJson);
    }
    const apisCustom = R.view(R.lensPath(['manifest', 'apis', 'custom']), skillJson);
    const lambdaResources = R.view(R.lensPath(['deploy_settings', profile, 'resources', 'lambda']), v1Config);
    const askResourcesJson = _decideAskResourcesJson(apisCustom, lambdaResources, profile);
    // 2.re-arrange the project structure
    fs.removeSync(path.join(v1RootPath, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER));
    fs.removeSync(path.join(v1RootPath, 'hooks'));
    fs.writeJSONSync(path.join(v1RootPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG), askResourcesJson);
    // upgrade to skill package format: skill, iModel, isps
    const skillPackagePath = path.join(v1RootPath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE);
    fs.mkdirpSync(skillPackagePath);
    skillJson.manifest.apis.custom = R.omit(['endpoint'], skillJson.manifest.apis.custom);
    fs.writeJSONSync(path.join(skillPackagePath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST), skillJson);
    fs.removeSync(skillJsonPath);
    const modelsPath = path.join(v1RootPath, 'models');
    if (fs.existsSync(modelsPath)) {
        fs.moveSync(modelsPath, path.join(skillPackagePath, 'interactionModels', 'custom'));
    }
    const ispsPath = path.join(v1RootPath, 'isps');
    if (fs.existsSync(ispsPath)) {
        fs.moveSync(ispsPath, path.join(skillPackagePath, 'isps'));
    }
}

function _decideAskResourcesJson(apisCustom, lambdaResources, profile) {
    if (!apisCustom || !apisCustom.endpoint) {
        throw new CliError('Invalid v1 project without "apis.custom.endpoint" field set in skill.json.');
    }
    // decide runtime and handler
    let runtime = 'nodejs10.x';
    let handler = 'index.handler';
    if (lambdaResources) {
        for (const lambda of lambdaResources) {
            if (lambda.alexaUsage && lambda.alexaUsage.includes('custom/default')) {
                runtime = lambda.runtime;
                handler = lambda.handler;
                break;
            }
        }
    }
    // form askResources json object
    const askResources = R.clone(AskResources.BASE);
    askResources.profiles[profile] = {
        skillMetadata: {
            src: `./${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE}`
        },
        code: {
            default: {
                src: apisCustom.endpoint.sourceDir
            }
        },
        skillInfrastructure: {
            type: CONSTANTS.DEPLOYER_TYPE.LAMBDA.NAME,
            userConfig: {
                awsRegion: awsUtil.getCLICompatibleDefaultRegion(awsUtil.getAWSProfile(profile)),
                runtime,
                handler
            }
        }
    };
    return askResources;
}
