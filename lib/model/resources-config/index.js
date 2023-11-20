const fs = require("fs-extra");
const path = require("path");

const CONSTANTS = require("../../utils/constants");

const AskResources = require("./ask-resources");
const AskStates = require("./ask-states");

// instance which stores the singleton
let instance = null;

module.exports = class ResourcesConfig {
  constructor(askResourcesPath) {
    if (instance && instance.askResourcesPath === askResourcesPath) {
      return instance;
    }
    this.askResourcesPath = askResourcesPath;
    this.projectRootPath = path.dirname(askResourcesPath);
    this.askStatesPath = path.join(this.projectRootPath, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, CONSTANTS.FILE_PATH.ASK_STATES_JSON_CONFIG);
    this._loadModel();
    instance = this;
  }

  /**
   * When instantiating ResourcesConfig, AskResources must exist, AskStates will automatically be created.
   */
  _loadModel() {
    // instantiate ask-resources first to make sure the file does exist
    new AskResources(this.askResourcesPath);
    // ensure ask-states will exist
    if (!fs.existsSync(this.askStatesPath)) {
      AskStates.withContent(this.askStatesPath);
    } else {
      new AskStates(this.askStatesPath);
    }
  }

  static getInstance() {
    return instance;
  }

  static dispose() {
    AskResources.dispose();
    AskStates.dispose();
    instance = null;
  }

  write() {
    AskResources.getInstance().write();
    AskStates.getInstance().write();
  }

  // getter and setter

  getProfile(profile) {
    return AskResources.getInstance().getProfile(profile);
  }

  setProfile(profile, profileObj) {
    AskResources.getInstance().setProfile(profile, profileObj);
  }

  getSkillId(profile) {
    return AskStates.getInstance().getSkillId(profile);
  }

  setSkillId(profile, skillId) {
    AskStates.getInstance().setSkillId(profile, skillId);
  }

  getDeploymentStatus(profile) {
    return AskStates.getInstance().getDeploymentStatus(profile);
  }

  setDeploymentStatus(profile, status) {
    AskStates.getInstance().setDeploymentStatus(profile, status);
  }

  getLastImportId(profile) {
    return AskStates.getInstance().getLastImportId(profile);
  }

  setLastImportId(profile, importId) {
    AskStates.getInstance().setLastImportId(profile, importId);
  }

  getLastImportTimestamp(profile) {
    return AskStates.getInstance().getLastImportTimestamp(profile);
  }

  setLastImportTimestamp(profile, dateTimestamp) {
    AskStates.getInstance().setLastImportTimestamp(profile, dateTimestamp);
  }

  // Group for the "skillMetadata"
  getSkillMetaSrc(profile) {
    return AskResources.getInstance().getSkillMetaSrc(profile);
  }

  setSkillMetaSrc(profile, skillMetaSrc) {
    AskResources.getInstance().setSkillMetaSrc(profile, skillMetaSrc);
  }

  getSkillMetaLastDeployHash(profile) {
    return AskStates.getInstance().getSkillMetaLastDeployHash(profile);
  }

  setSkillMetaLastDeployHash(profile, lastDeployHash) {
    AskStates.getInstance().setSkillMetaLastDeployHash(profile, lastDeployHash);
  }

  /**
   * Gets the last skill deployment type or undefined if there hasn't been a
   * deployment yet.
   *
   * @param {String} profile
   * @returns "alexa-conversations" | "interaction-model" | undefined
   */
  getSkillMetaLastDeployType(profile) {
    return AskStates.getInstance().getSkillMetaLastDeployType(profile);
  }

  /**
   * Sets the lastDeployType property in ask-states to the current skill-type being deployed.
   *
   * @param {String} profile - user profile name
   * @param {String} type - "alexa-conversations" | "interaction-model"
   */
  setSkillMetaLastDeployType(profile, type) {
    AskStates.getInstance().setSkillMetaLastDeployType(profile, type);
  }

  // Group for the "code"
  getCodeSrcByRegion(profile, region) {
    return AskResources.getInstance().getCodeSrcByRegion(profile, region);
  }

  setCodeSrcByRegion(profile, region, src) {
    AskResources.getInstance().setCodeSrcByRegion(profile, region, src);
  }

  getCodeLastDeployHashByRegion(profile, region) {
    return AskStates.getInstance().getCodeLastDeployHashByRegion(profile, region);
  }

  setCodeLastDeployHashByRegion(profile, region, hash) {
    AskStates.getInstance().setCodeLastDeployHashByRegion(profile, region, hash);
  }

  getCodeLastDeployTimestamp(profile) {
    return AskStates.getInstance().getCodeLastDeployTimestamp(profile);
  }

  setCodeLastDeployTimestamp(profile, dateTimestamp) {
    AskStates.getInstance().setCodeLastDeployTimestamp(profile, dateTimestamp);
  }

  getCodeRegions(profile) {
    return AskResources.getInstance().getCodeRegions(profile);
  }

  getCodeBuildByRegion(profile, region) {
    const codeSrc = this.getCodeSrcByRegion(profile, region);
    return AskStates.getInstance().getCodeBuildByRegion(this.projectRootPath, codeSrc);
  }

  getTargetEndpoints(profile) {
    return AskResources.getInstance().getTargetEndpoint(profile);
  }

  getSkillEvents(profile) {
    return AskResources.getInstance().getSkillEvents(profile);
  }

  // Group for the "skillInfrastructure"
  getSkillInfraType(profile) {
    return AskResources.getInstance().getSkillInfraType(profile);
  }

  setSkillInfraType(profile, type) {
    AskResources.getInstance().setSkillInfraType(profile, type);
  }

  getSkillInfraUserConfig(profile) {
    return AskResources.getInstance().getSkillInfraUserConfig(profile);
  }

  setSkillInfraUserConfig(profile, userConfig) {
    AskResources.getInstance().setSkillInfraUserConfig(profile, userConfig);
  }

  getSkillInfraDeployState(profile) {
    const infraType = this.getSkillInfraType(profile);
    return AskStates.getInstance().getSkillInfraDeployState(profile, infraType);
  }

  setSkillInfraDeployState(profile, deployState) {
    const infraType = this.getSkillInfraType(profile);
    AskStates.getInstance().setSkillInfraDeployState(profile, infraType, deployState);
  }
};

module.exports.BASE = {
  askcliResourcesVersion: "2020-03-31",
  profiles: {},
};
