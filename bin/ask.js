#!/usr/bin/env node
'use strict';

if (!require('semver').gte(process.version, '4.0.0')) {
    console.log("Version of node.js doesn't meet minimum requirement.");
    console.log('Please ensure system has node.js version 4.0.0 or higher.');
    return;
}

var commander = require('commander');

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
    if (['lambda', 'api', 'init', 'deploy', 'new', 'clone', 'help', 'version']
        .indexOf(process.argv[2]) === -1) {
        console.log('Command not recognized. Please run "ask" for help.');
    }
}
