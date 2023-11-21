import fs from "fs-extra";
import path from "path";
import {AbstractCommand} from "../abstract-command";
import optionModel from "../option-model.json";
import CliError from "../../exceptions/cli-error";
import CliFileNotFoundError from "../../exceptions/cli-file-not-found-error";
import CliWarn from "../../exceptions/cli-warn";
import ResourcesConfig from "../../model/resources-config";
import Manifest from "../../model/manifest";
import CONSTANTS from "../../utils/constants";
import profileHelper from "../../utils/profile-helper";
import stringUtils from "../../utils/string-utils";
import Messenger from "../../view/messenger";
import ui from "./ui";
import helper from "./helper";
import {OptionModel} from "../option-validator";
import {isAcSkill} from "../../utils/ac-util";

export default class DeployCommand extends AbstractCommand {
  name() {
    return "deploy";
  }

  description() {
    return "deploy the skill project";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["ignore-hash", "target", "profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    let profile: string;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
      new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
      ResourcesConfig.getInstance().setDeploymentStatus(profile, "IN_PROGRESS");
      ResourcesConfig.getInstance().write();
      Messenger.getInstance().info(`Deploy configuration loaded from ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`);
      helper.confirmProfile(profile);
      this._filterAlexaHostedSkill(profile);
      this._initiateManifestModel(profile);
    } catch (err) {
      if (err instanceof CliWarn) {
        Messenger.getInstance().warn(err.message);
      } else if (err instanceof CliFileNotFoundError) {
        Messenger.getInstance().warn(err.message);
      } else if (err instanceof CliError) {
        Messenger.getInstance().error(err.message);
      } else {
        Messenger.getInstance().error(err);
      }
      throw err;
    }

    const allowedTargets = Object.values(CONSTANTS.DEPLOY_TARGET);
    if (cmd.target && !allowedTargets.includes(cmd.target)) {
      const errMessage = `Target ${cmd.target} is not supported. Supported targets: ${allowedTargets}.`;
      Messenger.getInstance().error(errMessage);
      throw new CliError(errMessage);
    }
    const options = {profile, doDebug: cmd.debug, ignoreHash: cmd.ignoreHash, target: cmd.target};

    return new Promise((resolve, reject) => {
      ui.confirmDeploymentIfNeeded(profile, (err: any, confirmResult: boolean) => {
        if (err) {
          Messenger.getInstance().error(err);
          return reject(err);
        }

        if (!confirmResult) {
          Messenger.getInstance().info("Deployment cancelled.");
          return resolve();
        }
        deployResources(options)
          .then(() => {
            const deploymentType = helper.getDeploymentType(profile);

            // Save the deployment type to ask states
            ResourcesConfig.getInstance().setSkillMetaLastDeployType(profile, deploymentType);
            ResourcesConfig.getInstance().setDeploymentStatus(profile, "COMPLETE");
            // Write updates back to resources file
            ResourcesConfig.getInstance().write();
            Manifest.getInstance().write();

            // Skipping enable logic if deploying with target flag
            // since we may don't have the endpoint
            if (cmd.target) {
              return resolve();
            }
            // Post deploy logic
            // call smapiClient to enable skill
            helper.enableSkill(profile, cmd.debug, (enableError: any) => {
              if (enableError instanceof CliWarn) {
                Messenger.getInstance().warn(enableError);
                return resolve();
              }
              if (enableError) {
                Messenger.getInstance().error(enableError);
                return reject(enableError);
              }
              return resolve();
            });
          })
          .catch((err) => {
            ResourcesConfig.getInstance().setDeploymentStatus(profile, "COMPLETE");
            // Write updates back to resources file
            ResourcesConfig.getInstance().write();
            Messenger.getInstance().error(err);
            return reject(err);
          });
      });
    });
  }

  _filterAlexaHostedSkill(profile: string) {
    const deployerType = ResourcesConfig.getInstance().getSkillInfraType(profile);
    if (deployerType === CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME) {
      throw new CliWarn(
        "Alexa hosted skills can be deployed by performing a git push.\n" +
          "The master branch gets deployed to skill's development stage\n" +
          "The prod branch gets deployed to skill's live stage\n" +
          'Please run "git push" at the proper branch to deploy hosted skill to your targeted stage.',
      );
    }
  }

  _initiateManifestModel(profile: string) {
    const skillPackageSrc = ResourcesConfig.getInstance().getSkillMetaSrc(profile);
    if (!stringUtils.isNonBlankString(skillPackageSrc)) {
      throw new CliError("Skill package src is not found in ask-resources.json.");
    }
    if (!fs.existsSync(skillPackageSrc)) {
      throw new CliError(`The skillMetadata src file ${skillPackageSrc} does not exist.`);
    }

    // check whether it is a AC skill
    if (isAcSkill(profile) === true) {
      // if it's AC skill, check if the build/skill-package exists
      const buildPackageSrc = path.join("build", skillPackageSrc);
      if (!fs.existsSync(buildPackageSrc)) {
        throw new CliError(
          `The directory specified, ${buildPackageSrc}, does not exist. Please compile your AC skill before deploying it.`,
        );
      }
    }
    const manifestPath = path.join(skillPackageSrc, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST);
    new Manifest(manifestPath);
  }
}

/**
 * The deploy function used to deploy all skill related resources
 * This steps includes the deploy of skillMeta, skillCode and skillInfra using the deployDelegate plugin
 * @param {String} profile The profile name
 * @param {Boolean} doDebug The flag of debug or not
 * @param {Boolean} ignoreHash The flag to ignore difference between local and remote version
 * @param {Function} callback
 */
async function deployResources(options: Record<string, any>): Promise<void> {
  const {profile, doDebug, target, ignoreHash} = options;
  await _deploySkillMetadata(options);

  if (target && target !== CONSTANTS.DEPLOY_TARGET.SKILL_INFRASTRUCTURE) {
    return;
  }

  if (!ResourcesConfig.getInstance().getSkillId(profile)) {
    const errorMessage =
      `Unable to deploy target ${target} when the skillId has not been created yet. ` +
      "Please deploy your skillMetadata first by running “ask deploy” command.";
    throw new CliError(errorMessage);
  }

  // Skill Code
  const regionsList = ResourcesConfig.getInstance().getCodeRegions(profile);
  if (!regionsList || regionsList.length === 0) {
    return;
  }
  Messenger.getInstance().info("\n==================== Build Skill Code ====================");
  return new Promise((resolve, reject) => {
    helper.buildSkillCode(profile, doDebug, (buildErr: any, uniqueCodeList: any[]) => {
      if (buildErr) {
        return reject(buildErr);
      }
      Messenger.getInstance().info("Skill code built successfully.");
      uniqueCodeList.forEach((codeProperty) => {
        const buildFilePath = codeProperty.build.file;
        Messenger.getInstance().info(`Code for region ${codeProperty.regionsList.join("+")} built to ${buildFilePath} successfully \
with build flow ${codeProperty.buildFlow}.`);
      });

      // Skill Infrastructure
      const infraType = ResourcesConfig.getInstance().getSkillInfraType(profile);
      if (!stringUtils.isNonBlankString(infraType)) {
        return resolve();
      }
      Messenger.getInstance().info("\n==================== Deploy Skill Infrastructure ====================");
      helper.deploySkillInfrastructure(profile, doDebug, ignoreHash, (infraErr: any) => {
        if (infraErr) {
          return reject(infraErr);
        }
        Messenger.getInstance().info(`\nSkill infrastructures deployed successfully through ${infraType}.`);
        resolve();
      });
    });
  });
}

async function _deploySkillMetadata(options: Record<string, any>): Promise<void> {
  const {profile, target} = options;
  if (target && target !== CONSTANTS.DEPLOY_TARGET.SKILL_METADATA) {
    return;
  }

  const isAcdlSkill = isAcSkill(profile);
  const acMsg = "Uploading the entire skill package and building the models. For Alexa Conversations it can take 20-60 minutes...";
  const imMsg = "Uploading the entire skill package and building the models. Normally it takes a few minutes...";
  const startMsg = isAcdlSkill ? acMsg : imMsg;

  if (isAcdlSkill) {
    Messenger.getInstance().warn(CONSTANTS.ACDL_BETA_MESSAGE + "\n");
  }

  // Skill Metadata
  Messenger.getInstance().info("==================== Deploy Skill Metadata ====================");
  Messenger.getInstance().info(startMsg);
  return new Promise((resolve, reject) => {
    helper.deploySkillMetadata(options, (metaErr: any) => {
      if (
        metaErr &&
        metaErr !==
          "The hash of current skill package folder does not change compared to the last deploy hash result, " +
            "CLI will skip the deploy of skill package."
      ) {
        return reject(metaErr);
      }
      if (metaErr) {
        // this case is the warning message of the same hash skip, deploy will continue
        Messenger.getInstance().warn(metaErr);
      } else {
        ResourcesConfig.getInstance().write();
        Messenger.getInstance().info("Skill package deployed and all models built successfully.");
      }
      Messenger.getInstance().info(`Skill ID: ${ResourcesConfig.getInstance().getSkillId(profile)}`);

      return resolve();
    });
  });
}

export const createCommand = new DeployCommand(optionModel as OptionModel).createCommand();
