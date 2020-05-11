const fs = require('fs-extra');
const path = require('path');
const R = require('ramda');

const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const CliWarn = require('@src/exceptions/cli-warn');
const AskResources = require('@src/model/resources-config/ask-resources');
const AskStates = require('@src/model/resources-config/ask-states');
const ResourcesConfig = require('@src/model/resources-config');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');
const Messenger = require('@src/view/messenger');

const ui = require('./ui');

module.exports = {
    preInitCheck,
    getSkillIdUserInput,
    getSkillMetadataUserInput,
    getSkillCodeUserInput,
    getSkillInfraUserInput,
    previewAndWriteAskResources,
    bootstrapSkillInfra
};

/**
 * The validation or preparation before collecting user config for init command
 * @param {String} rootPath path for the project root
 * @param {String} profile ask-cli profile
 * @param {Function} callback (err)
 */
function preInitCheck(rootPath, profile, callback) {
    ui.showInitInstruction(profile);
    _attemptGetAskResources(rootPath, (attemptErr) => {
        callback(attemptErr);
    });
}

function _attemptGetAskResources(rootPath, callback) {
    const askResourcesPath = path.join(rootPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG);
    if (fs.existsSync(askResourcesPath)) {
        ui.confirmOverwrite((confirmErr, isConfirmed) => {
            if (confirmErr) {
                return callback(confirmErr);
            }
            if (!isConfirmed) {
                return callback(
                    new CliWarn(`Please modify the existing ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG} file or choose to overwrite.`)
                );
            }
            callback();
        });
    } else {
        process.nextTick(() => {
            callback();
        });
    }
}

/**
 * Get user's skillId if it exists
 * @param {Function} callback (err, skillId)
 */
function getSkillIdUserInput(callback) {
    ui.getSkillId((skillIdErr, skillId) => {
        callback(skillIdErr, !skillIdErr ? skillId : null);
        // TODO: use hosted-skill controller to check if the skillId is for hosted skill
    });
}

/**
 * Get user's skillMetadata src path
 * @param {Function} callback (err, {src})
 */
function getSkillMetadataUserInput(callback) {
    ui.getSkillMetaSrc((skillMetaErr, skillMetaSrc) => {
        callback(skillMetaErr, !skillMetaErr ? { src: skillMetaSrc } : null);
    });
}

/**
 * Get user's skillCode src path
 * @param {Function} callback (err, {src})
 */
function getSkillCodeUserInput(callback) {
    ui.getCodeSrcForRegion(CONSTANTS.ALEXA.REGION.DEFAULT, (defaultRegionErr, defaultSrc) => {
        if (defaultRegionErr) {
            return callback(defaultRegionErr);
        }
        if (defaultSrc === '') {
            return callback(); // return null if user inputs empty string
        }
        const skillCode = {};
        skillCode[CONSTANTS.ALEXA.REGION.DEFAULT] = { src: defaultSrc };
        callback(null, skillCode);
    });
}

/**
 * Get user's skillInfra settings
 * @param {Function} callback (err, {type, userConfig})
 */
function getSkillInfraUserInput(callback) {
    ui.getSkillInfra((deployerErr, infraSettings) => {
        if (deployerErr) {
            return callback(deployerErr);
        }
        const skillInfra = {};
        skillInfra.type = infraSettings.isUsingCfn ? '@ask-cli/cfn-deployer' : '@ask-cli/lambda-deployer';
        skillInfra.userConfig = {
            runtime: infraSettings.runtime,
            handler: infraSettings.handler
        };
        callback(null, skillInfra);
    });
}

/**
 * Preview the ask-resources config and write to file system upon users' confirmation
 * @param {String} rootPath path for the project root
 * @param {Object} userInput data object from last step's result
 * @param {String} profile ask-cli profile
 * @param {Function} callback (err)
 */
function previewAndWriteAskResources(rootPath, userInput, profile, callback) {
    const { askResources, askStates } = _assembleAskResources(userInput, profile);
    ui.showPreviewAndConfirm(rootPath, { askResources, askStates }, (confirmErr, isConfirmed) => {
        if (confirmErr) {
            return callback(confirmErr);
        }
        if (!isConfirmed) {
            return callback(new CliWarn('Project init aborted.'));
        }
        try {
            const askResourcesFilePath = path.join(rootPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG);
            const askHiddenFolder = path.join(rootPath, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER);
            const askStatesFilePath = path.join(askHiddenFolder, CONSTANTS.FILE_PATH.ASK_STATES_JSON_CONFIG);
            fs.removeSync(askResourcesFilePath);
            AskResources.withContent(askResourcesFilePath, askResources);
            fs.removeSync(askHiddenFolder);
            AskStates.withContent(askStatesFilePath, askStates);
        } catch (writeErr) {
            return callback(writeErr);
        }
        callback();
    });
}

function _assembleAskResources(userInput, profile) {
    const askResourcesJson = R.clone(AskResources.BASE);
    const askStatesJson = R.clone(AskStates.BASE);
    const askProfileResources = { skillMetadata: userInput.skillMeta };
    const askProfileStates = { skillId: userInput.skillId };
    if (userInput.skillCode) {
        askProfileResources.code = userInput.skillCode;
    }
    if (userInput.skillInfra) {
        askProfileResources.skillInfrastructure = userInput.skillInfra;
        askProfileStates.skillInfrastructure = {
            [userInput.skillInfra.type]: {
                deployState: {}
            }
        };
    }
    return {
        askResources: R.set(R.lensPath(['profiles', profile]), askProfileResources, askResourcesJson),
        askStates: R.set(R.lensPath(['profiles', profile]), askProfileStates, askStatesJson)
    };
}

/**
 * Call deployer's bootstrap method to prepare necessary deployment utilities through skillInfraController
 * @param {String} rootPath root path for the project
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {Function} callback {err}
 */
function bootstrapSkillInfra(rootPath, profile, doDebug, callback) {
    const askResourcesFilePath = path.join(rootPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG);
    new ResourcesConfig(askResourcesFilePath);
    const deployerType = ResourcesConfig.getInstance().getSkillInfraType(profile);
    if (!stringUtils.isNonBlankString(deployerType)) {
        return process.nextTick(() => {
            callback();
        });
    }
    // bootstrap after deployer gets selected
    const ddFolderPath = deployerType.startsWith('@ask-cli/') ? deployerType.replace('@ask-cli/', '') : deployerType;
    const deployerPath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_INFRASTRUCTURE.INFRASTRUCTURE, ddFolderPath);
    fs.ensureDirSync(deployerPath);
    const skillInfraController = new SkillInfrastructureController({ profile, doDebug });
    skillInfraController.bootstrapInfrastructures(deployerPath, (bootstrapErr) => {
        if (bootstrapErr) {
            return callback(bootstrapErr);
        }
        ResourcesConfig.getInstance().write();
        Messenger.getInstance().info(`Project bootstrap from deployer "${deployerType}" succeeded.`);
        callback();
    });
}
