'use strict';

const apiWrapper = require('../api/api-wrapper.js');
const jsonUtility = require('../utils/json-utility');
const profileHelper = require('../utils/profile-helper');
const path = require('path');
const fs = require('fs');
const tools = require('../utils/tools');
const Spinner = require('cli-spinner').Spinner;
const POLLING_INTERVAL = 1000;

// Public
module.exports = {
    createCommand: (commander) => {
        commander
            .command('simulate')
            .usage('<[-f|--file <file-path>] | [-t|--text <text>]> [-l|--locale <locale>] [-s|--skill-id <skill-id>] [-p|--profile <profile>] [--debug]')
            .description('simulate a user using your skill')
            .option('-f, --file <file-path>', 'path for simulate input file')
            .option('-t, --text <text>', 'text for utterance text')
            .option('-l, --locale <locale>', 'locale for the utterance text')
            .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
            .option('-p, --profile <profile>', 'ask cli profile')
            .option('--debug', 'ask cli debug mode')
            .action(handle);

        function handle(options) {
            let skillId = options.skillId;

            if (!options.file && !options.text) {
                console.warn('Please input required parameter: file | text');
                return;
            }

            if (options.file && options.text) {
                console.warn('Both file and text parameters are specified. Please indicate which parameter you want.');
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
            let dataCallback = function(data) {
                let response = tools.convertDataToJsonObject(data);
                if (response) {
                    console.log(JSON.stringify(response, null, 2));
                }
            };

            if (!skillId) {
                let projectConfigFile = path.join(process.cwd(), '.ask', 'config');
                if (!fs.existsSync(projectConfigFile)) {
                    console.warn('Failed to simulate. ' +
                        'Please run this command under the root of the skill project or explictly specify the skill id via skill-id option ');
                    return;
                } else {
                    let askConfig = jsonUtility.read(projectConfigFile);
                    skillId = jsonUtility.getPropertyFromJsonObject(askConfig, ['deploy_settings', profile, 'skill_id']);
                    if (!skillId) {
                        console.warn('Failed to simulate. ' +
                        'The skill that you are trying to simulate has not been created or cloned. ' +
                        'If this is a new skill, please try creating and deploying the skill in your project first. ' +
                        'If this is an existing skill, please try cloning the skill in your project first. ' +
                        'Or you can try expliclty specifying the skill id via skill-id option.');
                        return;
                    }
                }
            }

            let listenSpinner = new Spinner({text: 'Waiting for simulation response', stream: process.stderr});
            listenSpinner.setSpinnerString('win32' === process.platform ? '|/-\\' : '◜◠◝◞◡◟');
            let simulationId = null;

            let syncCallback = (data) => {
                let response = tools.convertDataToJsonObject(data);
                if (!response.hasOwnProperty('status')) {
                    listenSpinner.stop();
                    console.error('𐄂 Simulation failed because the simulation with id ' + simulationId + ' has expired its time-to-live');
                } else if (response.status === 'IN_PROGRESS') {
                    setTimeout(() => {
                        apiWrapper.callGetSimulation(simulationId, skillId, profile, options.debug, syncCallback);
                    }, POLLING_INTERVAL);
                } else {
                    listenSpinner.stop();
                    dataCallback(data);
                }
            };

            apiWrapper.callSimulateSkill(options.file, options.text, skillId, locale, profile, options.debug, (data) => {
                let response = tools.convertDataToJsonObject(data);
                 if (response) {
                     simulationId = response.id;
                     console.error('✓ Simulation created for simulation id: ' + simulationId);
                     listenSpinner.start();
                     syncCallback(data);
                 }
            });
        }
    }
};
