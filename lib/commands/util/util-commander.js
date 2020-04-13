const commander = require('commander');

const UTIL_COMMAND_MAP = {
    'upgrade-project': '@src/commands/util/upgrade-project',
    'git-credentials-helper': '@src/commands/util/git-credentials-helper',
    'generate-lwa-tokens': '@src/commands/util/generate-lwa-tokens'
};

Object.keys(UTIL_COMMAND_MAP).forEach((cmd) => {
    // eslint-disable-next-line global-require
    require(UTIL_COMMAND_MAP[cmd]).createCommand(commander);
});

commander._name = 'ask util';
commander
    .description('tooling functions when using ask-cli to manage Alexa Skill');

module.exports = { commander, UTIL_COMMAND_MAP };
