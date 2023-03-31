import {expect} from "chai";
import sinon from "sinon";

import {InteractiveMode} from "../../../../lib/commands/dialog/interactive-mode";
import {DialogController} from "../../../../lib/controllers/dialog-controller";
import {DialogReplView} from "../../../../lib/view/dialog-repl-view";

describe("# Command: Dialog - Interactive Mode test ", () => {
  const TEST_ERROR = "error";
  const dialogReplViewPrototype = Object.getPrototypeOf(DialogReplView);

  afterEach(() => {
    Object.setPrototypeOf(DialogReplView, dialogReplViewPrototype);
    sinon.restore();
  });

  it("| test interactive mode start, dialog repl view creation throws error", async () => {
    // setup
    const dialogReplViewStub = sinon.stub().throws(new Error(TEST_ERROR));
    Object.setPrototypeOf(DialogReplView, dialogReplViewStub);
    const interactiveMode = new InteractiveMode({} as any);
    // call
    await expect(interactiveMode.start()).rejectedWith(TEST_ERROR);
  });

  it("| test interactive mode start, setupSpecialCommands throws error", async () => {
    // setup
    const dialogReplViewStub = sinon.stub();
    Object.setPrototypeOf(DialogReplView, dialogReplViewStub);
    sinon.stub(DialogController.prototype, "setupSpecialCommands").rejects(Error(TEST_ERROR));
    const interactiveMode = new InteractiveMode({} as any);
    // call
    await expect(interactiveMode.start()).rejectedWith(TEST_ERROR);
  });
});
