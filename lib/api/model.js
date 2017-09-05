'use strict';

const apiWrapper = require('./api-wrapper');
const tools = require('../utils/tools');
const fs = require('fs');
const profileHelper = require('../utils/profile-helper');
const jsonUtility = require('../utils/json-utility');

// Public
module.exports = {
    createCommand: (commander) => {
        buildGetModelCommand(commander);
        buildHeadModelCommand(commander);
        buildUpdateModelCommand(commander);
        buildGetModelStatusCommand(commander);
    }
};

// Private
function buildGetModelCommand(commander) {
    commander
        .command('get-model')
        .usage('<-s|--skill-id <skill-id>> <-l|--locale <locale>> [-p|--profile <profile>] [--debug]')
        .description('get an interaction model for skill')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-l, --locale <locale>', 'model locale for the skill')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        if (!options.locale) {
            console.warn('Please input required parameter: locale.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        apiWrapper.callGetModel(options.skillId, regulateLocale(options.locale), profile, options.debug, (data, eTag) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.warn('ETag: ' + eTag); // Pass Etag to stderr
                console.warn('Model:');
                console.log(JSON.stringify(response, null, 2));
            }
        });
    }
}

function buildHeadModelCommand(commander) {
    commander
        .command('head-model')
        .usage('<-s|--skill-id <skill-id>> <-l|--locale <locale>> [-p|--profile <profile>] [--debug]')
        .description('get the ETag associated with an interaction model')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-l, --locale <locale>', 'model locale for the skill')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        if (!options.locale) {
            console.warn('Please input required parameter: locale.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        apiWrapper.callHeadModel(options.skillId, regulateLocale(options.locale), profile, options.debug, (statusCode, eTag) => {
            console.log('ETag: ' + eTag);
        });
    }
}

function buildUpdateModelCommand(commander) {
    commander
        .command('update-model')
        .usage('<-s|--skill-id <skill-id>> <-l|--locale <locale>> <-f|--file <file-path>> [-e|--etag <etag>] [-p|--profile <profile>] [--debug]')
        .description('create/update the new interaction model for skill')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-l, --locale <locale>', 'model locale for the skill')
        .option('-f, --file <file-path>', 'path for model schema')
        .option('-e, --etag <etag>', 'model ETag')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        if (!options.locale) {
            console.warn('Please input required parameter: locale.');
            return;
        }
        let regulatedLocale = regulateLocale(options.locale);
        if (!options.file) {
            console.warn('Please input required parameter: file.');
            return;
        }
        if (!fs.existsSync(options.file)) {
            console.warn("Please verify model schema is in current working directory.");
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        let modelSchema = jsonUtility.read(options.file);

        apiWrapper.callUpdateModel(options.skillId, regulatedLocale, modelSchema, options.etag, profile, options.debug, () => {
            console.log('Model for ' + regulatedLocale + ' submitted.');
            console.log('Please run the following command to track the model build status:' +
                '\n    ask api get-model-status -s ' + options.skillId + ' -l ' + regulatedLocale);
        });
    }
}

function buildGetModelStatusCommand(commander) {
    commander
        .command('get-model-status')
        .usage('<-s|--skill-id <skill-id>> <-l|--locale <locale>> [-p|--profile <profile>] [--debug]')
        .description('get the model build status of an interaction model')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-l, --locale <locale>', 'model locale for the skill')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        if (!options.locale) {
            console.warn('Please input required parameter: locale.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        apiWrapper.callGetModelStatus(options.skillId, regulateLocale(options.locale), profile, options.debug, (data, body) => {
            if (data !== 404) {
                let response = tools.convertDataToJsonObject(data);
                if (response) {
                    console.log('Model build status: ' + response.status);
                }
            } else {
                console.error('Call get-model-status error.\nError code: 404');
                let errorMessage = tools.convertDataToJsonObject(body);
                if (errorMessage) {
                    console.error(errorMessage);
                }
            }
        });
    }
}

function regulateLocale(locale) {
    let dashIndex = locale.indexOf('-');
    let dashLeft = locale.substr(0, dashIndex).toLowerCase();
    let dashRight = locale.substr(dashIndex).toUpperCase();
    return dashLeft + dashRight;
}
