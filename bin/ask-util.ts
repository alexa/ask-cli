#!/usr/bin/env node
import {commander, UTIL_COMMAND_MAP} from "../lib/commands/util/util-commander";

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
} else if (UTIL_COMMAND_MAP[process.argv[2]] === undefined) {
  console.error('Command not recognized. Please run "ask util" to check the user instructions.');
  process.exit(1);
}
