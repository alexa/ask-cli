#!/usr/bin/env node
'use strict';

const commander = require('commander');

require('../lib/api/model').createCommand(commander);
require('../lib/api/skill').createCommand(commander);
require('../lib/api/vendor').createCommand(commander);
require('../lib/api/account-linking').createCommand(commander);
require('../lib/api/submission').createCommand(commander);
require('../lib/api/skill-testing').createCommand(commander);

commander
    .usage('\n\n  $ ask api [options] [command]')
    .description('The api command provides a number of subcommands that enable you to create and modify skills associated with your developer account. There are subcommands for creating and updating the skill, interaction model, and account linking information as well as starting the skill certification process.')
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp();
} else {
    const API_COMMAND_LIST = [
        'simulate-skill',
        'get-simulation',
        'invoke-skill',
        'create-skill',
        'get-skill',
        'update-skill',
        'get-model',
        'head-model',
        'update-model',
        'get-model-status',
        'get-skill-status',
        'create-account-linking',
        'get-account-linking',
        'list-skills',
        'list-vendors',
        'submit',
        'withdraw'
    ];
    if (API_COMMAND_LIST.indexOf(process.argv[2]) === -1) {
        console.log('Command not recognized. Please run "ask api" for help.');
    }
}
