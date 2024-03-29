import {commander} from "../../../../lib/commands/util/util-commander";
import UpdateProjectCommand from "../../../../lib/commands/util/upgrade-project";
import sinon from "sinon";
import Messenger from "../../../../lib/view/messenger";
import * as httpClient from "../../../../lib/clients/http-client";

/**
 * Simple test which loads the util commander while running tests.
 * This was previously not done and could fail due to changes.
 */
describe("Util Commander Test", () => {
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
    sinon.stub(httpClient, "request").yields({statusCode: 200});
  });

  it("loads and runs a command", async () => {
    sinon.stub(UpdateProjectCommand.prototype, "handle").resolves();
    await commander.parseAsync(["something", "something", "upgrade-project"]);
  });

  afterEach(() => {
    sinon.restore();
  });
});
