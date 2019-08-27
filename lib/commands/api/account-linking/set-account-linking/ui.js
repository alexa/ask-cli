const R = require('ramda');
const inquirer = require('inquirer');
const questions = require('./questions');

module.exports = {
    buildQuestionGroups,
    collectAccountLinkingAnswersByGroups
};

function buildQuestionGroups(manifest, callback) {
    const group1 = [
        questions.REQUEST_AUTHORIZATION_URL,
        questions.REQUEST_CLIENT_ID,
        questions.REQUEST_SCOPES,
        questions.REQUEST_DOMAINS
    ];

    const domainList = R.keys(R.view(R.lensPath(['manifest', 'apis']), manifest));
    if (domainList && domainList.indexOf('smartHome') === -1
        && domainList.indexOf('video') === -1
        && domainList.indexOf('flashBriefing') === -1) {
        group1.unshift(
            questions.CONFIRM_SKIP_ON_ENABLEMENT
        );
    }

    const group2 = questions.SELECT_AUTHORIZATION_GRANT_TYPE;

    const group3 = [
        questions.REQUEST_ACCESS_TOKEN_URL,
        questions.REQUEST_CLIENT_SECRET,
        questions.SELECT_ACCESS_TOKEN_SCHEME,
        questions.REQUEST_DEFAULT_TOKEN_EXPIRATION_IN_SECONDS
    ];

    callback({
        group1,
        group2,
        group3
    });
}

function collectAccountLinkingAnswersByGroups(groups, callback) {
    const accountLinking = {};
    // group 1
    inquirer.prompt(groups.group1).then((firstAnswers) => {
        accountLinking.authorizationUrl = firstAnswers.authorizationUrl;
        accountLinking.clientId = firstAnswers.clientId;
        accountLinking.skipOnEnablement = firstAnswers.skipOnEnablement;

        const tempScopes = firstAnswers.scopes.split(',')
            .map(scope => scope.trim())
            .filter(item => item);
        accountLinking.scopes = tempScopes.length ? tempScopes : null;

        const tempDomains = firstAnswers.domains.split(',')
            .map(domain => domain.trim())
            .filter(item => item);
        accountLinking.domains = tempDomains.length ? tempDomains : null;
        // group 2
        inquirer.prompt(groups.group2).then((secondAnswers) => {
            accountLinking.type = secondAnswers.type;
            if (secondAnswers.type !== 'AUTH_CODE') {
                return callback(accountLinking);
            }
            // group 3
            inquirer.prompt(groups.group3).then((thirdAnswers) => {
                accountLinking.accessTokenUrl = thirdAnswers.accessTokenUrl;
                accountLinking.clientSecret = thirdAnswers.clientSecret;
                accountLinking.accessTokenScheme = thirdAnswers.accessTokenScheme;
                if (thirdAnswers.defaultTokenExpirationInSeconds) {
                    accountLinking.defaultTokenExpirationInSeconds = parseInt(thirdAnswers.defaultTokenExpirationInSeconds, 10);
                }
                callback(accountLinking);
            });
        });
    });
}
