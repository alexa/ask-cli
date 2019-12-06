const R = require('ramda');
const path = require('path');
const fs = require('fs-extra');

const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const ResourcesConfig = require('@src/model/resources-config');
const Messenger = require('@src/view/messenger');
const urlUtils = require('@src/utils/url-utils');
const awsUtil = require('@src/clients/aws-client/aws-util');
const hashUtils = require('@src/utils/hash-utils');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');

const ui = require('./ui');

module.exports = {
    extractUpgradeInformation,
    previewUpgrade,
    moveOldProjectToLegacyFolder,
    createV2ProjectSkeleton,
    downloadSkillPackage,
    handleExistingLambdaCode
};

/**
 *
 * @param {String} v1RootPath
 * @param {String} profile
 * @returns upgradeInfo { skillId, lambdaResources }
 *          upgradeInfo.lambdaResources { $alexaRegion: { arn, codeUri, v2CodeUri, runtime, handler, revisionId } }
 * @throws validationError
 */
function extractUpgradeInformation(v1RootPath, profile) {
    // 1.check v1 .ask/config exists
    const hiddenConfigPath = path.join(v1RootPath, '.ask', 'config');
    if (!fs.existsSync(hiddenConfigPath)) {
        throw 'Failed to find ask-cli v1 project. Please make sure this command is called at the root of the skill project.';
    }
    const hiddenConfig = fs.readJsonSync(hiddenConfigPath, 'utf-8');
    const v1ProjData = {
        skillId: R.view(R.lensPath(['deploy_settings', profile, 'skill_id']), hiddenConfig),
        isHosted: R.view(R.lensPath(['deploy_settings', profile, 'alexaHosted', 'isAlexaHostedSkill']), hiddenConfig) || false,
        lambdaList: R.view(R.lensPath(['deploy_settings', profile, 'resources', 'lambda']), hiddenConfig) || []
    };
    // 2.check if skillId exists
    if (!stringUtils.isNonBlankString(v1ProjData.skillId)) {
        throw `Failed to find skill_id for profile [${profile}]. If the skill has never been deployed in v1 ask-cli, please start from v2 structure.`;
    }
    // 3.exclude hosted-skill case for now
    if (v1ProjData.isHosted) {
        throw 'Alexa Hosted Skill is currently not supported to upgrade.';
    }
    // 4.resolve Lambda codebase for each region
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
            const v2CodeUri = `.${path.sep}${CONSTANTS.FILE_PATH.SKILL_CODE.CODE}${path.sep}${stringUtils.filterNonAlphanumeric(codeUri)}`;
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
        throw 'Please make sure your alexaUsage is not empty.';
    }
    if (!stringUtils.isNonBlankString(codeUri)) {
        throw 'Please make sure your codeUri is set to the path of your Lambda code.';
    }
    if (!stringUtils.isNonBlankString(runtime)) {
        throw `Please make sure your runtime for codeUri ${codeUri} is set.`;
    }
    if (!stringUtils.isNonBlankString(handler)) {
        throw `Please make sure your handler for codeUri ${codeUri} is set.`;
    }
    return lambdaResource;
}

function previewUpgrade(upgradeInfo, callback) {
    ui.displayPreview(upgradeInfo);
    ui.confirmPreview((confirmErr, previewConfirm) => {
        callback(confirmErr, confirmErr ? null : previewConfirm);
    });
}

function moveOldProjectToLegacyFolder(v1RootPath) {
    const oldFiles = fs.readdirSync(v1RootPath);
    const legacyPath = path.join(v1RootPath, CONSTANTS.FILE_PATH.LEGACY_PATH);
    fs.ensureDirSync(legacyPath);
    oldFiles.forEach((file) => {
        const filePathInLegacy = path.join(legacyPath, file);
        fs.moveSync(file, filePathInLegacy);
    });
}

function createV2ProjectSkeleton(rootPath, skillId, profile) {
    // prepare skill packaage folder
    const skillPackagePath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE);
    fs.ensureDirSync(skillPackagePath);
    // preprare skill code folder
    const skillCodePath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_CODE.CODE);
    fs.ensureDirSync(skillCodePath);
    // prepare ask-resources config
    const askResourcesJson = R.clone(ResourcesConfig.BASE);
    askResourcesJson.profiles[profile] = {
        skillId,
        skillMetadata: {},
        code: {}
    };
    const askResourcesFilePath = path.join(rootPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG);
    fs.writeJSONSync(askResourcesFilePath, askResourcesJson, { spaces: CONSTANTS.CONFIGURATION.JSON_DISPLAY_INDENT });
}

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

function handleExistingLambdaCode(rootPath, lambdaResourcesMap, profile) {
    // 1.update skill infra type
    ResourcesConfig.getInstance().setSkillInfraType(profile, '@ask-cli/lambda-deployer');
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
        const regionalCode = { src: path.relative(rootPath, v2CodePath) };
        ResourcesConfig.getInstance().setCodeByRegion(profile, region, regionalCode);
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
