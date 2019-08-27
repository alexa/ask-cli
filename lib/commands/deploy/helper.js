const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const SkillCodeController = require('@src/controllers/skill-code-controller');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const profileHelper = require('@src/utils/profile-helper');

module.exports = {
    deploySkillMetadata,
    buildSkillCode,
    deploySkillInfrastructure
};

/**
 * Deploy skill metadata by calling SkillMetadataController
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {*} callback (error)
 */
function deploySkillMetadata(profile, doDebug, callback) {
    let vendorId, skillMetaController;
    try {
        vendorId = profileHelper.resolveVendorId(profile);
        skillMetaController = new SkillMetadataController({ profile, doDebug });
    } catch (err) {
        return callback(err);
    }
    skillMetaController.deploySkillPackage(vendorId, (deployErr) => {
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
 * @param {*} callback (error)
 */
function deploySkillInfrastructure(profile, doDebug, callback) {
    const skillInfraController = new SkillInfrastructureController({ profile, doDebug });
    skillInfraController.deployInfrastructure((deployError) => {
        if (deployError) {
            return callback(deployError);
        }
        callback();
    });
}
