'use strict';

module.exports = {
    createCommand: (commander) => {
        commander
            .command('help')
            .description('display instructions of usage')
            .action(() => {
                commander.outputHelp();
            });
    }
};
