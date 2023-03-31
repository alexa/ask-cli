import {OptionModel} from "../../option-validator";
import GitClient from "../../../clients/git-client";
import {AbstractCommand} from "../../abstract-command";
import optionModel from "../../option-model.json";
import Messenger from "../../../view/messenger";
import profileHelper from "../../../utils/profile-helper";
import CONSTANTS from "../../../utils/constants";
import helper from "./helper";
import hostedSkillHelper from "./hosted-skill-helper";

export default class UpgradeProjectCommand extends AbstractCommand {
  name() {
    return "upgrade-project";
  }

  description() {
    return "upgrade the v1 ask-cli skill project to v2 structure";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    let profile: string, upgradeInfo: any;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
      const {v1Config, isDeployed} = helper.loadV1ProjConfig(process.cwd(), profile);
      // 0.upgrade if project is un-deployed v1 template
      if (!isDeployed) {
        helper.attemptUpgradeUndeployedProject(process.cwd(), v1Config, profile);
        Messenger.getInstance().info("Template project migration finished.");
        return;
      }
      // 1.extract upgrade-necessary information and confirm project is upgrade-able
      upgradeInfo = helper.extractUpgradeInformation(v1Config, profile);
    } catch (checkErr) {
      Messenger.getInstance().error(checkErr);
      throw checkErr;
    }
    return new Promise((resolve, reject) => {
      // 2.preview new project structure
      helper.previewUpgrade(upgradeInfo, (previewErr: string, previewConfirm: boolean) => {
        if (previewErr) {
          Messenger.getInstance().error(previewErr);
          return reject(previewErr);
        }
        if (!previewConfirm) {
          Messenger.getInstance().info("Command upgrade-project aborted.");
          return resolve();
        }
        // 3.create v2 project based on the upgrade info
        if (upgradeInfo.isHosted) {
          return _createV2HostedSkillProject(upgradeInfo, profile, cmd.debug)
            .then(() => {
              Messenger.getInstance().info("Project migration finished.");
              return resolve();
            })
            .catch((v2Err) => {
              Messenger.getInstance().error(v2Err);
              return reject(v2Err);
            });
        } else {
          _createV2NonHostedSkillProject(upgradeInfo, profile, cmd.debug)
            .then(() => {
              Messenger.getInstance().info("Project migration finished.");
              return resolve();
            })
            .catch((v2Err) => {
              Messenger.getInstance().error(v2Err);
              return reject(v2Err);
            });
        }
      });
    });
  }
}

async function _createV2HostedSkillProject(upgradeInfo: any, profile: string, doDebug: boolean): Promise<void> {
  const rootPath = process.cwd();
  const {skillId, gitRepoUrl} = upgradeInfo;
  const verbosityOptions = {
    showCommand: !!doDebug,
    showOutput: !!doDebug,
  };
  const gitClient = new GitClient(rootPath, verbosityOptions);
  hostedSkillHelper.checkIfDevBranchClean(gitClient);
  // 1.move v1 skill project content into legacy folder
  helper.moveOldProjectToLegacyFolder(rootPath);
  // 2.instantiate MVC and ask-resource config
  hostedSkillHelper.createV2ProjectSkeletonAndLoadModel(rootPath, skillId, profile);
  // 3.import skill metadata
  return new Promise((resolve, reject) => {
    hostedSkillHelper.downloadSkillPackage(rootPath, skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, profile, doDebug, (packageErr: any) => {
      if (packageErr) {
        return reject(packageErr);
      }
      // 4.copy Lambda code to skill code and update deploy state
      try {
        hostedSkillHelper.handleExistingLambdaCode(rootPath, gitRepoUrl, profile);
      } catch (codeErr) {
        return reject(codeErr);
      }
      // 5. config git setting
      hostedSkillHelper.postUpgradeGitSetup(profile, doDebug, gitClient, gitRepoUrl, skillId, (gitErr: any) => {
        if (gitErr) {
          return reject(gitErr);
        }
        resolve();
      });
    });
  });
}

async function _createV2NonHostedSkillProject(upgradeInfo: any, profile: string, doDebug: boolean): Promise<void> {
  const rootPath = process.cwd();
  const {skillId, lambdaResources} = upgradeInfo;
  // 1.move v1 skill project content into legacy folder
  helper.moveOldProjectToLegacyFolder(rootPath);
  // 2.instantiate MVC and ask-resource config
  helper.createV2ProjectSkeletonAndLoadModel(rootPath, skillId, profile);

  // 3.import skill metadata from skillId
  return new Promise((resolve, reject) => {
    helper.downloadSkillPackage(rootPath, skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, profile, doDebug, (packageErr: any) => {
      if (packageErr) {
        return reject(packageErr);
      }
      // 4.copy Lambda code to skill code
      try {
        helper.handleExistingLambdaCode(rootPath, lambdaResources, profile);
        resolve();
      } catch (codeErr) {
        reject(codeErr);
      }
    });
  });
}

export const createCommand = new UpgradeProjectCommand(optionModel as OptionModel).createCommand();
