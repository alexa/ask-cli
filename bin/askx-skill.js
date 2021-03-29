#!/usr/bin/env node

require('module-alias/register');
const skillCommander = require('@src/commands/skill/skill-commander');

skillCommander.commander.parse(process.argv);

if (!process.argv.slice(2).length) {
    skillCommander.commander.outputHelp();
} else if (Object.keys(skillCommander.SKILL_COMMAND_MAP).indexOf(process.argv[2]) === -1) {
    console.error('Command not recognized. Please run "ask skill" to check the user instructions.');
    process.exit(1);
}
