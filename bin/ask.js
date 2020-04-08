#!/usr/bin/env node
/* eslint-disable global-require */

if (!require('semver').gte(process.version, '8.3.0')) {
    console.log('Version of node.js doesn\'t meet minimum requirement.');
    console.log('Please ensure system has node.js version 8.3.0 or higher.');
    process.exit(1);
}

require('module-alias/register');
const commander = require('commander');

require('@src/commands/configure').createCommand(commander);
require('@src/commands/deploy').createCommand(commander);
require('@src/commands/new').createCommand(commander);
require('@src/commands/init').createCommand(commander);
require('@src/commands/dialog').createCommand(commander);

commander
    .description('Command Line Interface for Alexa Skill Kit')
    .command('smapi', 'list of Alexa Skill Management API commands')
    .command('util', 'tooling functions when using ask-cli to manage Alexa Skill')
    .version(require('../package.json').version)
    .parse(process.argv);

const ALLOWED_ASK_ARGV_2 = ['configure', 'deploy', 'new', 'init', 'dialog', 'smapi', 'util', 'help', '-v', '--version', '-h', '--help'];
if (process.argv[2] && ALLOWED_ASK_ARGV_2.indexOf(process.argv[2]) === -1) {
    console.log('Command not recognized. Please run "ask" to check the user instructions.');
}
