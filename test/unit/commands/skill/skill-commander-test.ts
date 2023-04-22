import {commander} from "../../../../lib/commands/skill/skill-commander";
import AddlocalesCommand from "../../../../lib/commands/skill/add-locales";
import sinon from "sinon";
import Messenger from "../../../../lib/view/messenger";

/**
 * Simple test which loads the skill commander while running tests.
 * This was previously not done and could fail due to changes.
 */
describe("Skill Commander Test", () => {
  let errorStub, warnStub, infoStub;

  beforeEach(() => {
    errorStub = sinon.stub();
    warnStub = sinon.stub();
    infoStub = sinon.stub();
    sinon.stub(Messenger, "getInstance").returns({
      info: infoStub,
      warn: warnStub,
      error: errorStub,
      dispose: sinon.stub(),
    });
    sinon.stub(process, "exit");
  });

  it("loads and runs a command", async () => {
    sinon.stub(AddlocalesCommand.prototype, "handle").resolves();
    sinon.stub(AddlocalesCommand.prototype, "_remindsIfNewVersion").resolves();
    await commander.parseAsync(["something", "something", "add-locales"]);
  });

  afterEach(() => {
    sinon.restore();
  });
});
