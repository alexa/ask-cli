const R = require('ramda');
const fs = require('fs-extra');
const path = require('path');

const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const ResourcesConfig = require('@src/model/resources-config');
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
                return callback(`Please modify the existing ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG} file or choose to overwrite.`);
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
    const askResources = _assembleAskResources(userInput, profile);
    ui.showPreviewAndConfirm(rootPath, askResources, (confirmErr, isConfirmed) => {
        if (confirmErr) {
            return callback(confirmErr);
        }
        if (!isConfirmed) {
            return callback('Project init aborted.');
        }
        try {
            const askResourcesFilePath = path.join(rootPath, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG);
            fs.writeJSONSync(askResourcesFilePath, askResources, { spaces: CONSTANTS.CONFIGURATION.JSON_DISPLAY_INDENT });
        } catch (writeErr) {
            return callback(writeErr);
        }
        callback();
    });
}

function _assembleAskResources(userInput, profile) {
    const askResourcesJson = R.clone(ResourcesConfig.BASE);
    const profileResources = {
        skillId: userInput.skillId,
        skillMetadata: userInput.skillMeta,
        code: userInput.skillCode,
        skillInfrastructure: userInput.skillInfra
    };
    return R.set(R.lensPath(['profiles', profile]), profileResources, askResourcesJson);
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
    // bootstrap after deployer gets selected
    const deployerType = ResourcesConfig.getInstance().getSkillInfraType(profile);
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
