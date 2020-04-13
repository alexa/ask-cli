#!/usr/bin/env node

require('module-alias/register');
const utilCommander = require('@src/commands/util/util-commander');

utilCommander.commander.parse(process.argv);

if (!process.argv.slice(2).length) {
    utilCommander.commander.outputHelp();
} else if (Object.keys(utilCommander.UTIL_COMMAND_MAP).indexOf(process.argv[2]) === -1) {
    console.error('Command not recognized. Please run "ask util" to check the user instructions.');
}
