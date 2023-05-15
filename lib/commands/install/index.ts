import { AbstractCommand } from "../abstract-command";
import { spawn } from "child_process";
import path from "path";
import optionModel from "../option-model.json";
import fs from "fs";
import CliError from "../../exceptions/cli-error";
import CliFileNotFoundError from "../../exceptions/cli-file-not-found-error";
import CliWarn from "../../exceptions/cli-warn";
import { OptionModel } from "../option-validator";
import Messenger from "../../view/messenger";
import SpinnerView, { TERMINATE_STYLE } from "../../view/spinner-view";
import ResourcesConfig from "../../model/resources-config";
import CONSTANTS from "../../utils/constants";
import stringUtils from "../../utils/string-utils";
import profileHelper from "../../utils/profile-helper";

export default class InstallCommand extends AbstractCommand {
  name() {
    return "install";
  }

  description() {
    return "install alexa skill components in your Alexa skill";
  }

  requiredOptions() {
    return ["component-name"];
  }

  optionalOptions() {
    return ["profile"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    let profile: string;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
      new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));

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

    const skillPackageSrc = ResourcesConfig.getInstance().getSkillMetaSrc(profile);
    if (!stringUtils.isNonBlankString(skillPackageSrc)) {
      Messenger.getInstance().error("Skill package src is not found in ask-resources.json.");
      return;
    }
    if (!fs.existsSync(skillPackageSrc)) {
      Messenger.getInstance().error(`Directory ${skillPackageSrc} does not exist.`);
      return;
    }

    const componentName = cmd.componentName;
    const cwd = process.cwd();

    // Check if the component is already installed
    const componentDirPath = path.join(
      skillPackageSrc,
      "skillComponents",
      componentName
    );
    const configFilePath = path.join(componentDirPath, "config.jsonc");

    if (fs.existsSync(configFilePath)) {
      Messenger.getInstance().info(
        `Component ${componentName} is already installed. Please use the "ask update" command to update to the latest version.`
      );
      return;
    }

    // Install the component using npm with spinner
    const spinner = new SpinnerView({ color: "yellow" });
    spinner.start(`Installing ${componentName}...`);

    const installCommand = spawn("npm", ["install", componentName], {
      cwd: cwd,
      stdio: "pipe",
    });

    installCommand.on("error", (err) => {
      spinner.terminate(TERMINATE_STYLE.FAIL, `Failed to install ${componentName}.`);
      throw new CliError(
        `An error occurred while installing component ${componentName}: ${err.message}`
      );
    });

    installCommand.stderr.on("data", (data) => {
      spinner.update(data.toString());
    });

    installCommand.on("exit", (code) => {
      if (code !== 0) {
        spinner.terminate(TERMINATE_STYLE.FAIL, `Failed to install ${componentName}.`);
        throw new CliError(
          `An error occurred while installing component ${componentName}. Please try again.`
        );
      } else {
        // Copy config file to the skill package
        const componentConfigPath = path.join(
          cwd,
          "node_modules",
          componentName,
          "config.jsonc"
        );

        if (!fs.existsSync(componentDirPath)) {
          fs.mkdirSync(componentDirPath, { recursive: true });
        }

        fs.copyFileSync(
          componentConfigPath,
          path.join(componentDirPath, "config.jsonc")
        );

        spinner.terminate(TERMINATE_STYLE.SUCCEED, `${componentName} installed successfully! \n \u001b[1mPlease edit the config.jsonc file copied at ${skillPackageSrc}/components/${componentName} to configure the component. This step is necessary for the component to function properly within your Alexa skill.\n`);
      }
    });
  }
}

export const createCommand = new InstallCommand(
  optionModel as OptionModel
).createCommand();