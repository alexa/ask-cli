#!/usr/bin/env node

import {commander, SKILL_COMMAND_MAP} from "../lib/commands/skill/skill-commander";

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
} else if (SKILL_COMMAND_MAP[process.argv[2]] === undefined) {
  console.error('Command not recognized. Please run "ask skill" to check the user instructions.');
  process.exit(1);
}
