import {expect} from "chai";
import sinon from "sinon";

import {InteractiveMode} from "../../../../lib/commands/dialog/interactive-mode";
import {ReplayMode} from "../../../../lib/commands/dialog/replay-mode";
import {DialogController} from "../../../../lib/controllers/dialog-controller";
import {DialogReplView} from "../../../../lib/view/dialog-repl-view";

describe("# Command: Dialog - Replay Mode test ", () => {
  const TEST_ERROR = "error";
  const dialogReplViewPrototype = Object.getPrototypeOf(DialogReplView);

  afterEach(() => {
    Object.setPrototypeOf(DialogReplView, dialogReplViewPrototype);
    sinon.restore();
  });

  it("| test replay mode start, dialog repl view creation throws error", async () => {
    // setup
    const dialogReplViewStub = sinon.stub().throws(new Error(TEST_ERROR));
    Object.setPrototypeOf(DialogReplView, dialogReplViewStub);
    const replayMode = new ReplayMode({} as any);

    // call
    await expect(replayMode.start()).rejectedWith(TEST_ERROR);
  });

  it("test replay mode start, setupSpecialCommands throws error", async () => {
    // setup
    const dialogReplViewStub = sinon.stub().callsFake(() => {});
    Object.setPrototypeOf(DialogReplView, dialogReplViewStub);
    sinon.stub(DialogController.prototype, "setupSpecialCommands").rejects(Error(TEST_ERROR));
    const replayMode = new ReplayMode({
      userInputs: ["hello"],
    } as any);

    // call
    await expect(replayMode.start()).rejectedWith(TEST_ERROR);
  });

  describe("# test _evaluateInput", () => {
    let replayCallbackStub: sinon.SinonStub;

    beforeEach(() => {
      replayCallbackStub = sinon.stub();
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| continue in replay mode", async () => {
      // setup
      const replayMode = new ReplayMode({
        userInputs: ["hello"],
      } as any);
      const inputStream: string[] = [];
      sinon.stub(DialogController.prototype, "evaluateUtterance").rejects(Error(""));

      // call
      await replayMode._evaluateInput({}, {}, inputStream, replayCallbackStub);

      // verify
      expect(inputStream[0]).equal("hello\n");
      expect(replayCallbackStub.calledOnce).equal(true);
    });

    it("| switch to interactive mode", async () => {
      // setup
      const config = {
        userInputs: [],
      } as any;
      const replayMode = new ReplayMode(config);
      const clearSpecialCommandsStub = sinon.stub();
      const replViewCloseStub = sinon.stub();
      const replViewStub = {
        clearSpecialCommands: clearSpecialCommandsStub,
        close: replViewCloseStub,
      };
      const inputStream: string[] = [];
      sinon.stub(DialogController.prototype, "evaluateUtterance").rejects(Error(""));
      const interactiveStartStub = sinon.stub(InteractiveMode.prototype, "start").resolves();
      // call
      await replayMode._evaluateInput({}, replViewStub, inputStream, replayCallbackStub);

      // verify
      expect(inputStream.length).equal(0);
      expect(clearSpecialCommandsStub.calledOnce).equal(true);
      expect(replViewCloseStub.calledOnce).equal(true);
      expect(replayMode.config.header).equal(
        "Switching to interactive dialog.\n" + "To automatically quit after replay, append '.quit' to the userInput of your replay file.\n",
      );
      expect(interactiveStartStub.calledOnce).equal(true);
    });
  });
});
