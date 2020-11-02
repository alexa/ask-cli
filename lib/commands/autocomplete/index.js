const commander = require('commander');
const omelette = require('omelette');
const Messenger = require('@src/view/messenger');
const Helper = require('./helper');

/**
 * Initializes auto complete inside of the program
 */
const initAutoComplete = () => {
    const helper = new Helper(omelette);
    helper.initAutoComplete();
};
/**
 * Creates auto complete commander
 * @param {*} commanders list of commanders used for creating an autocomplete hints file
 */
const makeAutoCompleteCommander = commanders => {
    const program = new commander.Command();
    commanders.push(program);

    const helper = new Helper(omelette, commanders);

    program._name = 'autocomplete';
    program.description('sets up ask cli terminal auto completion');

    program.command('setup')
        .description('set up auto completion')
        .action(() => {
            helper.setUpAutoComplete();
            Messenger.getInstance().info('Successfully set up auto completion. Please, reload the terminal.');
        });

    program.command('cleanup')
        .description('clean up auto completion')
        .action(() => {
            helper.cleanUpAutoComplete();
            Messenger.getInstance().info('Successfully removed auto completion. Please, reload the terminal.');
        });

    program.command('reload')
        .description('regenerates hints file')
        .action(() => {
            helper.reloadAutoCompleteHints();
            Messenger.getInstance().info('Successfully regenerated the hints file.');
        });

    return program;
};

module.exports = { initAutoComplete, makeAutoCompleteCommander };
