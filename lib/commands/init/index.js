const CONSTANTS = require('@src/utils/constants');
const handler = require('./handler');

module.exports = {
    createCommand: (commander) => {
        commander
            .command('init')
            .description('initialize the ask-cli with your Amazon developer account credentials')
            .option('-l, --list-profiles', 'list all the profiles for ask-cli')
            .option('--no-browser', 'display authorization URL instead of opening browser')
            .option('-p, --profile <profile>', 'name for the profile to be created/updated')
            .option('--debug', 'ask cli debug mode')
            .option('-h, --help', 'output usage information', () => {
                console.log(CONSTANTS.COMMAND.INIT.HELP_DESCRIPTION);
                process.exit(0);
            })
            .action(handler.handleOptions);
    }
};
