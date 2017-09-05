'use strict';

const apiWrapper = require('./api-wrapper');
const tools = require('../utils/tools');
const fs = require('fs');
const profileHelper = require('../utils/profile-helper');
const jsonRead = require('../utils/json-read.js');
const Spinner = require('cli-spinner').Spinner;

// Public
module.exports = {
    createCommand: (commander) => {
        buildSimulateSkillCommand(commander);
        buildGetSimulationCommand(commander);
        buildInvokeSkillCommand(commander);
    }
};

//Private
function buildInvokeSkillCommand(commander) {
    commander
        .command('invoke-skill')
        .usage('<-s|--skill-id <skill-id>> <[-f|--file <file>] | [-j|--json <json>]> [-e|--endpoint-region <endpoint-region>] [-p|--profile <profile>] [--debug]')
        .description('invoke a skill')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-f, --file <file>', 'json file path')
        .option('-j, --json <json>', 'json string')
        .option('-e, --endpoint-region <endpoint-region>', 'endpoint-region for the skill')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.json && !options.file) {
            console.warn('Please input required parameter: file | json');
            return;
        }

        if (options.json && options.file) {
            console.warn('Both file and json parameters are specified. Please indicate which parameter you want.');
            return;
        }

        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id');
            return;
        }

        if (options.file && !fs.existsSync(options.file)) {
            console.warn('Please verify the file exists');
            return;
        }

        if (!options.endpointRegion) {
            console.warn('Please input required parameter: endpoint-region');
            return;
        }

        let inputJsonObject = options.json ? jsonRead.readString(options.json) : null;
        if (!inputJsonObject && !options.file) {
            console.warn('Please retry with correct json input');
            return;
        }

        let profile = profileHelper.runtimeProfile(options.profile);
        let listenSpinner = new Spinner({text: 'Waiting for response...', stream: process.stderr});
        listenSpinner.setSpinnerString('win32' === process.platform ? '|/-\\' : '◜◠◝◞◡◟');
        listenSpinner.start();
        apiWrapper.callInvokeSkill(options.file, inputJsonObject, options.skillId, options.endpointRegion, profile, options.debug, (data) => {
            listenSpinner.stop();
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log(JSON.stringify(response, null, 2));
            }
        });
    }
}

//Private
function buildGetSimulationCommand(commander) {
    commander
        .command('get-simulation')
        .usage('<-i|--simulation-id <simulation-id>> <-s|--skill-id <skill-id>> [-p|--profile <profile>] [--debug]')
        .description('get simulation result')
        .option('-i, --simulation-id <simulation-id>', 'simulation-id for the simulation')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.simulationId) {
            console.warn('Please input required parameter: simulation-id');
            return;
        }

        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id');
            return;
        }

        let profile = profileHelper.runtimeProfile(options.profile);
        apiWrapper.callGetSimulation(options.simulationId, options.skillId, profile, options.debug, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log(JSON.stringify(response, null, 2));
            }
        });
    }
}

// Private
function buildSimulateSkillCommand(commander) {
    commander
        .command('simulate-skill')
        .usage('<-s|--skill-id <skill-id>> <[-f|--file <file>] | [-t|--textn <json>]> [-l|--locale <locale>] [-p|--profile <profile>] [--debug]')
        .description('simulate a skill')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-f, --file <file-path>', 'path for simulate input file')
        .option('-t, --text <text>', 'text for utterance text')
        .option('-l, --locale <locale>', 'locale for the utterance text')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.file && !options.text) {
            console.warn('Please input required parameter: file | text');
            return;
        }

        if (options.file && options.text) {
            console.warn('Both file and text parameters are specified. Please indicate which parameter you want.');
            return;
        }

        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id');
            return;
        }

        if (!options.locale && !process.env.ASK_DEFAULT_DEVICE_LOCALE) {
            console.warn('Please specify device locale via command line parameter locale or environment variable - ASK_DEFAULT_DEVICE_LOCALE');
            return;
        }

        if (options.file && !fs.existsSync(options.file)) {
            console.warn('Please verify the file exists');
            return;
        }

        let profile = profileHelper.runtimeProfile(options.profile);
        let locale = options.locale || process.env.ASK_DEFAULT_DEVICE_LOCALE;

        apiWrapper.callSimulateSkill(options.file, options.text, options.skillId, locale, profile, options.debug, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log(JSON.stringify(response, null, 2));
            }
        });
    }
}
