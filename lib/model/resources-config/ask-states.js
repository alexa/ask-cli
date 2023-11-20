const fs = require("fs-extra");
const path = require("path");

const CONSTANTS = require("../../utils/constants");

const ConfigFile = require("../abstract-config-file");

// instance which stores the singleton
let instance = null;

const BASE = {
  askcliStatesVersion: "2020-03-31",
  profiles: {},
};

module.exports = class AskStates extends ConfigFile {
  /**
   * Constructor for AskStates class
   * @param {string} filePath
   * @throws {Error}
   */
  constructor(filePath) {
    if (instance && instance.path === filePath) {
      return instance;
    }
    // init by calling super() if instance not exists
    super(filePath);
    this.read();
    instance = this;
  }

  static withContent(filePath, content = BASE) {
    super.withContent(filePath, content);
    new AskStates(filePath);
  }

  static getInstance() {
    return instance;
  }

  static dispose() {
    instance = null;
  }

  // getter and setter

  getSkillId(profile) {
    return this.getProperty(["profiles", profile, "skillId"]);
  }

  setSkillId(profile, skillId) {
    this.setProperty(["profiles", profile, "skillId"], skillId);
  }

  getDeploymentStatus(profile) {
    return this.getProperty(["profiles", profile, "deploymentStatus"]);
  }

  setDeploymentStatus(profile, status) {
    this.setProperty(["profiles", profile, "deploymentStatus"], status);
  }

  getLastImportId(profile) {
    return this.getProperty(["profiles", profile, "skillMetadata", "lastImportId"]);
  }

  setLastImportId(profile, lastImportId) {
    this.setProperty(["profiles", profile, "skillMetadata", "lastImportId"], lastImportId);
  }

  getLastImportTimestamp(profile) {
    return this.getProperty(["profiles", profile, "skillMetadata", "lastImportTimestamp"]);
  }

  setLastImportTimestamp(profile, dateTimeStamp) {
    this.setProperty(["profiles", profile, "skillMetadata", "lastImportTimestamp"], dateTimeStamp);
  }

  // Group for the "skillMetadata"
  getSkillMetaLastDeployHash(profile) {
    return this.getProperty(["profiles", profile, "skillMetadata", "lastDeployHash"]);
  }

  setSkillMetaLastDeployHash(profile, lastDeployHash) {
    this.setProperty(["profiles", profile, "skillMetadata", "lastDeployHash"], lastDeployHash);
  }

  /**
   * Gets the last skill deployment type or undefined if there hasn't been a
   * deployment yet.
   *
   * @param {String} profile
   * @returns "alexa-conversations" | "interaction-model" | undefined
   */
  getSkillMetaLastDeployType(profile) {
    return this.getProperty(["profiles", profile, "skillMetadata", "lastDeployType"]);
  }

  /**
   * Sets the last deploy type property in ask-states to the current
   * skill type being deployed.
   *
   * @param {String} profile - user profile name
   * @param {String} type - "alexa-conversations" | "interaction-model"
   */
  setSkillMetaLastDeployType(profile, type) {
    this.setProperty(["profiles", profile, "skillMetadata", "lastDeployType"], type);
  }

  // Group for the "code"
  getCodeLastDeployHashByRegion(profile, region) {
    return this.getProperty(["profiles", profile, "code", region, "lastDeployHash"]);
  }

  setCodeLastDeployHashByRegion(profile, region, hash) {
    this.setProperty(["profiles", profile, "code", region, "lastDeployHash"], hash);
  }

  getCodeLastDeployTimestamp(profile) {
    return this.getProperty(["profiles", profile, "code", "lastDeployTimestamp"]);
  }

  setCodeLastDeployTimestamp(profile, dateTimestamp) {
    this.setProperty(["profiles", profile, "code", "lastDeployTimestamp"], dateTimestamp);
  }

  getCodeBuildByRegion(projRoot, codeSrc) {
    if (!codeSrc) {
      return null;
    }
    /**
     * Resolve the base path for build folder:
     *   if src is a folder, direct add build folder inside of it;
     *   if src is a file, use the path to the folder it's located as base folder.
     */
    const base = path.resolve(fs.statSync(codeSrc).isDirectory() ? codeSrc : codeSrc.replace(path.basename(codeSrc), ""));
    const mirrorPath = path.relative(projRoot, base);
    return {
      folder: path.join(projRoot, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, mirrorPath),
      file: path.join(projRoot, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, mirrorPath, "build.zip"),
    };
  }

  // Group for the "skillInfrastructure"
  getSkillInfraDeployState(profile, infraType) {
    return this.getProperty(["profiles", profile, "skillInfrastructure", infraType, "deployState"]);
  }

  setSkillInfraDeployState(profile, infraType, deployState) {
    this.setProperty(["profiles", profile, "skillInfrastructure", infraType, "deployState"], deployState);
  }
};

module.exports.BASE = BASE;
