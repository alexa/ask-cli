import path from "path";
import SmapiClient, {ISmapiClient, isSmapiError} from "../../clients/smapi-client";
import {AbstractCommand} from "../abstract-command";
import optionModel from "../option-model.json";
import HostedSkillController from "../../controllers/hosted-skill-controller";
import CliWarn from "../../exceptions/cli-warn";
import CONSTANTS from "../../utils/constants";
import profileHelper from "../../utils/profile-helper";
import stringUtils from "../../utils/string-utils";
import jsonView from "../../view/json-view";
import Messenger from "../../view/messenger";
import helper from "./helper";
import ui from "./ui";
import {OptionModel} from "../option-validator";
import {v1} from "ask-smapi-model";

export default class InitCommand extends AbstractCommand {
  name() {
    return "init";
  }

  description() {
    return "setup a new or existing Alexa skill project";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["hosted-skill-id", "profile", "debug"];
  }

  async handle(cmd: Record<string, any>) {
    let profile;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
    } catch (err) {
      Messenger.getInstance().error(err);
      throw err;
    }

    const rootPath = process.cwd();
    if (!cmd.hostedSkillId) {
      await initNonHostedSkill(rootPath, cmd, profile);
    } else {
      await initAlexaHostedSkill(rootPath, cmd, profile);
    }
  }
}

async function initAlexaHostedSkill(rootPath: string, cmd: Record<string, any>, profile: string): Promise<void> {
  const smapiClient = new SmapiClient({profile, doDebug: cmd.debug});
  const hostedSkillController = new HostedSkillController({profile, doDebug: cmd.debug});
  try {
    const skillName = await _getSkillName(smapiClient, cmd.hostedSkillId);
    const folderName = await _confirmProjectFolderName(skillName);

    const projectPath = path.join(rootPath, folderName);

    return new Promise((resolve, reject) => {
      hostedSkillController.updateAskSystemScripts((scriptErr: any) => {
        if (scriptErr) {
          Messenger.getInstance().error(scriptErr);
          return reject(scriptErr);
        }
        hostedSkillController.clone(cmd.hostedSkillId, skillName, projectPath, (cloneErr: any) => {
          if (cloneErr) {
            Messenger.getInstance().error(cloneErr);
            return reject(cloneErr);
          }
          hostedSkillController.updateSkillPrePushScript(folderName, (hooksErr: any) => {
            if (hooksErr) {
              Messenger.getInstance().error(hooksErr);
              return reject(hooksErr);
            }
            Messenger.getInstance().info(`\n${skillName} successfully initialized.\n`);
            resolve();
          });
        });
      });
    });
  } catch (err) {
    Messenger.getInstance().error(err);
    throw err;
  }
}

async function initNonHostedSkill(rootPath: string, cmd: Record<string, any>, profile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    helper.preInitCheck(rootPath, profile, (preCheckErr: any) => {
      if (preCheckErr) {
        if (preCheckErr instanceof CliWarn) {
          Messenger.getInstance().warn(preCheckErr.message);
        } else {
          Messenger.getInstance().error(preCheckErr);
        }
        return reject(preCheckErr);
      }
      _collectAskResources()
        .then((userInput) => {
          helper.previewAndWriteAskResources(rootPath, userInput, profile, (previewErr: any) => {
            if (previewErr) {
              if (previewErr instanceof CliWarn) {
                Messenger.getInstance().warn(previewErr.message);
              } else {
                Messenger.getInstance().error(previewErr);
              }
              return reject(previewErr);
            }
            helper.bootstrapSkillInfra(rootPath, profile, cmd.debug, (postErr: any) => {
              if (postErr) {
                Messenger.getInstance().error(postErr);
                return reject(postErr);
              }
              Messenger.getInstance().info('\nSuccess! Run "ask deploy" to deploy your skill.');
              resolve();
            });
          });
        })
        .catch((inputErr) => {
          Messenger.getInstance().error(inputErr);
          return reject(inputErr);
        });
    });
  });
}

/**
 * List of QAs to collect users' ask-resources configurations
 */
async function _collectAskResources(): Promise<{skillId: string; skillMeta: any; skillCode?: any; skillInfra?: string}> {
  return new Promise((resolve, reject) => {
    helper.getSkillIdUserInput((skillIdErr?: any, skillId?: string) => {
      if (skillIdErr) {
        return reject(skillIdErr);
      }
      helper.getSkillMetadataUserInput((metaErr?: any, skillMeta?: any) => {
        if (metaErr) {
          return reject(metaErr);
        }
        helper.getSkillCodeUserInput((codeErr?: any, skillCode?: any) => {
          if (codeErr) {
            return reject(codeErr);
          }
          if (!skillCode) {
            // return to skip skillInfra setting if skill code is not provided
            return resolve({skillId: skillId!, skillMeta});
          }
          helper.getSkillInfraUserInput((infraErr?: any, skillInfra?: any) => {
            if (infraErr) {
              return reject(infraErr);
            }
            resolve({skillId: skillId!, skillMeta, skillCode, skillInfra});
          });
        });
      });
    });
  });
}

/**
 * To get skill name by calling skill's getManifest api
 * @param {Object} smapiClient SMAPI client to make request
 * @param {string} skillId The skill ID
 * @param {callback} callback { error, response }
 */
async function _getSkillName(smapiClient: ISmapiClient, skillId: string) {
  const manifest = await _getSkillManifest(smapiClient, skillId);
  const locales = manifest?.manifest?.publishingInformation?.locales;
  if (!locales) {
    throw "No skill name found.";
  }
  return locales["en-US"] ? locales["en-US"].name : (<any>Object.values(locales)[0]).name;
}

/**
 * To call getManifest api and return skill manifest
 * @param {Object} smapiClient SMAPI client to make request
 * @param {string} skillId The skill ID
 * @param {callback} callback { error, response }
 */
async function _getSkillManifest(smapiClient: ISmapiClient, skillId: string): Promise<v1.skill.Manifest.SkillManifestEnvelope> {
  return new Promise((resolve, reject) => {
    smapiClient.skill.manifest.getManifest(skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, res) => {
      if (err || !res) {
        return reject(err);
      }
      if (isSmapiError(res)) {
        return reject(jsonView.toString(res.body));
      }
      resolve(res.body);
    });
  });
}

/**
 * To confirm the project folder name with users,
 * the default folder name is generated from the skillName
 * @param {string} skillName The skill name
 * @param {string} callback callback { error, response }
 */
async function _confirmProjectFolderName(skillName: string): Promise<string> {
  const suggestedProjectName = stringUtils.filterNonAlphanumeric(skillName);
  return new Promise((resolve, reject) => {
    ui.getProjectFolderName(suggestedProjectName, (getFolderNameErr?: any, folderName?: string) => {
      if (getFolderNameErr) {
        return reject(getFolderNameErr);
      }
      return resolve(folderName!);
    });
  });
}

export const createCommand = new InitCommand(optionModel as OptionModel).createCommand();
