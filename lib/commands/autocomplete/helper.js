const fs = require('fs-extra');
const path = require('path');

module.exports = class Helper {
    constructor(omelette, commanders = []) {
        this.commanders = commanders;
        this.completion = omelette('ask');
        this.autoCompleteHintsFile = path.join(__dirname, 'autocomplete-hints.json');
    }

    _getAutoCompleteOptions() {
        const options = {};
        this.commanders.forEach(com => {
            options[com.name()] = com.commands.map(sumCom => sumCom.name());
        });

        return options;
    }

    /**
     * Initializes auto complete inside of the program
     */
    initAutoComplete() {
        if (fs.existsSync(this.autoCompleteHintsFile)) {
            const options = fs.readJsonSync(this.autoCompleteHintsFile);

            this.completion.tree(options);
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
