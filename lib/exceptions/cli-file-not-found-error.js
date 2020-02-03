const CliError = require('./cli-error');

module.exports = class CliFileNotFoundError extends CliError {
    constructor(message) {
        super(message);
        this.name = 'CliFileNotFoundError';
    }
};
