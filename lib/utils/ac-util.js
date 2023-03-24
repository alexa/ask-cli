const fs = require("fs");
const path = require("path");
const {COMPILER} = require("./constants");
const ResourcesConfig = require("../model/resources-config");
const Manifest = require("../model/manifest");
const jsonView = require("../view/json-view");

module.exports = {
  isAcSkill,
  syncManifest,
};

/**
 * determine whether the skill is AC skill by check if skill-package/conversations exist
 * @param {String} skillPackagePath the path of skill-package
 * @returns boolean
 */
function isAcSkill(profile) {
  const skillPackageSrc = ResourcesConfig.getInstance().getSkillMetaSrc(profile);
  const conversationPath = path.join(skillPackageSrc, COMPILER.ACDL_PATH);
  if (fs.existsSync(conversationPath)) {
    return true;
  }
  return false;
}

/**
 * update build/skill-package/skill.json based on skill.json in src
 */
function syncManifest(manifestPath) {
  const {content} = Manifest.getInstance();
  fs.writeFileSync(manifestPath, jsonView.toString(content), "utf-8");
}
