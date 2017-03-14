#!/usr/bin/env node
'use strict';

const commander = require('commander');

commander.version(require('../package.json').version);
commander.usage('-> ASK Lambda sub-commands');

require('../lib/lambda/download').createCommand(commander);
require('../lib/lambda/upload').createCommand(commander);
require('../lib/lambda/log').createCommand(commander);
require('../lib/lambda/help').createCommand(commander);
commander.parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp();
} else {
    let input = process.argv[2];
    if (['download', 'upload', 'log', 'help', 'version'].indexOf(input) === -1) {
        console.log('Command not recognized. Please run "ask lambda" for help.');
    }
}
