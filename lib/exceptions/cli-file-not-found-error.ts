import CliError from './cli-error';

export default class CliFileNotFoundError extends CliError {
    constructor(message: string) {
        super(message);
        this.name = 'CliFileNotFoundError';
    }
};
