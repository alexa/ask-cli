import fs from "fs-extra";
import path from "path";
import {NewSkillDeployerType, NewSkillUserInput} from ".";
import GitClient from "../../clients/git-client";
import SkillInfrastructureController from "../../controllers/skill-infrastructure-controller";
import {uiCallback} from "../../model/callback";
import Manifest from "../../model/manifest";
import ResourcesConfig from "../../model/resources-config";
import {TEMPLATES, FILE_PATH, DEPLOYER_TYPE} from "../../utils/constants";
import stringUtils from "../../utils/string-utils";

/**
 * Download the template from git
 * @param {Object} userInput user input initialization setting
 * @param {uiCallback} callback (error, projectFolderPath)
 */
export function downloadTemplateFromGit(userInput: NewSkillUserInput, doDebug: boolean, callback: uiCallback): void {
  const projectFolderPath = path.join(process.cwd(), userInput.projectFolderName!);
  const gitClient = new GitClient(projectFolderPath, {showOutput: !!doDebug, showCommand: !!doDebug});
  const branch = userInput.templateInfo?.templateBranch || TEMPLATES.TEMPLATE_DEFAULT_BRANCH_NAME;
  gitClient.clone(userInput.templateInfo?.templateUrl!, branch, projectFolderPath);
  callback(null, projectFolderPath);
}

/**
 * Validate if ask-resources config and skill.json exist in the skill package template
 * @param {String} projectPath path for the skill project
 * @param {String} profile ask-cli profile
 */
export function loadSkillProjectModel(projectPath: string, profile: string): void {
  new ResourcesConfig(path.join(projectPath, FILE_PATH.ASK_RESOURCES_JSON_CONFIG));

  const skillMetaSrc = ResourcesConfig.getInstance().getSkillMetaSrc(profile);
  if (!stringUtils.isNonBlankString(skillMetaSrc)) {
    throw new Error('[Error]: Invalid skill project structure. Please set the "src" field in skillMetadata resource.');
  }
  const skillPackageSrc = path.isAbsolute(skillMetaSrc) ? skillMetaSrc : path.join(projectPath, skillMetaSrc);
  if (!fs.existsSync(skillPackageSrc)) {
    throw new Error(`[Error]: Invalid skill package src. Attempt to get the skill package but doesn't exist: ${skillPackageSrc}.`);
  }
  const manifestPath = path.join(skillPackageSrc, "skill.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`[Error]: Invalid skill project structure. Please make sure skill.json exists in ${skillPackageSrc}.`);
  }
  new Manifest(manifestPath);
}

/**
 * Filter the downloaded skill project by
 * 1.Remove the .git folder to avoid obfuscated git history
 * 2.Update skill name in the skill.json
 * @param {String} skillName the skill name
 * @param {String} projectPath the project file path
 * @param {String} profile ask-cli profile
 */
export function updateSkillProjectWithUserSettings(skillName: string, projectPath: string, profile: string): void {
  // update skill name
  Manifest.getInstance().setSkillName(skillName);
  // update ask-resources config with profile name
  const defaultProfileObject = ResourcesConfig.getInstance().getProfile("default");
  ResourcesConfig.getInstance().setProfile("default", undefined);
  ResourcesConfig.getInstance().setProfile(profile, defaultProfileObject);
  // remove .git folder
  const hiddenGitFolder = path.join(projectPath, ".git");
  fs.removeSync(hiddenGitFolder);
}

/**
 * To initialize Deploy Engine or not by selected deployment type
 * @param {NewSkillDeployerType} deployerType the deployer type from userInput
 * @param {String} infrastructurePath the root path for current deploy delegate's files in skill's project
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {uiCallback} callback { error, ddType } return the selected deploy delegate type
 */
export function initializeDeployDelegate(
  deployerType: NewSkillDeployerType | undefined,
  projectFolderPath: string,
  profile: string,
  doDebug: boolean,
  callback: uiCallback,
): void {
  // no need to bootstrap if it's self-hosted
  if (!deployerType || deployerType === DEPLOYER_TYPE.SELF_HOSTED.NAME) {
    callback(null);
    return;
  }
  // no need to bootstrap as the project is already configured with deployerType
  let ddType = ResourcesConfig.getInstance().getSkillInfraType(profile);
  if (stringUtils.isNonBlankString(ddType) && deployerType === ddType) {
    callback(null, ddType);
    return;
  }
  // bootstrap when deployerType is not set from the template
  const infrastructurePath = path.join(projectFolderPath, FILE_PATH.SKILL_INFRASTRUCTURE.INFRASTRUCTURE);
  bootstrapProject(deployerType, infrastructurePath, profile, doDebug, (bootstrapErr: Error) => {
    if (bootstrapErr) {
      callback(bootstrapErr);
    } else {
      ddType = ResourcesConfig.getInstance().getSkillInfraType(profile);
      callback(null, ddType);
    }
  });
}

/**
 * Trigger the bootstrap process from the selected deploy delegate
 * @param {NewSkillDeployerType} deployerType the type of the deployer
 * @param {String} infrastructurePath the root path for current deploy delegate's files in skill's project
 * @param {String} profile ask-cli profile
 * @param {Boolean} doDebug
 * @param {Function} callback (error)
 */
export function bootstrapProject(
  deployerType: NewSkillDeployerType,
  infrastructurePath: string,
  profile: string,
  doDebug: boolean,
  callback: Function,
): void {
  // 1.Initiate ask-resources config for skillInfrastructure field
  const ddFolderPath = deployerType.startsWith("@ask-cli/") ? deployerType.replace("@ask-cli/", "") : deployerType;
  const workspacePath = path.join(infrastructurePath, stringUtils.filterNonAlphanumeric(ddFolderPath));
  fs.ensureDirSync(workspacePath);
  ResourcesConfig.getInstance().setSkillInfraType(profile, deployerType);
  ResourcesConfig.getInstance().setSkillInfraDeployState(profile, {});

  // 2.Bootstrap skill project with deploy delegate logic
  const skillInfraController = new SkillInfrastructureController({profile, doDebug});
  skillInfraController.bootstrapInfrastructures(workspacePath, (bootstrapErr: Error) => {
    bootstrapErr ? callback(bootstrapErr) : callback(null);
  });
}
