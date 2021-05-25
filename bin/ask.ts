#!/usr/bin/env node
/* eslint-disable import/first */

import 'module-alias/register';

import semver from 'semver';

if (!semver.gte(process.version, '8.3.0')) {
    console.log('Version of node.js doesn\'t meet minimum requirement.');
    console.log('Please ensure system has node.js version 8.3.0 or higher.');
    process.exit(1);
}

import commander from 'commander';
import { version } from '@root/package.json';

import ConfigureCommand from '@src/commands/configure';
import DeployCommand from '@src/commands/deploy';
import NewCommand from '@src/commands/new';
import InitCommand from '@src/commands/init';
import DialogCommand from '@src/commands/dialog';
import RunCommand from '@src/commands/run';

ConfigureCommand.createCommand(commander);
DeployCommand.createCommand(commander);
NewCommand.createCommand(commander);
InitCommand.createCommand(commander);
DialogCommand.createCommand(commander);
RunCommand.createCommand(commander);

commander
    .description('Command Line Interface for Alexa Skill Kit')
    .command('smapi', 'list of Alexa Skill Management API commands')
    .command('skill', 'increase the productivity when managing skill metadata')
    .command('util', 'tooling functions when using ask-cli to manage Alexa Skill')
    .version(version)
    .parse(process.argv);

const ALLOWED_ASK_ARGV_2 = ['configure', 'deploy', 'new', 'init', 'dialog', 'smapi', 'skill', 'util', 'help', '-v',
    '--version', '-h', '--help', 'run'];
if (process.argv[2] && ALLOWED_ASK_ARGV_2.indexOf(process.argv[2]) === -1) {
    console.log('Command not recognized. Please run "ask" to check the user instructions.');
    process.exit(1);
}
