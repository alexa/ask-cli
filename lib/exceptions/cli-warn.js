const CliError = require('./cli-error');

module.exports = class CliWarn extends CliError {
    constructor(message) {
        super(message);
        this.name = 'CliWarn';
    }
};
