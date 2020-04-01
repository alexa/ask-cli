const chalk = require('chalk');

const DialogReplView = require('@src/view/dialog-repl-view');
const DialogController = require('@src/controllers/dialog-controller');

const SPECIAL_COMMANDS_HEADER = 'Use ".record <fileName>" or ".record <fileName> --append-quit" to save list of utterances to a file.\n'
+ 'You can exit the interactive mode by entering ".quit" or "ctrl + c".';
module.exports = class InteractiveMode extends DialogController {
    constructor(config) {
        super(config);
        this.header = config.header || 'Welcome to ASK Dialog\n'
        + 'In interactive mode, type your utterance text onto the console and hit enter\n'
        + 'Alexa will then evaluate your input and give a response!\n';
    }

    start(callback) {
        let interactiveReplView;
        try {
            interactiveReplView = new DialogReplView({
                prompt: chalk.yellow.bold('User  > '),
                header: this.header + SPECIAL_COMMANDS_HEADER,
                footer: 'Goodbye!',
                evalFunc: (input, replCallback) => {
                    this.evaluateUtterance(input, interactiveReplView, replCallback);
                },
            });
        } catch (error) {
            return callback(error);
        }

        this.setupSpecialCommands(interactiveReplView, (error) => {
            if (error) {
                return callback(error);
            }
        });
    }
};
