import CliError from './cli-error';

export default class CliWarn extends CliError {
    constructor(message: string) {
        super(message);
        this.name = 'CliWarn';
    }
};
