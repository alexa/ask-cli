import {createCommand as upgradeCreateCommand} from "./upgrade-project";
import {createCommand as gitCredsCreateCommand} from "./git-credentials-helper";
import {createCommand as generateLwaTokenCommand} from "./generate-lwa-tokens";
import {Command} from "commander";

const commander = new Command();

const UTIL_COMMAND_MAP: Record<string, (commander: Command) => void> = {
  "upgrade-project": upgradeCreateCommand,
  "git-credentials-helper": gitCredsCreateCommand,
  "generate-lwa-tokens": generateLwaTokenCommand,
};

Object.values(UTIL_COMMAND_MAP).forEach((createCommand) => createCommand(commander));

commander.name("ask util");
commander.description("tooling functions when using ask-cli to manage Alexa Skill");

export {commander, UTIL_COMMAND_MAP};
