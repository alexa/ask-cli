#!/usr/bin/env node
'use strict';

if (!require('semver').gte(process.version, '4.0.0')) {
    console.log("Version of node.js doesn't meet minimum requirement.");
    console.log('Please ensure system has node.js version 4.0.0 or higher.');
    return;
}

var commander = require('commander');

require('../lib/init/init').createCommand(commander);
require('../lib/deploy/deploy').createCommand(commander);
require('../lib/new/new').createCommand(commander);
require('../lib/clone/clone').createCommand(commander);
require('../lib/simulate/simulate').createCommand(commander);

commander
    .description('Command Line Interface for Alexa Skill Management API')
    .command('lambda', 'list of AWS Lambda commands')
    .command('api', 'list of Alexa Skill Management API commands')
    .option('-v, --version', 'output the version number of ask-cli', function() {
        console.log(require('../package.json').version);
        process.exit(0);
    })
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp();
} else {
    if (['simulate', 'lambda', 'api', 'init', 'deploy', 'new', 'clone', 'help']
        .indexOf(process.argv[2]) === -1) {
        console.log('Command not recognized. Please run "ask" for help.');
    }
}
