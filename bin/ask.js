#!/usr/bin/env node
/* eslint-disable global-require */

if (!require('semver').gte(process.version, '8.3.0')) {
    console.log('Version of node.js doesn\'t meet minimum requirement.');
    console.log('Please ensure system has node.js version 8.3.0 or higher.');
    process.exit(1);
}

require('module-alias/register');

const commander = require('commander');
const pluginUtils = require('@src/utils/plugin-utils');

require('@src/commands/configure').createCommand(commander);
require('@src/commands/deploy').createCommand(commander);
require('@src/commands/new').createCommand(commander);
require('@src/commands/init').createCommand(commander);
require('@src/commands/dialog').createCommand(commander);
require('@src/commands/run').createCommand(commander);

commander
    .description('Command Line Interface for Alexa Skill Kit')
    .command('smapi', 'list of Alexa Skill Management API commands')
    .command('skill', 'increase the productivity when managing skill metadata')
    .command('util', 'tooling functions when using ask-cli to manage Alexa Skill')
    .version(require('../package.json').version);

const ALLOWED_ASK_ARGV_2 = ['-V', '--version', ' - h', '--help'];

let coreCommands = commander.commands.map(command => ({ name: command._name }));

coreCommands.forEach(subCommand => ALLOWED_ASK_ARGV_2.push(subCommand.name));

let pluginResults = pluginUtils.findPluginsInEnvPath(coreCommands);

if (pluginResults.subCommands.length > 0) {
    pluginUtils.addCommands(commander, pluginResults.subCommands);
    pluginResults.subCommands.forEach(subCommand => ALLOWED_ASK_ARGV_2.unshift(subCommand.name));
}

if (pluginResults.duplicateCommands.length > 0) {
    pluginUtils.reportDuplicateCommands(coreCommands, pluginResults.subCommands, pluginResults.duplicateCommands);
}

commander.parse(process.argv);

if (process.argv[2] && ALLOWED_ASK_ARGV_2.indexOf(process.argv[2]) === -1) {
    console.log('Command not recognized. Please run "ask" to check the user instructions.');
    process.exit(1);
}