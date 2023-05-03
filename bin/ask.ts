#!/usr/bin/env node
import semver from "semver";

if (!semver.gte(process.version, "8.3.0")) {
  console.log("Version of node.js doesn't meet minimum requirement.");
  console.log("Please ensure system has node.js version 8.3.0 or higher.");
  process.exit(1);
}

import { Command } from 'commander';
const commander = new Command();

import {createCommand as configureCommand} from "../lib/commands/configure";
import {createCommand as deployCommand} from "../lib/commands/deploy";
import {createCommand as newCommand} from "../lib/commands/new";
import {createCommand as initCommand} from "../lib/commands/init";
import {createCommand as dialogCommand} from "../lib/commands/dialog";
import {createCommand as runCommand} from "../lib/commands/run";
import {createCommand as installCommand} from "../lib/commands/install";
import {createCommand as uninstallCommand} from "../lib/commands/uninstall";


[configureCommand, deployCommand, newCommand, initCommand, dialogCommand, runCommand, installCommand, uninstallCommand].forEach(
  (command) => command(commander),
);

commander
  .description("Command Line Interface for Alexa Skill Kit")
  .command("smapi", "list of Alexa Skill Management API commands")
  .command("skill", "increase the productivity when managing skill metadata")
  .command("util", "tooling functions when using ask-cli to manage Alexa Skill")
  .version(require("../package.json").version)
  .parse(process.argv);

const ALLOWED_ASK_ARGV_2 = [
  "configure",
  "deploy",
  "new",
  "init",
  "dialog",
  "smapi",
  "skill",
  "util",
  "help",
  "-v",
  "--version",
  "-h",
  "--help",
  "run",
  "install",
  "uninstall"
];
if (process.argv[2] && ALLOWED_ASK_ARGV_2.indexOf(process.argv[2]) === -1) {
  console.log('Command not recognized. Please run "ask" to check the user instructions.');
  process.exit(1);
}