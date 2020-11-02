#!/usr/bin/env node

require('module-alias/register');
const commander = require('commander');
const { makeAutoCompleteCommander } = require('@src/commands/autocomplete');
const { makeSmapiCommander } = require('@src/commands/smapi/smapi-commander');
const ConfigureCommander = require('@src/commands/configure');
const DeployCommander = require('@src/commands/deploy');
const DialogCommander = require('@src/commands/dialog');
const InitCommander = require('@src/commands/init');
const NewCommander = require('@src/commands/new');
const UtilCommander = require('@src/commands/util/util-commander');

const smapiCommander = makeSmapiCommander();
const utilCommander = UtilCommander.commander;
const configureCommander = ConfigureCommander.createCommand(commander);
const deployCommander = DeployCommander.createCommand(commander);
const newCommander = NewCommander.createCommand(commander);
const initCommander = InitCommander.createCommand(commander);
const dialogCommander = DialogCommander.createCommand(commander);
const commanders = [smapiCommander, utilCommander, configureCommander, deployCommander, newCommander, initCommander, dialogCommander];

const autoCompleteCommander = makeAutoCompleteCommander(commanders);

if (!process.argv.slice(2).length) {
    autoCompleteCommander.outputHelp();
} else {
    autoCompleteCommander.parse(process.argv);
}
