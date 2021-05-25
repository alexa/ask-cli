import repl, { ReplOptions, REPLServer } from 'repl';
import SpinnerView from '@src/view/spinner-view';
import Messenger from '@src/view/messenger';
import stringUtils from '@src/utils/string-utils';

import { ReadStream } from 'tty';

type REPLEvalCb = (err: Error | null, result: any) => void;

export type EvalCb = (cmd: string, cb: REPLEvalCb) => void;

export interface ICliReplView {
    prompt?: string;
    evalFunc: EvalCb;
    header: string,
    footer: string,
    prettifyHeaderFooter?: (str: any) => any;
    inputStream?: ReadStream;
};

export default class CliReplView {
    private _prompt: string;
    private _eval: EvalCb;
    private _header: string;
    private _footer: string;
    private _prettifyHeaderFooter: (str: any) => any;
    private _inputStream: ReadStream;
    private _progressSpinner: SpinnerView;
    private _replServer: REPLServer;

    /**
     * Constructor for CLI REPL View
     * @param {String} prompt What string to display as the prompt for the REPL.
     * @throws {Error} throws error if an undefined configuration is passed.
     * @throws {Error} throws error if prompt is not a non-empty string.
     */
    constructor(configuration: ICliReplView) {
        if (!configuration) {
            throw 'Cannot have an undefined configuration.';
        }
        const { prompt, evalFunc, header, footer, prettifyHeaderFooter, inputStream } = configuration;
        this._prompt = prompt || '> ';
        this._eval = evalFunc;
        this._header = header;
        this._footer = footer;
        this._prettifyHeaderFooter = prettifyHeaderFooter || ((arg: string) => arg);
        this._inputStream = inputStream || process.stdin;
        this._progressSpinner = new SpinnerView();

        if (!stringUtils.isNonEmptyString(this._prompt)) {
            throw 'Prompt must be a non-empty string.';
        }
        this.printHeaderFooter(this._header);

        // Initialize custom REPL server.
        const replConfig: ReplOptions = {
            prompt: this._prompt,
            eval: (cmd: string, context: any, filename: string, callback: REPLEvalCb) => {
                this._eval(cmd, callback);
            },
            ignoreUndefined: true,
            input: this._inputStream,
            output: process.stdout
        };
        this._replServer = repl.start(replConfig);
        this._replServer.removeAllListeners('SIGINT');
        this.clearSpecialCommands();
        this.registerQuitCommand(() => {});
    }

    /**
     * Function to print a header or footer line.
     * @param {String} data the string that contains the information the caller whats to embed into header/footer.
     */
    printHeaderFooter(data: string) {
        if (stringUtils.isNonEmptyString(data)) {
            Messenger.getInstance().info(this._prettifyHeaderFooter(data));
        }
    }

    /**
     * Register a special command to the repl
     * @param {String} name name of new special command.
     * @param {String} helpMessage description of special command
     * @param {Function} func function to execute when special command received
     * @param {Boolean} displayPrompt specify whether or not to display the prompt after the special command executes. Default: true
     */
    registerSpecialCommand(name: string, helpMessage: string, func: Function, displayPrompt?: boolean) {
        const shouldDisplayPrompt = displayPrompt === undefined ? true : displayPrompt;
        this._replServer.defineCommand(name, {
            help: helpMessage || (this._replServer.commands[name] as any).help,
            action: (args) => {
                func(args);
                if (shouldDisplayPrompt) this._replServer.displayPrompt();
            }
        });
    }

    /**
     * Register a special exit command to the repl
     * @param {Function} func function to execute when special command received
     */
    registerQuitCommand(func: Function) {
        this._replServer.removeAllListeners('close');
        this.registerSpecialCommand(
            'quit',
            'Quit repl session.',
            () => {
                this.close();
            },
            false
        );
        this._replServer.on('close', () => {
            func();
            this._progressSpinner.terminate();
            this.printHeaderFooter(this._footer);
        });
    }

    /**
     * Remove all special commands from REPL server
     * Remove close event listeners to remove all quit handlers.
     */
    clearSpecialCommands() {
        (this._replServer.commands as any) = { help: this._replServer.commands.help };
        this._replServer.removeAllListeners('close');
    }

    /**
     * Wrapper to close instance. This involves terminating the SpinnerView, disposing the Messenger View, and closing the REPL Server.
     */
    close() {
        this._replServer.close();
    }

    // SpinnerView wrapper functions

    /**
     * Wrapper for starting the SpinnerView with a specified message.
     * @param {String} text text to display when the spinner starts.
     */
    startProgressSpinner(text: string) {
        this._progressSpinner.start(text);
    }

    /**
     * Wrapper for updating the text of the SpinnerView
     * @param {String} text text to replace current message of spinner.
     */
    updateProgressSpinner(text: string) {
        this._progressSpinner.update(text);
    }

    /**
     * Wrapper for terminating the SpinnerView, clearing it from the console
     */
    terminateProgressSpinner() {
        this._progressSpinner.terminate();
    }
};
