#!/usr/bin/env node

require('module-alias/register');
const apiCommander = require('@src/commands/api/api-commander');

apiCommander.commander.parse(process.argv);

if (!process.argv.slice(2).length) {
    apiCommander.commander.outputHelp();
} else {
    if (Object.keys(apiCommander.API_COMMAND_MAP).indexOf(process.argv[2]) === -1) {
        console.error('Command not recognized. Please run "ask api" to check the user instructions.');
    }
}
