const commander = require('commander');

const UTIL_COMMAND_MAP = {
    'upgrade-to-v2': '@src/commands/util/upgrade-to-v2'
};

Object.keys(UTIL_COMMAND_MAP).forEach((cmd) => {
    // eslint-disable-next-line global-require
    require(UTIL_COMMAND_MAP[cmd]).createCommand(commander);
});

commander._name = 'askx util';
commander
    .description('tooling functions when using ask-cli to manage Alexa Skill');

module.exports = { commander, UTIL_COMMAND_MAP };
