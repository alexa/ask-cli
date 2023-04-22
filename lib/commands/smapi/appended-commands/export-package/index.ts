import fs from "fs";
import path from "path";
import {AbstractCommand} from "../../../abstract-command";
import CONSTANTS from "../../../../utils/constants";
import  * as jsonView from "../../../../view/json-view";
import Messenger from "../../../../view/messenger";
import optionModel from "../../../option-model.json";
import profileHelper from "../../../../utils/profile-helper";
import SmapiClient from "../../../../clients/smapi-client";
import zipUtils from "../../../../utils/zip-utils";
import helper from "./helper.js";
import {OptionModel} from "../../../option-validator";

export default class ExportPackageCommand extends AbstractCommand {
  name() {
    return "export-package";
  }

  description() {
    return 'download the skill package to "skill-package" folder in current directory';
  }

  requiredOptions() {
    return ["skill-id", "stage"];
  }

  optionalOptions() {
    return ["profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    let profile;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
      // 0.check if a skill-package file exists
      if (fs.existsSync(CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE)) {
        throw new Error(`A ${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE} folder already exists in the current working directory.`);
      }
    } catch (err) {
      Messenger.getInstance().error(err);
      throw err;
    }
    const smapiClient = new SmapiClient({
      profile,
      doDebug: cmd.debug,
    });

    // 1.request to export skill package
    return new Promise((resolve, reject) => {
      smapiClient.skillPackage.exportPackage(cmd.skillId, cmd.stage, (exportErr: any, exportResponse: any) => {
        if (exportErr) {
          Messenger.getInstance().error(jsonView.toString(exportErr));
          return reject(new Error(jsonView.toString(exportErr)));
        }

        const exportId = path.basename(exportResponse?.headers?.location);

        // 2.poll for the skill package export status
        helper.pollExportStatus(smapiClient, exportId, (pollErr: any, pollResponse: any) => {
          if (pollErr) {
            Messenger.getInstance().error(pollErr);
            return reject(pollErr);
          }
          // 3.download skill package into local file system
          const skillPackageLocation = pollResponse?.body?.skill?.location;
          const rootPath = process.cwd();
          const targetPath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE);
          zipUtils.unzipRemoteZipFile(skillPackageLocation, targetPath, false, (unzipErr: any) => {
            if (unzipErr) {
              Messenger.getInstance().error(unzipErr);
              return reject(unzipErr);
            }
            Messenger.getInstance().info(`The skill package had been downloaded into ${targetPath}.`);
            resolve();
          });
        });
      });
    });
  }
}

export const createCommand = new ExportPackageCommand(optionModel as OptionModel).createCommand();
