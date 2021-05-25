import CliError from './cli-error';

export default class CliCFNDeployerError extends CliError {
    constructor(message: string) {
        super(message);
        this.name = 'CliCFNDeployerError';
    }
};
