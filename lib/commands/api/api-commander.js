const commander = require('commander');

const API_COMMAND_MAP = {
    // catalog
    'list-catalogs': '@src/commands/api/catalog/list-catalogs',
    'create-catalog': '@src/commands/api/catalog/create-catalog',
    'get-catalog': '@src/commands/api/catalog/get-catalog',
    'list-catalog-uploads': '@src/commands/api/catalog/list-catalog-uploads',
    'get-catalog-upload': '@src/commands/api/catalog/get-catalog-upload',
    'associate-catalog-with-skill': '@src/commands/api/catalog/associate-catalog-with-skill',
    'upload-catalog': '@src/commands/api/catalog/upload-catalog',

    // isp
    'create-isp': '@src/commands/api/isp/create-isp',
    'get-isp': '@src/commands/api/isp/get-isp',
    'update-isp': '@src/commands/api/isp/update-isp',
    'associate-isp': '@src/commands/api/isp/associate-isp',
    'disassociate-isp': '@src/commands/api/isp/disassociate-isp',
    'list-isp-for-vendor': '@src/commands/api/isp/list-isp-for-vendor',
    'list-isp-for-skill': '@src/commands/api/isp/list-isp-for-skill',
    'list-skills-for-isp': '@src/commands/api/isp/list-skills-for-isp',
    'delete-isp': '@src/commands/api/isp/delete-isp',
    'reset-isp-entitlement': '@src/commands/api/isp/reset-isp-entitlement',

    // skill
    'create-skill': '@src/commands/api/skill/create-skill',
    'delete-skill': '@src/commands/api/skill/delete-skill',
    'list-skills': '@src/commands/api/skill/list-skills',
    'get-skill-status': '@src/commands/api/skill/get-skill-status',

    // skill:account-linking
    'set-account-linking': '@src/commands/api/account-linking/set-account-linking',
    'get-account-linking': '@src/commands/api/account-linking/get-account-linking',
    'delete-account-linking': '@src/commands/api/account-linking/delete-account-linking',

    // skill:alexa-hosted
    'get-git-credentials': '@src/commands/api/alexa-hosted/get-git-credentials',
    'get-alexa-hosted-skill': '@src/commands/api/alexa-hosted/get-alexa-hosted-skill-metadata',
    'get-hosted-skill-permission': '@src/commands/api/alexa-hosted/get-hosted-skill-permission',

    // skill:beta-test
    'create-beta-test': '@src/commands/api/beta-test/create-beta-test',
    'update-beta-test': '@src/commands/api/beta-test/update-beta-test',
    'get-beta-test': '@src/commands/api/beta-test/get-beta-test',
    'start-beta-test': '@src/commands/api/beta-test/start-beta-test',
    'end-beta-test': '@src/commands/api/beta-test/end-beta-test',
    'list-beta-testers': '@src/commands/api/beta-test/list-beta-testers',
    'add-beta-testers': '@src/commands/api/beta-test/add-beta-testers',
    'remove-beta-testers': '@src/commands/api/beta-test/remove-beta-testers',
    'send-reminder-to-beta-testers': '@src/commands/api/beta-test/send-reminder-to-beta-testers',
    'request-feedback-from-beta-testers': '@src/commands/api/beta-test/request-feedback-from-beta-testers',

    // skill:credentials
    'get-skill-credentials': '@src/commands/api/credentials/get-skill-credentials',

    // skill:enablement
    'enable-skill': '@src/commands/api/enablement/enable-skill',
    'disable-skill': '@src/commands/api/enablement/disable-skill',
    'get-skill-enablement': '@src/commands/api/enablement/get-skill-enablement',

    // skill:evaluations
    'nlu-profile': '@src/commands/api/evaluations/nlu-profile',

    // skill:history
    'intent-requests-history': '@src/commands/api/history/intent-requests-history',

    // skill:interaction-model
    'get-interaction-model': '@src/commands/api/interaction-model/get-interaction-model',
    'head-interaction-model': '@src/commands/api/interaction-model/head-interaction-model',
    'set-interaction-model': '@src/commands/api/interaction-model/set-interaction-model',
    'list-interaction-model-versions': '@src/commands/api/interaction-model/list-interaction-model-versions',

    // skill:manifest
    'get-manifest': '@src/commands/api/manifest/get-manifest',
    'update-manifest': '@src/commands/api/manifest/update-manifest',

    // skill:private
    'add-private-distribution-account': '@src/commands/api/private/add-private-distribution-account',
    'delete-private-distribution-account': '@src/commands/api/private/delete-private-distribution-account',
    'list-private-distribution-accounts': '@src/commands/api/private/list-private-distribution-accounts',

    // skill:publishing
    submit: '@src/commands/api/publishing/submit',
    withdraw: '@src/commands/api/publishing/withdraw',
    'get-certification': '@src/commands/api/publishing/get-certification',
    'list-certifications': '@src/commands/api/publishing/list-certifications',

    // skill:test
    'simulate-skill': '@src/commands/api/test/simulate-skill',
    'get-simulation': '@src/commands/api/test/get-simulation',
    'invoke-skill': '@src/commands/api/test/invoke-skill',

    // skill:validation
    'validate-skill': '@src/commands/api/validation/validate-skill',
    'get-validation': '@src/commands/api/validation/get-validation',

    // vendor
    'list-vendors': '@src/commands/api/vendor/list-vendors',

    // task
    'get-task': '@src/commands/api/task/get-task',
    'search-task': '@src/commands/api/task/search-task'
};

Object.keys(API_COMMAND_MAP).forEach((cmd) => {
    // eslint-disable-next-line global-require
    require(API_COMMAND_MAP[cmd]).createCommand(commander);
});

commander._name = 'askx api';
commander
    .description('The api command provides a number of sub-commands that enable you to manage Alexa skills associated with your developer account.');

module.exports = { commander, API_COMMAND_MAP };
