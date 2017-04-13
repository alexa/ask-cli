'use strict';

const jsonRead = require('../utils/json-read');
const path = require('path');
const jsonfile = require('jsonfile');
const inquirer = require('inquirer');

module.exports.check = (skillInfo, callback) => {
    let projectConfigPath = path.join(process.cwd(), '.ask', 'config');
    let projectConfig = jsonRead.readFile(projectConfigPath);
    let isCloned = jsonRead.getProperty(projectConfig, '.deploy_settings.default.was_cloned');
    if (!isCloned) {
        callback();
    } else {
        let skillSchema = jsonRead.readFile(path.join(process.cwd(), 'skill.json'));
        console.log('This skill project was cloned from a pre-existing skill. Deploying this project will');
        console.log('  - Update skill metadata (skill.json)');
        let skillDefinition = jsonRead.getProperty(skillSchema,'.skillDefinition');
        if (skillInfo.hasOwnProperty('custom')) {
            if (skillDefinition.hasOwnProperty('customInteractionModelInfo')) {
                console.log('  - Update interaction model (models/*.json)');
                let customInfo = skillDefinition.customInteractionModelInfo;
                if (customInfo.hasOwnProperty('endpointsByRegion')) {
                    let endpoints = customInfo.endpointsByRegion;
                    console.log('  - Deploy the code in lambda/custom to the following Lambda function(s):');
                    Object.keys(endpoints).forEach((endpoint) => {
                        console.log('    ' + endpoint + ': ' + endpoints[endpoint].url);
                    });
                }
            }
        }
        // Add new domain options here
        if (skillInfo.hasOwnProperty('smarthome')) {
            if (skillDefinition.hasOwnProperty('smartHomeInfo')) {
                let smarthomeInfo = skillDefinition.smartHomeInfo;
                if (smarthomeInfo.hasOwnProperty('endpointsByRegion')) {
                    let endpoints = smarthomeInfo.endpointsByRegion;
                    console.log('  - Deploy the code in lambda/custom to the following Lambda function(s):');
                    Object.keys(endpoints).forEach((endpoint) => {
                        console.log('    ' + endpoint + ': ' + endpoints[endpoint].url);
                    });
                }
            }
        }
        console.log('Note: The ASK CLI supports only one code base per skill type (custom or smart home),' +
            ' and we recommend resolving localization at runtime with a single code base rather than' +
            ' maintaining a different code base per locale.\n');

        let confirm = {
            type: 'confirm',
            name: 'isAllowed',
            message: 'Do you want to proceed with the above deployments?'
        };
        inquirer.prompt(confirm).then((answers) => {
            if (answers.isAllowed) {
                projectConfig.deploy_settings.default.was_cloned = false;
                jsonfile.writeFileSync(projectConfigPath, projectConfig, {spaces: 2});
                console.log();
                callback();
            }
        });
    }
};
