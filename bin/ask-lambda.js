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
    const LAMBDA_COMMAND_LIST = [
        'download',
        'upload',
        'log',
        'help'
    ];
    if (LAMBDA_COMMAND_LIST.indexOf(process.argv[2]) === -1) {
        console.log('Command not recognized. Please run "ask lambda" for help.');
    }
}
