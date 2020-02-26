const CliReplView = require('@src/view/cli-repl-view');

module.exports = class DialogReplView extends CliReplView {
    /**
     * Constructor for DialogReplView.
     * @param {Object} configuration config object.
     */
    constructor(configuration) {
        const conf = configuration || {};
        conf.prettifyHeaderFooter = (arg) => {
            const lines = arg.split('\n');
            const terminalWidth = process.stdout.columns;
            const halfWidth = Math.floor(terminalWidth / 2);
            const bar = '='.repeat(terminalWidth);
            const formattedLines = lines.map((line) => {
                const paddedLine = ` ${line.trim()} `;
                const offset = halfWidth - Math.floor(paddedLine.length / 2);
                if (offset < 0) {
                    return `===${paddedLine}===`;
                }
                return bar.slice(0, offset) + paddedLine + bar.slice(offset + paddedLine.length);
            });
            return `\n${formattedLines.join('\n')}\n`;
        };
        super(conf);
    }

    /**
     * Specify the record special command.
     * @param {Function} func What function to execute when .record command is inputted.
     */
    registerRecordCommand(func) {
        this.registerSpecialCommand(
            'record',
            'Record input utterances to a replay file of a specified name.',
            func
        );
    }
};
