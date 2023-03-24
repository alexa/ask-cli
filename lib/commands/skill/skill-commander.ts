import {Command} from "commander";

import {createCommand as localesCreateCommand} from "./add-locales";

const commander = new Command();
const SKILL_COMMAND_MAP: Record<string, (commander: Command) => void> = {
  "add-locales": localesCreateCommand,
};

Object.values(SKILL_COMMAND_MAP).forEach((create) => create(commander));

commander.name("ask skill");
commander.description("increase the productivity when managing skill metadata");

export {commander, SKILL_COMMAND_MAP};
