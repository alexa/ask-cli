import ora, { Ora } from 'ora';

export const TERMINATE_STYLE = {
    SUCCEED: 'succeed',
    FAIL: 'fail',
    WARN: 'warn',
    INFO: 'info',
    PERSIST: 'stopAndPersist',
    CLEAR: 'stop'
};

export default class SpinnerView {
    private _oraSpinner: Ora;

    constructor(config?: Ora) {
        let oraConfig = (config || {}) as Ora;
        if (!oraConfig.color) {
            oraConfig.color = 'yellow';
        }
        if (!oraConfig.spinner) {
            oraConfig.spinner = process.platform === 'darwin' ? 'dots' : 'balloon';
        }
        this._oraSpinner = ora(oraConfig);
    }

    start(text: string) {
        this._oraSpinner.start(text);
    }

    update(text: string) {
        this._oraSpinner.text = text;
    }

    terminate(style?: string, optionalMessage?: string) {
        if (!style) {
            style = TERMINATE_STYLE.CLEAR;
        }
        (this._oraSpinner as any)[style](optionalMessage);
    }
}
