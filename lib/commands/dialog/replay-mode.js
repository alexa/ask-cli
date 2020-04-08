const chalk = require('chalk');
const { Readable } = require('stream');

const DialogController = require('@src/controllers/dialog-controller');
const DialogReplView = require('@src/view/dialog-repl-view');
const InteractiveMode = require('./interactive-mode');

module.exports = class ReplayMode extends DialogController {
    constructor(config) {
        super(config);
        this.config = config;
        this.userInputs = config.userInputs;
        this.replay = config.replay;
    }

    start(callback) {
        const replayInputStream = new Readable({ read() {} });
        let replayReplView;
        try {
            replayReplView = new DialogReplView({
                prompt: chalk.yellow.bold('User  > '),
                header: this._getHeader(),
                footer: 'Goodbye!',
                inputStream: replayInputStream,
                evalFunc: (replayInput, replayCallback) => {
                    this._evaluateInput(replayInput, replayReplView, replayInputStream, replayCallback, callback);
                }
            });
        } catch (error) {
            return callback(error);
        }

        this.setupSpecialCommands(replayReplView, (error) => {
            if (error) {
                return callback(error);
            }
        });
        replayInputStream.push(`${this.userInputs.shift()}\n`, 'utf8');
    }

    _getHeader() {
        return 'Welcome to ASK Dialog\n'
        + `Replaying a multi turn conversation with Alexa from ${this.replay}\n`
        + 'Alexa will then evaluate your input and give a response!';
    }

    _evaluateInput(replayInput, replayReplView, replayInputStream, replayCallback, callback) {
        this.evaluateUtterance(replayInput, replayReplView, () => {
            if (this.userInputs.length > 0) {
                replayCallback();
                replayInputStream.push(`${this.userInputs.shift()}\n`, 'utf8');
            } else {
                replayReplView.clearSpecialCommands();
                replayReplView.close();
                this.config.header = 'Switching to interactive dialog.\n'
                + 'To automatically quit after replay, append \'.quit\' to the userInput of your replay file.\n';
                this.config.newSession = false;
                const interactiveReplView = new InteractiveMode(this.config);
                interactiveReplView.start(callback);
            }
        });
    }
};
