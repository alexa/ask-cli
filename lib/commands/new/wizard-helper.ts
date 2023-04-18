import Messenger from "../../view/messenger";
import {DEPLOYER_TYPE} from "../../utils/constants";
import stringUtils from "../../utils/string-utils";
import urlUtils from "../../utils/url-utils";
import * as ui from "./ui";
import {convertUserInputToFilterValue, getSampleTemplatesFromS3} from "./template-helper";
import {getProjectFolderName} from "../../view/prompt-view";
import {callbackError} from "../../model/callback";
import {
  NewSkillCodeLanguage,
  NewSkillDeployerType,
  NewSkillDeployerTypeInfo,
  NewSkillRegion,
  NewSkillTemplateInfo,
  NewSkillUserInput,
  MODELING_STACK_IM,
  MODELING_STACK_AC,
  CODE_LANGUAGE_NODEJS,
  CODE_LANGUAGE_PYTHON,
  CODE_LANGUAGE_JAVA,
} from ".";
import {SampleTemplate, SampleTemplatesFilter} from "../../model/sample-template";

export type CollectUserCreationProjectInfoCallback = (err: Error | null, input: NewSkillUserInput | undefined) => void;

/**
 * Ask for user input to create a project
 * @param {Object} cmd command object
 * @param {CollectUserCreationProjectInfoCallback} callback callback providing the NewSkillUserInput to the caller
 */
export async function collectUserCreationProjectInfo(
  cmd: Record<string, any>,
  callback: CollectUserCreationProjectInfoCallback,
): Promise<void> {
  const userInput: NewSkillUserInput = {};

  try {
    // Make sure the arguments are valid
    if (cmd.templateUrl && !urlUtils.isValidUrl(cmd.templateUrl)) {
      throw new Error(`The provided template url ${cmd.templateUrl} is not a valid url.`);
    }

    // gets the sample templates from S3
    const sampleTemplates: SampleTemplate[] = [];
    await getSampleTemplatesFromS3(cmd.doDebug).then((fullSamples) => {
      sampleTemplates.push(...fullSamples);
    });
    const sampleTemplateFilter: SampleTemplatesFilter = new SampleTemplatesFilter(sampleTemplates);

    // MODELING STACK TYPE
    sampleTemplateFilter.filter("stack", cmd.ac ? MODELING_STACK_AC : MODELING_STACK_IM);

    // CODE LANGUAGE
    // ignore when template url supplied
    if (!cmd.templateUrl) {
      await promptForCodeLanguage(sampleTemplateFilter.getSampleTemplates()).then((language) => (userInput.language = language));
      sampleTemplateFilter.filter("lang", convertUserInputToFilterValue(userInput.language || CODE_LANGUAGE_NODEJS));
    }

    // DEPLOY TYPE
    await promptForDeployerType(sampleTemplateFilter.getSampleTemplates()).then(
      (deploymentType) => (userInput.deploymentType = deploymentType),
    );
    sampleTemplateFilter.filter("deploy", convertUserInputToFilterValue(userInput.deploymentType || DEPLOYER_TYPE.CFN.NAME));

    if (userInput.deploymentType === DEPLOYER_TYPE.HOSTED.NAME) {
      // HOSTED SKILL LOCALE
      // FIX hard coding until backend for hosted skills supports locales
      userInput.locale = "en-US";

      // HOSTED SKILL AWS REGION
      await promptForSkillRegion().then((region) => (userInput.region = region));
    } else {
      // NON HOSTED SKILL requires selecting a sample template from the list
      // TEMPLATE INFO
      await promptForTemplateInfo(cmd, sampleTemplateFilter.getSampleTemplates()).then(
        (templateInfo) => (userInput.templateInfo = templateInfo),
      );
    }
    // SKILL NAME
    await promptForSkillName(userInput.templateInfo?.templateUrl || null).then((skillName) => (userInput.skillName = skillName));

    // PROJECT FOLDER NAME
    await promptForProjectFolderName(userInput.skillName || "").then(
      (projectFolderName) => (userInput.projectFolderName = projectFolderName),
    );
  } catch (e) {
    callback(e as Error, undefined);
    return;
  }
  callback(null, userInput);
}

/**
 * A Promise that fetches and returns the NewSkillCodeLanguage the user wants to leverage
 *
 * @param {SampleTemplate[]} samples remaining sample templates to select from
 * @returns {Promise<NewSkillCodeLanguage>} a Promise that will provide a NewSkillCodeLanguage
 */
function promptForCodeLanguage(samples: SampleTemplate[]): Promise<NewSkillCodeLanguage> {
  return new Promise<NewSkillCodeLanguage>((resolve, reject) => {
    const remainingLanguages: Set<NewSkillCodeLanguage> = new Set(
      samples.map((sample) => {
        switch (sample.lang) {
          case "node":
            return CODE_LANGUAGE_NODEJS;
          case "python":
            return CODE_LANGUAGE_PYTHON;
          case "java":
            return CODE_LANGUAGE_JAVA;
        }
      }),
    );

    ui.selectSkillCodeLanguage(Array.from(remainingLanguages), (error, language) => (error ? reject(error) : resolve(language)));
  });
}

/**
 * A Promise that fetches and returns the NewSkillDeployerType the user wants to leverage
 *
 * @param {boolean} hasTemplateUrl true or false if the templateUrl was specified as a command line argument
 * @returns {Promise<NewSkillDeployerType>} a Promise that will provide a NewSkillDeployerType
 */
function promptForDeployerType(samples: SampleTemplate[]): Promise<NewSkillDeployerType> {
  return new Promise<NewSkillDeployerType>((resolve, reject) => {
    const remainingDeployerTypes: Set<NewSkillDeployerTypeInfo> = new Set(
      samples.map((sample) => {
        switch (sample.deploy) {
          case "lambda":
            return DEPLOYER_TYPE.LAMBDA;
          case "cfn":
            return DEPLOYER_TYPE.CFN;
          case "hosted":
            return DEPLOYER_TYPE.HOSTED;
          case "self":
            return DEPLOYER_TYPE.SELF_HOSTED;
        }
      }),
    );

    ui.getDeploymentType(Array.from(remainingDeployerTypes), (error, deploymentType) => (error ? reject(error) : resolve(deploymentType)));
  });
}

/**
 * A Promise that fetches and returns the default AWS Region to use for deploying the Alexa hosted skill
 *
 * @returns {Promise<NewSkillRegion>} Promises to return the default AWS Region the user wants to deploy the skill to
 */
function promptForSkillRegion(): Promise<NewSkillRegion> {
  return new Promise<NewSkillRegion>((resolve, reject) => {
    ui.getSkillDefaultRegion((error, region) => (error ? reject(error) : resolve(region)));
  });
}

/**
 * A Promise that fetches and returns a string specifying the new skill name to use.
 *
 * if a templateUrl is provided the user will be presented with a potentially better suited
 * skill name default option instead of the generic hello world
 *
 * @param {string | null} templateUrl the template url to use for attempting to get a skillname instead of the default hello world
 */
function promptForSkillName(templateUrl: string | null): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    ui.getSkillName(templateUrl, (error, skillName) => (error ? reject(error) : resolve(skillName)));
  });
}

/**
 * A promise that fetches and returns a string specifying the new skill project folder name to use/create
 *
 * @param {string} skillName The name of the skill provided by the customer
 * @returns {Promise<string>} Promises to return the customer provided input string specifying the new skill project folder name to use/create
 */
function promptForProjectFolderName(skillName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    getProjectFolderName(stringUtils.filterNonAlphanumeric(skillName), (error, folderName) =>
      error ? reject(error) : resolve(folderName),
    );
  });
}

/**
 * A Promise that fetches the NewSkillTemplateInfo for non-hosted skill
 * also confirms download for non Alexa official git repos
 *
 * @param {Record<string, any>} cmd command object
 * @param {SampleTemplate[]} samples the unfiltered skill samples templates to resolve
 * @returns {Promise<NewSkillTemplateInfo>} a Promise that provides the New Skill Template Info <NewSkillTemplateInfo>
 */
async function promptForTemplateInfo(cmd: Record<string, any>, samples: SampleTemplate[]): Promise<NewSkillTemplateInfo> {
  return new Promise<NewSkillTemplateInfo>((resolve, reject) => {
    if (!cmd.templateUrl) {
      ui.getTargetTemplateName(samples, (err: callbackError, sampleTemplate: SampleTemplate | undefined) => {
        err
          ? reject(err)
          : resolve({
              templateUrl: sampleTemplate?.url,
              templateName: sampleTemplate?.name,
              templateBranch: sampleTemplate?.branch,
            });
      });

      // handle when templateUrl is present in the the command line arguments
    } else {
      const templateInfoFromCmd: NewSkillTemplateInfo = {
        templateUrl: cmd.templateUrl,
        ...(cmd.templateName ? {templateName: cmd.templateName} : {}),
        ...(cmd.templateBranch ? {templateBranch: cmd.templateBranch} : {}),
      };

      // no warnings/confirmation of download required for official alexa templates
      if (urlUtils.isUrlOfficialTemplate(cmd.templateUrl)) {
        resolve(templateInfoFromCmd);
      } else {
        Messenger.getInstance().warn(
          `CLI is about to download the skill template from unofficial template ${cmd.templateUrl}. ` +
            "Please make sure you understand the source code to best protect yourself from malicious usage.",
        );
        ui.confirmUsingUnofficialTemplate((confirmErr, confirmResult) => {
          confirmErr || !confirmResult ? reject(confirmErr) : resolve(templateInfoFromCmd);
        });
      }
    }
  });
}
