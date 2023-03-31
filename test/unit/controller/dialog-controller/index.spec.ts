import chalk from "chalk";
import {expect} from "chai";
import fs from "fs-extra";
import sinon from "sinon";

import {DialogController, DialogControllerProps} from "../../../../lib/controllers/dialog-controller";
import {DialogReplView} from "../../../../lib/view/dialog-repl-view";
import Messenger from "../../../../lib/view/messenger";
import {RetriableServiceError} from "../../../../lib/exceptions/cli-retriable-error";

const baseDialogControllerProps: DialogControllerProps = {
  profile: "default",
  debug: true,
  skillId: "a1b2c3",
  locale: "en-US",
  stage: "DEVELOPMENT",
  newSession: false,
  saveSkillIo: "",
};

describe("Controller test - dialog controller test", () => {
  const TEST_MSG = "TEST_MSG";
  const RECORD_FORMAT = 'Please use the format: ".record <fileName>" or ".record <fileName> --append-quit"';

  describe("# test constructor", () => {
    it("| constructor with config parameter returns DialogController object", () => {
      // call
      const dialogController = new DialogController(baseDialogControllerProps);
      // verify
      expect(dialogController).to.be.instanceOf(DialogController);
      expect(dialogController.smapiClient.profile).equal("default");
      expect(dialogController.utteranceCache.length).equal(0);
    });

    it("| constructor with empty config object returns DialogController object", () => {
      // call
      const dialogController = new DialogController({} as any);
      // verify
      expect(dialogController).to.be.instanceOf(DialogController);
      expect(dialogController.smapiClient.profile).equal(undefined);
      expect(dialogController.utteranceCache.length).equal(0);
    });

    it("| constructor with no args throws exception", () => {
      try {
        // setup & call
        new DialogController({} as any);
      } catch (err) {
        // verify
        expect(err).to.match(new RegExp("Cannot have an undefined configuration."));
      }
    });
  });

  describe("# test class method - startSkillSimulation", () => {
    let simulateSkillStub: sinon.SinonStub;
    let dialogController: DialogController;

    beforeEach(() => {
      dialogController = new DialogController(baseDialogControllerProps);
      simulateSkillStub = sinon.stub(dialogController.smapiClient.skill.test, "simulateSkill");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| test utterance input and response is stored into appropriate caches", async () => {
      // setup
      simulateSkillStub.resolves({body: TEST_MSG});
      // call
      const response = await dialogController.startSkillSimulation(TEST_MSG);
      // verify
      expect(dialogController.utteranceCache.length).equal(1);
      expect(dialogController.utteranceCache[0]).equal(response.body);
    });

    it("| test an error in request does not effect caches", async () => {
      // setup
      simulateSkillStub.rejects(TEST_MSG);
      // call
      await expect(dialogController.startSkillSimulation(TEST_MSG)).rejectedWith(TEST_MSG);
      // verify
      expect(dialogController.utteranceCache.length).equal(0);
    });
  });

  describe("# test class method - getSkillSimulationResult", () => {
    let getSimulationStub: sinon.SinonStub;
    let dialogController: DialogController;

    beforeEach(() => {
      dialogController = new DialogController(baseDialogControllerProps);
      getSimulationStub = sinon.stub(dialogController.smapiClient.skill.test, "getSimulation");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| test valid simulation response", async () => {
      // setup
      const output = {
        statusCode: 200,
        headers: {},
        body: {
          status: "SUCCESSFUL",
          msg: TEST_MSG,
        },
      };
      getSimulationStub.resolves(output);
      // call
      const response = await dialogController.getSkillSimulationResult(TEST_MSG);
      expect(response).to.deep.equal(output);
    });

    it("| test an error in request", async () => {
      // setup
      getSimulationStub.rejects(TEST_MSG);
      // call
      try {
        await dialogController.getSkillSimulationResult(TEST_MSG);
      } catch (err) {
        // verify
        expect((err as any).message).equal(TEST_MSG);
      }
    });

    it("| test an error in response", async () => {
      // setup
      const output = {
        statusCode: 200,
        headers: {},
        body: {
          status: "SUCCESSFUL",
          msg: TEST_MSG,
          result: {
            error: {
              message: TEST_MSG,
            },
          },
        },
      };
      getSimulationStub.resolves(output);
      // call
      try {
        await dialogController.getSkillSimulationResult(TEST_MSG);
      } catch (err) {
        // verify
        expect((err as any).message).equal(TEST_MSG);
      }
    });
  });

  describe("# test class method - clearSession", () => {
    it("| values are reset after method call", () => {
      // setup
      const dialogController = new DialogController(baseDialogControllerProps);

      // call
      dialogController.clearSession();

      // verify
      expect(dialogController.newSession).equal(true);
    });
  });

  describe("# test class method - createReplayFile", () => {
    afterEach(() => {
      sinon.restore();
    });

    it("| successful replay file creation", () => {
      // setup
      const utterances = ["userUtterance"];
      const dialogController = new DialogController(baseDialogControllerProps);
      const fileSystemStub = sinon.stub(fs, "outputJSONSync");

      // call
      dialogController.createReplayFile("random_file_name", utterances);

      // verify
      expect(fileSystemStub).calledOnce;
      expect(fileSystemStub).calledOnceWith(sinon.match.any, sinon.match({userInput: utterances}));
    });

    it("| file name is empty", () => {
      // setup
      const dialogController = new DialogController(baseDialogControllerProps);

      // call
      dialogController.createReplayFile("", "");

      // verify
      expect(dialogController.utteranceCache.length).equal(0);
    });
  });

  describe("# test class method - setupSpecialCommands", () => {
    const dialogController = new DialogController(baseDialogControllerProps);
    let dialogReplView: DialogReplView;

    beforeEach(() => {
      dialogReplView = new DialogReplView({} as any);
    });

    afterEach(() => {
      sinon.restore();
      dialogReplView.close();
    });

    it("| Invalid record command format", async () => {
      // setup
      const stubInstance = sinon.stub(DialogReplView.prototype, "registerRecordCommand");
      stubInstance.callsArgWith(0, "");
      const warnStub = sinon.stub();
      sinon.stub(Messenger, "getInstance").returns({
        warn: warnStub,
      });

      // call
      await expect(dialogController.setupSpecialCommands(dialogReplView)).rejected;

      // verify
      expect(warnStub).calledOnceWith(`Incorrect format. ${RECORD_FORMAT}`);
    });

    it("| Invalid record command format, malformed --append-quit argument", async () => {
      // setup
      const malFormedAppendQuitArgument = "--append";
      const stubInstance = sinon.stub(DialogReplView.prototype, "registerRecordCommand");
      stubInstance.callsArgWith(0, `history.json ${malFormedAppendQuitArgument}`);
      const warnStub = sinon.stub();
      sinon.stub(Messenger, "getInstance").returns({
        warn: warnStub,
      });

      // call
      await dialogController.setupSpecialCommands(dialogReplView);

      // verify
      expect(warnStub).calledOnceWith(`Unable to validate arguments: "${malFormedAppendQuitArgument}". ${RECORD_FORMAT}`);
    });

    it("| replay file creation throws error", async () => {
      // setup
      const infoStub = sinon.stub().throws(new Error(TEST_MSG));
      sinon.stub(Messenger, "getInstance").returns({
        info: infoStub,
      });
      const replayStub = sinon.stub(DialogController.prototype, "createReplayFile");
      const stubInstance = sinon.stub(DialogReplView.prototype, "registerRecordCommand");
      stubInstance.callsArgWith(0, "file.json");

      // call
      await expect(dialogController.setupSpecialCommands(dialogReplView)).rejectedWith(TEST_MSG);

      expect(replayStub).calledOnce;
      expect(infoStub).calledOnce;
    });

    it("| Valid record command format, with --append-quit argument", async () => {
      // setup
      const appendQuitArgument = "--append-quit";
      const filePath = "history.json";
      const stubInstance = sinon.stub(DialogReplView.prototype, "registerRecordCommand");
      stubInstance.callsArgWith(0, `${filePath} ${appendQuitArgument}`);
      const infoStub = sinon.stub();
      sinon.stub(Messenger, "getInstance").returns({
        info: infoStub,
      });
      const replayStub = sinon.stub(DialogController.prototype, "createReplayFile");

      // call
      await dialogController.setupSpecialCommands(dialogReplView);

      // verify
      expect(infoStub).calledOnceWith(`Created replay file at ${filePath} (appended ".quit" to list of utterances).`);
      expect(replayStub.calledOnce).equal(true);
      expect(replayStub).calledOnceWith(filePath);
      expect(replayStub).calledOnceWith(sinon.match.any, sinon.match.array.contains([".quit"]));
    });
  });

  describe("# test evaluateUtterance -", () => {
    const dialogController: DialogController = new DialogController(baseDialogControllerProps);
    const utterance = "hello";
    const simulationId = "simulationId";
    const prompt = chalk.yellow.bold("Alexa > ");
    let infoStub: sinon.SinonStub;
    let errorStub: sinon.SinonStub;
    let terminateSpinnerStub: sinon.SinonStub;
    let updateSpinnerStub: sinon.SinonStub;
    let startSpinnerStub: sinon.SinonStub;
    let replViewStub: DialogReplView;

    beforeEach(() => {
      infoStub = sinon.stub();
      errorStub = sinon.stub();
      terminateSpinnerStub = sinon.stub();
      updateSpinnerStub = sinon.stub();
      startSpinnerStub = sinon.stub();
      sinon.stub(Messenger, "getInstance").returns({
        info: infoStub,
        error: errorStub,
      });
      replViewStub = {
        startProgressSpinner: startSpinnerStub,
        terminateProgressSpinner: terminateSpinnerStub,
        updateProgressSpinner: updateSpinnerStub,
      } as any;
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| start skill simulation throws error", async () => {
      // setup
      sinon.stub(DialogController.prototype, "startSkillSimulation").rejects(Error(TEST_MSG));

      // call
      await expect(dialogController.evaluateUtterance(utterance, replViewStub)).eventually.rejected;

      // verify
      expect(startSpinnerStub).calledOnceWith("Sending simulation request to Alexa...");
      expect(terminateSpinnerStub).calledOnce;
      expect(errorStub).calledOnceWith(TEST_MSG);
    });

    it("| start skill simulation throws error", async () => {
      // setup
      sinon.stub(dialogController, "startSkillSimulation").rejects(new RetriableServiceError(TEST_MSG));

      // call
      await expect(dialogController.evaluateUtterance(utterance, replViewStub)).rejected;

      // verify
      expect(startSpinnerStub).calledOnceWith("Sending simulation request to Alexa...");
      expect(terminateSpinnerStub).calledOnce;
      expect(errorStub).calledOnceWith(TEST_MSG);
    });

    it("| get skill simulation result throws error", async () => {
      // setup
      const response = {
        statusCode: 200,
        body: {
          id: simulationId,
        },
      };
      sinon.stub(DialogController.prototype, "startSkillSimulation").resolves(response as any);
      sinon.stub(DialogController.prototype, "getSkillSimulationResult").rejects(new RetriableServiceError(TEST_MSG));
      // call
      await expect(dialogController.evaluateUtterance(utterance, replViewStub)).eventually.rejected;
      // verify
      expect(startSpinnerStub).calledOnceWith("Sending simulation request to Alexa...");
      expect(updateSpinnerStub).calledOnceWith("Waiting for the simulation response...");
      expect(terminateSpinnerStub).calledOnce;
      expect(errorStub).calledOnceWith(TEST_MSG);
    });

    it("| valid response is returned with existing session", async () => {
      // setup
      const response = {
        statusCode: 200,
        body: {
          id: simulationId,
          result: {
            alexaExecutionInfo: {
              alexaResponses: [
                {
                  content: {
                    caption: "hello",
                  },
                },
              ],
            },
            skillExecutionInfo: {
              invocations: ["hello"],
            },
          },
        },
      };
      sinon.stub(DialogController.prototype, "startSkillSimulation").resolves(response as any);
      sinon.stub(DialogController.prototype, "getSkillSimulationResult").resolves(response);
      // call
      await dialogController.evaluateUtterance(utterance, replViewStub);
      // verify
      expect(startSpinnerStub).calledOnceWith("Sending simulation request to Alexa...");
      expect(updateSpinnerStub).calledOnceWith("Waiting for the simulation response...");
      expect(terminateSpinnerStub).calledOnce;
      expect(infoStub).calledOnceWith(`${prompt}hello`);
    });

    it("| valid response is returned with a new session", async () => {
      // setup
      const response = {
        statusCode: 200,
        body: {
          id: simulationId,
          result: {
            alexaExecutionInfo: {
              alexaResponses: [
                {
                  content: {
                    caption: "hello",
                  },
                },
              ],
            },
            skillExecutionInfo: {
              invocations: [
                {
                  invocationResponse: {
                    body: {
                      response: {
                        shouldEndSession: true,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      };
      sinon.stub(DialogController.prototype, "startSkillSimulation").resolves(response as any);
      sinon.stub(DialogController.prototype, "getSkillSimulationResult").resolves(response);
      const clearSessionStub = sinon.stub(DialogController.prototype, "clearSession");
      // call
      await dialogController.evaluateUtterance(utterance, replViewStub);
      // verify
      expect(startSpinnerStub).calledOnceWith("Sending simulation request to Alexa...");
      expect(updateSpinnerStub).calledOnceWith("Waiting for the simulation response...");
      expect(terminateSpinnerStub).calledOnce;
      expect(clearSessionStub.calledOnce).equal(true);
      expect(infoStub).calledWith("Session ended");
      expect(infoStub).calledWith(`${prompt}hello`);
    });
  });
});
