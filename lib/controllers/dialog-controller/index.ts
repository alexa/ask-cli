import chalk from "chalk";
import * as fs from "fs-extra";

import * as stringUtils from "../../utils/string-utils";
import Messenger from "../../view/messenger";
import {SkillSimulationController, SkillSimulationControllerProps} from "../skill-simulation-controller";
import {DialogReplView} from "../../view/dialog-repl-view";

const RECORD_FORMAT = 'Please use the format: ".record <fileName>" or ".record <fileName> --append-quit"';

export interface DialogControllerProps extends SkillSimulationControllerProps {
  newSession?: boolean;
}

export class DialogController extends SkillSimulationController {
  newSession: boolean;
  utteranceCache: string[] = [];

  /**
   * Constructor for DialogModeController.
   * @param {Object} configuration | config object includes information such as skillId, locale, profile, stage.
   */
  constructor(configuration: DialogControllerProps) {
    super(configuration);
    this.newSession = configuration.newSession === false ? configuration.newSession : true;
  }

  /**
   * Evaluate individual utterance input by the User/replay_file.
   * @param {String} input Utterance by the user sent to Alexa.
   * @param {Object} replView Dialog command's repl view.
   * @param {Function} replCallback
   */
  async evaluateUtterance(input: any, replView: DialogReplView): Promise<void> {
    replView.startProgressSpinner("Sending simulation request to Alexa...");
    try {
      const startResponse = await this.startSkillSimulation(input.trim());

      replView.updateProgressSpinner("Waiting for the simulation response...");
      const simulationId = startResponse?.body?.id;

      const response = await this.getSkillSimulationResult(simulationId);
      this.newSession = false;
      replView.terminateProgressSpinner();
      if (this.shouldEndSession(response.body)) {
        Messenger.getInstance().info("Session ended");
        this.clearSession();
      }
      const captions = this.getCaption(response.body);
      captions.forEach((caption: string) => {
        Messenger.getInstance().info(chalk.yellow.bold("Alexa > ") + caption);
      });
    } catch (startErr) {
      replView.terminateProgressSpinner();
      Messenger.getInstance().error((<Error>startErr).message ? (<Error>startErr).message : startErr);
      throw startErr;
    }
  }

  shouldEndSession(response: any): boolean {
    const invocations = response?.result?.skillExecutionInfo?.invocations;

    if (!invocations) {
      return false;
    }

    for (const invocation of invocations) {
      if (invocation?.invocationResponse?.body?.response?.shouldEndSession) {
        return true;
      }
    }
    return false;
  }

  getCaption(response: any): string[] {
    const alexaResponses = response?.result?.alexaExecutionInfo?.alexaResponses as any[];
    if (!alexaResponses) {
      return [];
    }
    return alexaResponses.map((element) => element?.content?.caption);
  }

  /**
   * Registers special commands with the REPL server.
   * @param {Object} dialogReplView dialog command's repl view.
   * @param {Function} callback
   */
  async setupSpecialCommands(dialogReplView: DialogReplView): Promise<void> {
    return new Promise((resolve, reject) => {
      dialogReplView.registerRecordCommand((recordArgs) => {
        const recordArgsList = recordArgs.trim().split(" ");
        if (!stringUtils.isNonBlankString(recordArgs) || recordArgsList.length > 2) {
          Messenger.getInstance().warn(`Incorrect format. ${RECORD_FORMAT}`);
          return reject();
        }
        const {filePath, shouldAppendQuit} = this._validateRecordCommandInput(recordArgsList);
        const utteranceCacheCopy = [...this.utteranceCache];
        if (shouldAppendQuit) {
          utteranceCacheCopy.push(".quit");
        }
        if (filePath) {
          try {
            this.createReplayFile(filePath, utteranceCacheCopy);
            Messenger.getInstance().info(
              `Created replay file at ${filePath}` + `${shouldAppendQuit ? ' (appended ".quit" to list of utterances).' : ""}`,
            );
          } catch (replayFileCreationError) {
            return reject(replayFileCreationError);
          }
        }
        resolve();
      });
      const self = this;
      dialogReplView.registerQuitCommand(() => {
        self.skillIOInstance.save();
      });
    });
  }

  /**
   * Validate record command arguments.
   * @param {Array} recordArgsList
   * @param {String} recordCommandFormat
   */
  _validateRecordCommandInput(recordArgsList: string[]) {
    const filePath = recordArgsList[0];
    const appendQuitArgument = recordArgsList[1];
    let shouldAppendQuit = false;

    if (stringUtils.isNonBlankString(appendQuitArgument)) {
      if (appendQuitArgument !== "--append-quit") {
        Messenger.getInstance().warn(`Unable to validate arguments: "${appendQuitArgument}". ${RECORD_FORMAT}`);
        return {};
      }
      shouldAppendQuit = true;
    }
    return {
      filePath,
      shouldAppendQuit,
    };
  }

  /**
   * Start skill simulation by calling SMAPI POST skill simulation endpoint.
   * @param {String} utterance text utterance to simulate against.
   */
  override async startSkillSimulation(utterance: string) {
    const response = await super.startSkillSimulation(utterance, this.newSession);
    this.utteranceCache.push(utterance);
    return response;
  }

  /**
   * Clears dialog session by resetting to a new session and clearing caches.
   */
  clearSession() {
    this.newSession = true;
    this.utteranceCache = [];
  }

  /**
   * Function to create replay file.
   * @param {String} filename name of file to save replay JSON.
   */
  createReplayFile(filename: string, utterances: any) {
    if (stringUtils.isNonBlankString(filename)) {
      const content = {
        skillId: this.skillId,
        locale: this.locale,
        type: "text",
        userInput: utterances,
      };
      fs.outputJSONSync(filename, content);
    }
  }
}
