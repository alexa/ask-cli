import {expect} from "chai";
import sinon from "sinon";
import AuthorizationController from "../../../../../../lib/controllers/authorization-controller";
import GetTaskCommand from "../../../../../../lib/commands/smapi/appended-commands/get-task";
import * as httpClient from "../../../../../../lib/clients/http-client";
import jsonView from "../../../../../../lib/view/json-view";
import Messenger from "../../../../../../lib/view/messenger";
import optionModel from "../../../../../../lib/commands/option-model.json";
import profileHelper from "../../../../../../lib/utils/profile-helper";
import {OptionModel} from "../../../../../../lib/commands/option-validator";

describe("Command get-task test ", () => {
  let infoStub: sinon.SinonStub;
  let errorStub: sinon.SinonStub;
  let instance: GetTaskCommand;
  const cmdOptions = {
    skillId: "test",
    taskName: "test",
    taskVersion: "test",
  };

  beforeEach(() => {
    infoStub = sinon.stub();
    errorStub = sinon.stub();
    sinon.stub(Messenger, "getInstance").returns({
      info: infoStub,
      error: errorStub,
    });
    sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
    sinon.stub(profileHelper, "runtimeProfile").returns("test");
    instance = new GetTaskCommand(optionModel as OptionModel);
  });

  it("| should have options configured", () => {
    expect(instance.name()).be.a("string");
    expect(instance.description()).be.a("string");
    expect(instance.requiredOptions()).be.a("array");
    expect(instance.optionalOptions()).be.a("array");
  });

  it("| should display task definition", async () => {
    const definition = '{ "x":"y", "b": "z"}';
    const expectedOutput = jsonView.toString(JSON.parse(definition));
    sinon.stub(httpClient, "request").yields(null, {body: {definition}, statusCode: 200});

    await instance.handle(cmdOptions);
    expect(infoStub).calledOnceWith(expectedOutput);
  });

  it("| should display error thrown by smapi client", async () => {
    const testError = "testError";
    sinon.stub(httpClient, "request").yields(new Error(testError));

    await expect(instance.handle(cmdOptions)).rejectedWith(testError);
  });

  it("| should display error thrown by smapi server", async () => {
    const response = {message: "Bad request.", statusCode: 400, body: {}};
    sinon.stub(httpClient, "request").callsArgWith(3, response);

    await expect(instance.handle(cmdOptions)).eventually.rejected.include(response);
  });

  afterEach(() => {
    sinon.restore();
  });
});
