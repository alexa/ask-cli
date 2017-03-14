#!/usr/bin/env node
'use strict';

const commander = require('commander');

commander.version(require('../package.json').version);
commander.usage('-> Command line tools for Alexa Skill Management API Service');

require('../lib/init/init').createCommand(commander);
require('../lib/deploy/deploy').createCommand(commander);
require('../lib/new/new').createCommand(commander);
require('../lib/clone/clone').createCommand(commander);

commander
    .command('lambda', 'ASK Lambda commands')
    .command('api', 'ASK Skill Management API commands')
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp();
} else {
    let input = process.argv[2];
    if (['lambda', 'api', 'init', 'deploy', 'new', 'clone', 'help', 'version']
        .indexOf(input) === -1) {
        console.log('Command not recognized. Please run "ask" for help.');
    }
}
