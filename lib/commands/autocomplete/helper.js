const fs = require('fs-extra');

const CONSTANTS = require('@src/utils/constants');

module.exports = class Helper {
    constructor(omelette, commanders = []) {
        this.commanders = commanders;
        this.completion = omelette('ask <command> <subCommand>');
        this.autoCompleteHintsFile = 'autocomplete-hints.json';
    }

    _getAutoCompleteOptions() {
        const options = {};
        this.commanders.forEach(com => {
            options[com.name()] = {};
            com.commands.forEach(sumCom => {
                options[com.name()][sumCom.name()] = {};
            });
        });

        return options;
    }

    _parseArguments(line) {
        const [ask, command, sumCommand] = line.split(' ').map(i => i.trim());
        return { ask, command, sumCommand };
    }

    /**
     * Initializes auto complete inside of the program
     */
    initAutoComplete() {
        if (fs.existsSync(this.autoCompleteHintsFile)) {
            const options = fs.readJsonSync(this.autoCompleteHintsFile);

            this.completion
                .on('command', ({ reply }) => {
                    reply(CONSTANTS.TOP_LEVEL_COMMANDS);
                })
                .on('subCommand', ({ line, reply }) => {
                    const { command } = this._parseArguments(line);
                    if (options[command]) {
                        reply(Object.keys(options[command]));
                    }
                });

            this.completion.init();
        }
    }

    _withProcessExitDisabled(fn) {
        const origExit = process.exit;
        process.exit = () => {};
        fn();
        process.exit = origExit;
    }

    /**
     * Regenerates auto complete hints file
     */
    reloadAutoCompleteHints() {
        const options = this._getAutoCompleteOptions();
        fs.writeJSONSync(this.autoCompleteHintsFile, options);
    }

    /**
     * Sets ups auto complete. For example, adds autocomplete entry to .bash_profile file
     */
    setUpAutoComplete() {
        this.reloadAutoCompleteHints();
        this._withProcessExitDisabled(() => this.completion.setupShellInitFile());
    }

    /**
     * Removes auto complete. For example, removes autocomplete entry from .bash_profile file
     */
    cleanUpAutoComplete() {
        this._withProcessExitDisabled(() => this.completion.cleanupShellInitFile());
    }
};
