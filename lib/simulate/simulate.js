'use strict';
 
 const apiWrapper = require('../api/api-wrapper.js');
 const path = require('path');
 const fs = require('fs');
 const tools = require('../utils/tools');
 const Spinner = require('clui').Spinner;
 const POLLING_INTERVAL = 1000;
 
 // Public
 module.exports = {
     createCommand: (commander) => {
         commander
             .command('simulate')
             .description('a high level command for doing a skill simulation')
             .option('-f, --file <file-path>', 'path for simulate input file')
             .option('-t, --text <text>', 'text for utterance text')
             .option('-l, --locale <locale>', 'locale for the utterance text')
             .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
             .action(handle);
 
         function handle(options) {
             let skillId = options.skillId;
             if (!options.skillId) {
                console.warn('Please input required parameter: skill-id');
                return;
             }
 
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
 
             let locale = options.locale || process.env.ASK_DEFAULT_DEVICE_LOCALE;
             let dataCallback = function(data) {
                 let response = tools.convertDataToJsonObject(data);
                 if (response) {
                     console.log(JSON.stringify(response, null, 2));
                 }
             };
 
             let listenSpinner = new Spinner('Waiting for simulation response');
             let simulationId = null;
 
             let syncCallback = (data) => {
                 let response = tools.convertDataToJsonObject(data);
                 if (!response.hasOwnProperty('status')) {
                     listenSpinner.stop();
                     console.log('𐄂 Simulation failed because the simulation with id ' + simulationId + ' has expired its time-to-live');
                 } else if (response.status === 'IN_PROGRESS') {
                     setTimeout(() => {apiWrapper.callGetSimulation(simulationId, skillId, syncCallback);}, POLLING_INTERVAL);
                 } else {
                     listenSpinner.stop();
                     dataCallback(data);
                 }
             };
 
             apiWrapper.callSimulateSkill(options.file, options.text, skillId, locale, (data) => {
                 let response = tools.convertDataToJsonObject(data);
                  if (response) {
                      simulationId = response.id;
                      console.log('✓ Simulation created for simulation id: ' + simulationId);
                      listenSpinner.start();
                      syncCallback(data);
                  }
             });
         }
     }
 };