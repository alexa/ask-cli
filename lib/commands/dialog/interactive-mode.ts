import chalk from "chalk";

import {DialogReplView} from "../../view/dialog-repl-view";
import {DialogController, DialogControllerProps} from "../../controllers/dialog-controller";

const SPECIAL_COMMANDS_HEADER =
  'Use ".record <fileName>" or ".record <fileName> --append-quit" to save list of utterances to a file.\n' +
  'You can exit the interactive mode by entering ".quit" or "ctrl + c".';

export interface InteractiveModeProps extends DialogControllerProps {
  header?: string;
}

export class InteractiveMode extends DialogController {
  header: string;

  constructor(config: InteractiveModeProps) {
    super(config);
    this.header =
      config.header ||
      "Welcome to ASK Dialog\n" +
        "In interactive mode, type your utterance text onto the console and hit enter\n" +
        "Alexa will then evaluate your input and give a response!\n";
  }

  async start(): Promise<void> {
    try {
      const interactiveReplView = new DialogReplView({
        prompt: chalk.yellow.bold("User  > "),
        header: this.header + SPECIAL_COMMANDS_HEADER,
        footer: "Goodbye!",
        evalFunc: (input, replCallback) => {
          this.evaluateUtterance(input, interactiveReplView)
            .then((x) => replCallback(null, x))
            .catch((x) => replCallback(x, null));
        },
      });
      await this.setupSpecialCommands(interactiveReplView);
    } catch (error) {
      throw error;
    }
  }
}
