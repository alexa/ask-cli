const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const SkillCodeController = require('@src/controllers/skill-code-controller');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const profileHelper = require('@src/utils/profile-helper');
const Messenger = require('@src/view/messenger');

module.exports = {
    deploySkillMetadata,
    buildSkillCode,
    deploySkillInfrastructure,
    enableSkill
};

/**
 * Deploy skill metadata by calling SkillMetadataController
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {*} callback (error)
 */
function deploySkillMetadata(options, callback) {
    let vendorId, skillMetaController;
    const { profile, doDebug, ignoreHash } = options;
    try {
        vendorId = profileHelper.resolveVendorId(profile);
        skillMetaController = new SkillMetadataController({ profile, doDebug });
    } catch (err) {
        return callback(err);
    }
    skillMetaController.deploySkillPackage(vendorId, ignoreHash, (deployErr) => {
        if (deployErr) {
            return callback(deployErr);
        }
        callback();
    });
}

/**
 * Deploy skill code by calling SkillCodeController
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {*} callback (error, uniqueCodeList)
 * @param {*} callback.uniqueCodeList [{ src, build{file, folder}}, buildFlow, regionsList }]
 */
function buildSkillCode(profile, doDebug, callback) {
    const skillCodeController = new SkillCodeController({ profile, doDebug });
    skillCodeController.buildCode((buildErr, uniqueCodeList) => {
        if (buildErr) {
            return callback(buildErr);
        }
        callback(null, uniqueCodeList);
    });
}

/**
 * Deploy skill code by calling SkillInfrastructureController
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {Boolean} ignoreHash
 * @param {*} callback (error)
 */
function deploySkillInfrastructure(profile, doDebug, ignoreHash, callback) {
    const skillInfraController = new SkillInfrastructureController({ profile, doDebug, ignoreHash });
    skillInfraController.deployInfrastructure((deployError) => {
        if (deployError) {
            return callback(deployError);
        }
        callback();
    });
}

/**
 * Funtion used to enable skill
 * @param {string} profile The profile name
 * @param {Boolean} doDebug The flag of debug or not
 * @param {Function} callback
 */
function enableSkill(profile, doDebug, callback) {
    const skillMetaController = new SkillMetadataController({ profile, doDebug });
    Messenger.getInstance().info('\n==================== Enable Skill ====================');
    try {
        skillMetaController.validateDomain();
    } catch (err) {
        return callback(err);
    }
    skillMetaController.enableSkill((error) => {
        if (error) {
            return callback(error);
        }
        callback();
    });
}
