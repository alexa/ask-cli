'use strict';

const apiWrapper = require('./api-wrapper');
const tools = require('../utils/tools');
const fs = require('fs');

// Public
module.exports = {
    createCommand: (commander) => {
        buildGetModelCommand(commander);
        buildHeadModelCommand(commander);
        buildUpdateModelCommand(commander);
        buildGetBuildStatusCommand(commander);
    }
};

// Private
function buildGetModelCommand(commander) {
    commander
        .command('get-model')
        .description('update model schema for the skill')
        .option('-s|--skill-id <skill-id>', 'skill-id for the skill')
        .option('-l|--locale <locale>', 'model locale for the skill')
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
        apiWrapper.callGetModel(options.skillId, regulateLocale(options.locale), (data, eTag) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.warn('ETag: ' + eTag); // Pass Etag to stderr
                console.log(JSON.stringify(response, null, 2));
            }
        });
    }
}

function buildHeadModelCommand(commander) {
    commander
        .command('head-model')
        .description('get eTag for the specified model')
        .option('-s|--skill-id <skill-id>', 'skill-id for the skill')
        .option('-l|--locale <locale>', 'model locale for the skill')
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
        apiWrapper.callHeadModel(options.skillId, regulateLocale(options.locale), (data, eTag) => {
            console.log('Etag: ' + eTag);
        });
    }
}

function buildUpdateModelCommand(commander) {
    commander
        .command('update-model')
        .description('update model schema for the skill')
        .option('-s|--skill-id <skill-id>', 'skill-id for the skill')
        .option('-l|--locale <locale>', 'model locale for the skill')
        .option('-f||--file <file-path>', 'path for model schema')
        .option('-e|--etag <etag>', 'model ETag')
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
        apiWrapper.callUpdateModel(options.skillId, regulatedLocale, options.file, options.etag, () => {
            console.log('Model for ' + regulatedLocale + ' submitted.');
            console.log('Please run the following command to track the build status:' +
                '\n    ask api get-build-status -s ' + options.skillId + ' -l ' + regulatedLocale);
        });
    }
}

function buildGetBuildStatusCommand(commander) {
    commander
        .command('get-build-status')
        .description('return the build status for model')
        .option('-s|--skill-id <skill-id>', 'skill-id for the skill')
        .option('-l|--locale <locale>', 'model locale for the skill')
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
        apiWrapper.callGetBuildStatus(options.skillId, regulateLocale(options.locale), (data, body) => {
            if (data !== 404) {
                let response = tools.convertDataToJsonObject(data);
                if (response) {
                    console.log('Model build status: ' + response.status);
                }
            } else {
                console.error('Call get-build-status error.\nError code: 404');
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
    let dashLeft = locale.substring(0, dashIndex).toLowerCase();
    let dashRight = locale.substring(dashIndex).toUpperCase();
    return dashLeft + dashRight;
}
