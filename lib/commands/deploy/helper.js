const SkillMetadataController = require("../../controllers/skill-metadata-controller");
const SkillCodeController = require("../../controllers/skill-code-controller");
const SkillInfrastructureController = require("../../controllers/skill-infrastructure-controller");
const CliError = require("../../exceptions/cli-error");
const ResourcesConfig = require("../../model/resources-config");
const profileHelper = require("../../utils/profile-helper");
const CONSTANTS = require("../../utils/constants");
const Messenger = require("../../view/messenger");
const acUtils = require("../../utils/ac-util");

module.exports = {
  confirmProfile,
  deploySkillMetadata,
  buildSkillCode,
  deploySkillInfrastructure,
  enableSkill,
  getDeploymentType,
};

function confirmProfile(profile) {
  if (!ResourcesConfig.getInstance().getProfile(profile)) {
    throw new CliError(`Profile [${profile}] does not exist. \
Please configure it in your ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG} file.`);
  }

  Messenger.getInstance().info(`Deploy project for profile [${profile}]\n`);
}

/**
 * Checks if the user's skill structure is ACDL, if so it returns alexa-conversations,
 * otherwise it returns interaction-model.
 */
function getDeploymentType(profile) {
  if (acUtils.isAcSkill(profile)) {
    return CONSTANTS.DEPLOYMENT_TYPE.ALEXA_CONVERSATIONS;
  }
  return CONSTANTS.DEPLOYMENT_TYPE.INTERACTION_MODEL;
}

/**
 * Deploy skill metadata by calling SkillMetadataController
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {*} callback (error)
 */
function deploySkillMetadata(options, callback) {
  let vendorId, skillMetaController;
  const {profile, doDebug, ignoreHash} = options;
  try {
    vendorId = profileHelper.resolveVendorId(profile);
    skillMetaController = new SkillMetadataController({profile, doDebug});
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
  const skillCodeController = new SkillCodeController({profile, doDebug});
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
  const skillInfraController = new SkillInfrastructureController({profile, doDebug, ignoreHash});
  skillInfraController.deployInfrastructure((deployError) => {
    if (deployError) {
      return callback(deployError);
    }
    callback();
  });
}

/**
 * Function used to enable skill
 * @param {string} profile The profile name
 * @param {Boolean} doDebug The flag of debug or not
 * @param {Function} callback
 */
function enableSkill(profile, doDebug, callback) {
  const skillMetaController = new SkillMetadataController({profile, doDebug});
  Messenger.getInstance().info("\n==================== Enable Skill ====================");
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

/**
 * Checks if the user's skill structure is ACDL, if so it returns alexa-conversations,
 * otherwise it returns interaction-model.
 */
function getDeploymentType(profile) {
  if (acUtils.isAcSkill(profile)) {
    return CONSTANTS.DEPLOYMENT_TYPE.ALEXA_CONVERSATIONS;
  }
  return CONSTANTS.DEPLOYMENT_TYPE.INTERACTION_MODEL;
}
