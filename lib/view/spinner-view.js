const ora = require('ora');

const TERMINATE_STYLE = {
    SUCCEED: 'succeed',
    FAIL: 'fail',
    WARN: 'warn',
    INFO: 'info',
    PERSIST: 'stopAndPersist',
    CLEAR: 'stop'
};

class SpinnerView {
    constructor(oraConfig) {
        if (!oraConfig) {
            oraConfig = {};
        }
        if (!oraConfig.color) {
            oraConfig.color = 'yellow';
        }
        if (!oraConfig.spinner) {
            oraConfig.spinner = process.platform === 'darwin' ? 'dots' : 'balloon';
        }
        this.oraSpinner = ora(oraConfig);
    }

    start(text) {
        this.oraSpinner.start(text);
    }

    update(text) {
        this.oraSpinner.text = text;
    }

    terminate(style, optionalMessage) {
        if (!style) {
            style = TERMINATE_STYLE.CLEAR;
        }
        this.oraSpinner[style](optionalMessage);
    }
}

module.exports = SpinnerView;
module.exports.TERMINATE_STYLE = TERMINATE_STYLE;
