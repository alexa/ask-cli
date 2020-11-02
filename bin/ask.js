#!/usr/bin/env node
/* eslint-disable global-require */

if (!require('semver').gte(process.version, '8.3.0')) {
    console.log('Version of node.js doesn\'t meet minimum requirement.');
    console.log('Please ensure system has node.js version 8.3.0 or higher.');
    process.exit(1);
}

require('module-alias/register');
const commander = require('commander');
const CONSTANTS = require('@src/utils/constants');
const { initAutoComplete } = require('@src/commands/autocomplete');

require('@src/commands/configure').createCommand(commander);
require('@src/commands/deploy').createCommand(commander);
require('@src/commands/new').createCommand(commander);
require('@src/commands/init').createCommand(commander);
require('@src/commands/dialog').createCommand(commander);

initAutoComplete();

commander
    .description('Command Line Interface for Alexa Skill Kit')
    .command('smapi', 'list of Alexa Skill Management API commands')
    .command('skill', 'increase the productivity when managing skill metadata')
    .command('autocomplete', 'sets up terminal auto completion')
    .command('util', 'tooling functions when using ask-cli to manage Alexa Skill')
    .version(require('../package.json').version)
    .parse(process.argv);

if (process.argv[2] && CONSTANTS.TOP_LEVEL_COMMANDS.indexOf(process.argv[2]) === -1) {
    console.log('Command not recognized. Please run "ask" to check the user instructions.');
    process.exit(1);
}
