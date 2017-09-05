#!/usr/bin/env node
'use strict';

const commander = require('commander');

require('../lib/lambda/download').createCommand(commander);
require('../lib/lambda/upload').createCommand(commander);
require('../lib/lambda/log').createCommand(commander);

commander
    .usage('\n\n  $ ask lambda [options] [command]')
    .description('The Lambda command enables you to retrieve and post code for an AWS Lambda function.')
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp();
} else {
    const LAMBDA_COMMAND_LIST = [
        'download',
        'upload',
        'log'
    ];
    if (LAMBDA_COMMAND_LIST.indexOf(process.argv[2]) === -1) {
        console.log('Command not recognized. Please run "ask lambda" for help.');
    }
}
