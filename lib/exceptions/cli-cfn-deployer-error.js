const CliError = require('./cli-error');

module.exports = class CliCFNDeployerError extends CliError {
    constructor(message) {
        super(message);
        this.name = 'CliCFNDeployerError';
    }
};
