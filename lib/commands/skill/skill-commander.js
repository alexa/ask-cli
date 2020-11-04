const commander = require('commander');

const SKILL_COMMAND_MAP = {
    'add-locales': '@src/commands/skill/add-locales'
};

Object.keys(SKILL_COMMAND_MAP).forEach((cmd) => {
    // eslint-disable-next-line global-require
    require(SKILL_COMMAND_MAP[cmd]).createCommand(commander);
});

commander._name = 'ask skill';
commander
    .description('increase the productivity when managing skill metadata');

module.exports = { commander, SKILL_COMMAND_MAP };
