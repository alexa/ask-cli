import {AbstractCommand} from "../abstract-command";
import optionModel from "../option-model.json";
import HostedSkillController from "../../controllers/hosted-skill-controller";
import Manifest from "../../model/manifest";
import ResourcesConfig from "../../model/resources-config";
import {HOSTED_SKILL, DEPLOYER_TYPE, GIT_USAGE_HOSTED_SKILL_DOCUMENTATION} from "../../utils/constants";
import profileHelper from "../../utils/profile-helper";
import Messenger from "../../view/messenger";
import * as helper from "./helper";
import * as hostedHelper from "./hosted-skill-helper";
import * as wizardHelper from "./wizard-helper";
import {OptionModel} from "../option-validator";

export type NewSkillCodeLanguage = "NodeJS" | "Python" | "Java";
export const CODE_LANGUAGE_NODEJS: NewSkillCodeLanguage = "NodeJS";
export const CODE_LANGUAGE_PYTHON: NewSkillCodeLanguage = "Python";
export const CODE_LANGUAGE_JAVA: NewSkillCodeLanguage = "Java";
export type NewSkillDeployerType = string;
export type NewSkillDeployerTypeInfo = {
  OPTION_NAME: string;
  NAME: string;
  DESCRIPTION: string;
};
export type NewSkillModelingStackTypes = "Interaction Model" | "Alexa Conversations";
export const MODELING_STACK_IM: NewSkillModelingStackTypes = "Interaction Model";
export const MODELING_STACK_IM_DESCRIPTION: string =
  "The Interaction Model stack enables you to define the user interactions with a combination of utterances, intents, and slots.";
export const MODELING_STACK_AC: NewSkillModelingStackTypes = "Alexa Conversations";
export const MODELING_STACK_AC_DESCRIPTION: string =
  "Alexa Conversations (AC) uses deep learning to manage the dialog flow. User utterances, APL, and APLA documents train the skill model to create natural, human-like Alexa voice experiences.";
export type NewSkillTemplateInfo = {
  templateUrl?: string;
  templateName?: string;
  templateBranch?: string;
};
export type NewSkillRegion = keyof typeof HOSTED_SKILL.REGIONS;
export type NewSkillUserInput = {
  language?: NewSkillCodeLanguage;
  deploymentType?: NewSkillDeployerType;
  locale?: string;
  region?: NewSkillRegion;
  templateInfo?: NewSkillTemplateInfo;
  skillName?: string;
  projectFolderName?: string;
  modelingStack?: NewSkillModelingStackTypes;
};

export default class NewCommand extends AbstractCommand {
  name() {
    return "new";
  }

  description() {
    return "create a new skill project from Alexa skill templates";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["templateUrl", "templateBranch", "profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    let profile: string, vendorId: string;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
      vendorId = profileHelper.resolveVendorId(profile);
    } catch (err) {
      Messenger.getInstance().error(err);
      throw err;
    }
    // 0. collect user input and then create a skill(hosted skill or non hosted skill)
    Messenger.getInstance().info("Please follow the wizard to start your Alexa skill project ->");
    return new Promise((resolve, reject) => {
      wizardHelper.collectUserCreationProjectInfo(cmd, (initErr: Error | null, userInput?: NewSkillUserInput) => {
        if (initErr) {
          Messenger.getInstance().error(initErr);
          return reject(initErr);
        }
        if (!userInput) {
          return resolve();
        }
        if (userInput.deploymentType === DEPLOYER_TYPE.HOSTED.NAME) {
          createHostedSkill(cmd, profile, vendorId, userInput)
            .then(resolve)
            .catch((hostedErr) => {
              Messenger.getInstance().error(hostedErr);
              return reject(hostedErr);
            });
        } else {
          createNonHostedSkill(cmd, profile, cmd.debug, userInput)
            .then(resolve)
            .catch((nonHostedErr) => {
              Messenger.getInstance().error(nonHostedErr);
              return reject(nonHostedErr);
            });
        }
      });
    });
  }
}

function createHostedSkill(cmd: Record<string, any>, profile: string, vendorId: string, userInput: NewSkillUserInput): Promise<void> {
  return new Promise((resolve, reject) => {
    const hostedSkillController = new HostedSkillController({profile, doDebug: cmd.debug});
    hostedHelper.validateUserQualification(vendorId, hostedSkillController, (validateErr: any) => {
      if (validateErr) {
        return reject(validateErr);
      }
      hostedHelper.createHostedSkill(hostedSkillController, userInput, vendorId, (createErr: any, skillId: string) => {
        if (createErr) {
          return reject(createErr);
        }
        Messenger.getInstance().info(`Hosted skill provisioning finished. Skill-Id: ${skillId}`);
        Messenger.getInstance().info(
          `Please follow the instructions at ${GIT_USAGE_HOSTED_SKILL_DOCUMENTATION}` +
            ' to learn more about the usage of "git" for Hosted skill.',
        );
        ResourcesConfig.getInstance().write();
        resolve();
      });
    });
  });
}

function createNonHostedSkill(cmd: Record<string, any>, profile: string, doDebug: boolean, userInput: NewSkillUserInput): Promise<void> {
  return new Promise((resolve, reject) => {
    // 1.download skill project templates
    helper.downloadTemplateFromGit(userInput, doDebug, (projectErr: any, projectFolderPath: string) => {
      if (projectErr) {
        return reject(projectErr);
      }
      Messenger.getInstance().info(`Project for skill "${userInput.skillName}" is successfully created at ${projectFolderPath}\n`);

      if (userInput.deploymentType === DEPLOYER_TYPE.SELF_HOSTED.NAME) {
        // nothing more to do for self hosted skills
        resolve();
      }

      try {
        // 2.load involving M(Model) component (ResourcesConfig & Manifest) from the downloaded skill project with 'default' profile
        helper.loadSkillProjectModel(projectFolderPath, "default");
        // 3.remove git record and update skill name
        helper.updateSkillProjectWithUserSettings(userInput.skillName!, projectFolderPath, profile);
      } catch (projErr) {
        return reject(projErr);
      }
      // 4.bootstrap the skill project with deploy delegate if needed
      helper.initializeDeployDelegate(
        userInput.deploymentType,
        projectFolderPath,
        profile,
        cmd.debug,
        (deployDelegateErr: any, deployerType: any) => {
          if (deployDelegateErr) {
            return reject(deployDelegateErr);
          }
          Messenger.getInstance().info(
            deployerType ? `Project initialized with deploy delegate "${deployerType}" successfully.` : "Project initialized successfully.",
          );
          ResourcesConfig.getInstance().write();
          Manifest.getInstance().write();
          resolve();
        },
      );
    });
  });
}

export const createCommand = new NewCommand(optionModel as OptionModel).createCommand();
