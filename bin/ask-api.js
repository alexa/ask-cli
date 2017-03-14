#!/usr/bin/env node
'use strict';

const commander = require('commander');

commander.version(require('../package.json').version);
commander.usage('-> ASK Skill Management API sub-commands');

require('../lib/api/model').createCommand(commander);
require('../lib/api/skill').createCommand(commander);
require('../lib/api/vendor').createCommand(commander);
require('../lib/api/account-linking').createCommand(commander);
commander.parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp();
} else {
    let input = process.argv[2];
    if (['create-skill', 'get-skill', 'update-skill', 'get-model', 'head-model',
        'update-model', 'get-build-status', 'create-account-linking',
        'get-account-linking', 'list-vendors'].indexOf(input) === -1) {
        console.log('Command not recognized. Please run "ask api" for help.');
    }
}
