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

export default class UninstallCommand extends AbstractCommand {
    name() {
        return "uninstall";
    }

    description() {
        return "uninstall alexa skill components from your Alexa skill";
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
            Messenger.getInstance().error(`The skill package source directory was not found in the ask-resources.json file under the profile ${cmd.profile}.`);
            return;
        }
        if (!fs.existsSync(skillPackageSrc)) {
            Messenger.getInstance().error(`The skillMetadata src file ${skillPackageSrc} does not exist.`);
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

        if (!fs.existsSync(configFilePath)) {
            Messenger.getInstance().info(
                `Component ${componentName} is not installed.`
            );
            return;
        }

        // Uninstall the component using npm with spinner
        const spinner = new SpinnerView({ color: "yellow" });
        spinner.start(`Uninstalling ${componentName}...`);

        const uninstallCommand = spawn("npm", ["uninstall", componentName], {
            cwd: cwd,
            stdio: "pipe",
        });

        uninstallCommand.on("error", (err) => {
            spinner.terminate(
                TERMINATE_STYLE.FAIL,
                `Failed to uninstall ${componentName}.`
            );
            throw new CliError(
                `An error occurred while uninstalling component ${componentName}: ${err.message}`
            );
        });

        uninstallCommand.stderr.on("data", (data) => {
            spinner.update(data.toString());
          });

        uninstallCommand.on("exit", (code) => {
            if (code === 0) {
                // Remove config file from the skill package
                fs.unlinkSync(configFilePath);

                spinner.terminate(
                    TERMINATE_STYLE.SUCCEED,
                    `${componentName} uninstalled successfully!`
                );
            } else {
                spinner.terminate(
                    TERMINATE_STYLE.FAIL,
                    `Failed to uninstall ${componentName}.`
                );
                throw new CliError(
                    `An error occurred while uninstalling component ${componentName}. Please try again.`
                );
            }
        });
    }
}

export const createCommand = new UninstallCommand(
    optionModel as OptionModel
).createCommand();
