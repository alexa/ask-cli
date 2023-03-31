import chalk from "chalk";
import {Readable} from "stream";

import {DialogController, DialogControllerProps} from "../../controllers/dialog-controller";
import {DialogReplView} from "../../view/dialog-repl-view";
import {InteractiveMode} from "./interactive-mode";

export interface ReplayModeProps extends DialogControllerProps {
  userInputs: any;
  replay: any;
  header?: any;
}

export class ReplayMode extends DialogController {
  config;
  userInputs;
  replay;

  constructor(config: ReplayModeProps) {
    super(config);
    this.config = config;
    this.userInputs = config.userInputs;
    this.replay = config.replay;
  }

  async start(): Promise<void> {
    const replayInputStream = new Readable({read() {}});
    const replayReplView = new DialogReplView({
      prompt: chalk.yellow.bold("User  > "),
      header: this._getHeader(),
      footer: "Goodbye!",
      inputStream: replayInputStream,
      evalFunc: (replayInput, replayCallback) => {
        this._evaluateInput(replayInput, replayReplView, replayInputStream, replayCallback);
      },
    });
    replayInputStream.push(`${this.userInputs.shift()}\n`, "utf8");
    await this.setupSpecialCommands(replayReplView);
  }

  _getHeader() {
    return (
      "Welcome to ASK Dialog\n" +
      `Replaying a multi turn conversation with Alexa from ${this.replay}\n` +
      "Alexa will then evaluate your input and give a response!"
    );
  }

  async _evaluateInput(
    replayInput: any,
    replayReplView: any,
    replayInputStream: any,
    replayCallback: (err: Error | null, result: any) => void,
  ): Promise<void> {
    try {
      await this.evaluateUtterance(replayInput, replayReplView);
    } catch (err) {}

    if (this.userInputs.length > 0) {
      replayCallback(null, undefined);
      replayInputStream.push(`${this.userInputs.shift()}\n`, "utf8");
    } else {
      replayReplView.clearSpecialCommands();
      replayReplView.close();
      this.config.header =
        "Switching to interactive dialog.\n" + "To automatically quit after replay, append '.quit' to the userInput of your replay file.\n";
      this.config.newSession = false;
      const interactiveReplView = new InteractiveMode(this.config);
      await interactiveReplView.start();
    }
  }
}
