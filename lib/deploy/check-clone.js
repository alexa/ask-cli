'use strict';

const jsonRead = require('../utils/json-read');
const domainRegistry = require('../utils/domain-registry');
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
        let skillDefinition = jsonRead.getProperty(skillSchema,'.skillDefinition');
        console.log('This skill project was cloned from a pre-existing skill. Deploying this project will');
        console.log('  - Update skill metadata (skill.json)');

        Object.keys(skillInfo).forEach((domain) => {
            if (domain === 'custom') {
                console.log('  - Update interaction model (models/*.json)');
            }
            let domainInfo = skillDefinition[domainRegistry.getSkillSchemaKey(domain)];
            if (domainInfo.hasOwnProperty('endpointsByRegion')) {
                let endpoints = domainInfo.endpointsByRegion;
                console.log('  - Deploy the following Lambda function(s) in /lambda/' + domain + ':');
                Object.keys(endpoints).forEach((endpoint) => {
                    console.log('    ' + endpoint + ': ' + endpoints[endpoint].url);
                });
            }
        });

        console.log('Note: The ASK CLI supports only one code base per skill type, ' +
            'and we recommend resolving localization at runtime with a single code base ' +
            'rather than maintaining a different code base per locale.\n');

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
