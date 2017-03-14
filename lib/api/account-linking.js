'use strict';

const apiWrapper = require('./api-wrapper');
const tools = require('../utils/tools');
const inquirer = require('inquirer');

// Public
module.exports = {
    createCommand: (commander) => {
        buildCreateAccountLinkingCommand(commander);
        buildGetAccountLinkingCommand(commander);
    }
};

// Private
function buildCreateAccountLinkingCommand(commander) {
    commander
        .command('create-account-linking')
        .description('create account linking')
        .option('-s|--skill-id <skill-id>', 'skill-id for the skill')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required option: skill-id.');
            return;
        }
        let accountLinking = {};
        collectAccountLinkingAnswers(accountLinking, (accountLinking) => {
            apiWrapper.callCreateAccountLinking(options.skillId, accountLinking, () => {
                console.log('Account Linking created successfully.');
            });
        });
    }
}

function buildGetAccountLinkingCommand(commander) {
    commander
        .command('get-account-linking')
        .description('get account linking')
        .option('-s|--skill-id <skill-id>', 'skill-id for the skill')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required option: skill-id.');
            return;
        }
        apiWrapper.callGetAccountLinking(options.skillId, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (!response) {
                console.log(JSON.stringify(response, null, 2));
            }
        });
    }
}

function collectAccountLinkingAnswers(accountLinking, callback) {
    let question1 = [
        {
            type: 'input',
            name: 'authorizationUrl',
            message: 'Authorization URL: '
        },
        {
            type: 'input',
            name: 'clientId',
            message: 'Client ID: '
        },
        {
            type: 'input',
            name: 'scopes',
            message: 'Scopes(separate by comma): '
        },
        {
            type: 'input',
            name: 'domains',
            message: 'Domains(separate by comma): '
        }
    ];
    inquirer.prompt(question1).then((answers) => {
        accountLinking.authorizationUrl = answers.authorizationUrl;
        accountLinking.clientId = answers.clientId;
        accountLinking.scopes = answers.scopes.split(',').map((scope) => {
            return scope.trim();
        });
        accountLinking.domains = answers.domains.split(',').map((domain) => {
            return domain.trim();
        });
        let question2 = {
            type: 'list',
            name: 'type',
            message: 'Authorization Grant Type: ',
            choices: [
                'AUTH_CODE',
                'IMPLICIT'
            ]
        };
        inquirer.prompt(question2).then((answers) => {
            accountLinking.type = answers.type;
            if (answers.type !== 'AUTH_CODE') {
                callback(accountLinking);
            } else {
                let question3 = [
                    {
                        type: 'input',
                        name: 'accessTokenUrl',
                        message: 'Access Token URI: '
                    },
                    {
                        type: 'password',
                        name: 'clientSecret',
                        message: 'Client Secret: '
                    },
                    {
                        type: 'list',
                        name: 'accessTokenScheme',
                        message: 'Client Authentication Scheme: ',
                        choices: [
                            'HTTP_BASIC',
                            'REQUEST_BODY_CREDENTIALS'
                        ]
                    }
                ];
                inquirer.prompt(question3).then((answers) => {
                    accountLinking.accessTokenUrl = answers.accessTokenUrl;
                    accountLinking.clientSecret = answers.clientSecret;
                    accountLinking.accessTokenScheme = answers.accessTokenScheme;
                    callback(accountLinking);
                });
            }
        });
    });
}
