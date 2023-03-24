import repl from "repl";

import SpinnerView from "./spinner-view";
import Messenger from "./messenger";
import * as stringUtils from "../utils/string-utils";

export interface CliReplViewConfig {
  prompt: string;
  evalFunc: (cmd: string, callback: (err: Error | null, result: any) => void) => void;
  header: string;
  footer: string;
  prettifyHeaderFooter?: (arg: string) => string;
  inputStream?: NodeJS.ReadableStream;
}

export class CliReplView {
  prompt: string;
  eval;
  header;
  footer;
  prettifyHeaderFooter;
  inputStream;
  progressSpinner;
  replServer;

  /**
   * Constructor for CLI REPL View
   * @param {String} prompt What string to display as the prompt for the REPL.
   * @throws {Error} throws error if an undefined configuration is passed.
   * @throws {Error} throws error if prompt is not a non-empty string.
   */
  constructor(configuration: CliReplViewConfig) {
    if (!configuration) {
      throw "Cannot have an undefined configuration.";
    }
    const {prompt, evalFunc, header, footer, prettifyHeaderFooter, inputStream} = configuration;
    this.prompt = prompt || "> ";
    this.eval = evalFunc;
    this.header = header;
    this.footer = footer;
    this.prettifyHeaderFooter = prettifyHeaderFooter || ((arg: string) => arg);
    this.inputStream = inputStream || process.stdin;
    this.progressSpinner = new SpinnerView();
    if (!stringUtils.isNonEmptyString(this.prompt)) {
      throw "Prompt must be a non-empty string.";
    }
    this.printHeaderFooter(this.header);
    // Initialize custom REPL server.
    const replConfig: repl.ReplOptions = {
      prompt: this.prompt,
      eval: (cmd, _context, _filename, callback) => {
        this.eval(cmd, callback);
      },
      ignoreUndefined: true,
      input: this.inputStream,
      output: process.stdout,
    };
    this.replServer = repl.start(replConfig);
    this.replServer.removeAllListeners("SIGINT");
    this.clearSpecialCommands();
    this.registerQuitCommand(() => {});
  }

  /**
   * Function to print a header or footer line.
   * @param {String} data the string that contains the information the caller whats to embed into header/footer.
   */
  printHeaderFooter(data: string) {
    if (stringUtils.isNonEmptyString(data)) {
      Messenger.getInstance().info(this.prettifyHeaderFooter(data));
    }
  }

  /**
   * Register a special command to the repl
   * @param {String} name name of new special command.
   * @param {String} name name of new special command.
   * @param {String} helpMessage description of special command
   * @param {Function} func function to execute when special command received
   * @param {Boolean} displayPrompt specify whether or not to display the prompt after the special command executes. Default: true
   */
  registerSpecialCommand(name: string, helpMessage: string, func: (args: string) => void, displayPrompt?: boolean) {
    const shouldDisplayPrompt = displayPrompt === undefined ? true : displayPrompt;
    this.replServer.defineCommand(name, {
      help: helpMessage || this.replServer.commands[name]?.help,
      action: (args) => {
        func(args);
        if (shouldDisplayPrompt) this.replServer.displayPrompt();
      },
    });
  }

  /**
   * Register a special exit command to the repl
   * @param {Function} func function to execute when special command received
   */
  registerQuitCommand(func: () => void) {
    this.replServer.removeAllListeners("close");
    this.registerSpecialCommand(
      "quit",
      "Quit repl session.",
      () => {
        this.close();
      },
      false,
    );
    this.replServer.on("close", () => {
      func();
      this.progressSpinner.terminate();
      this.printHeaderFooter(this.footer);
    });
  }

  /**
   * Remove all special commands from REPL server
   * Remove close event listeners to remove all quit handlers.
   */
  clearSpecialCommands() {
    (this.replServer.commands as any) = {
      help: this.replServer.commands.help,
    };
    this.replServer.removeAllListeners("close");
  }

  /**
   * Wrapper to close instance. This involves terminating the SpinnerView, disposing the Messenger View, and closing the REPL Server.
   */
  close() {
    this.replServer.close();
  }

  // SpinnerView wrapper functions

  /**
   * Wrapper for starting the SpinnerView with a specified message.
   * @param {String} text text to display when the spinner starts.
   */
  startProgressSpinner(text: string) {
    this.progressSpinner.start(text);
  }

  /**
   * Wrapper for updating the text of the SpinnerView
   * @param {String} text text to replace current message of spinner.
   */
  updateProgressSpinner(text: string) {
    this.progressSpinner.update(text);
  }

  /**
   * Wrapper for terminating the SpinnerView, clearing it from the console
   */
  terminateProgressSpinner() {
    this.progressSpinner.terminate();
  }
}
