import {expect} from "chai";
import sinon from "sinon";
import AuthorizationController from "../../../../../../lib/controllers/authorization-controller";
import SearchTaskCommand from "../../../../../../lib/commands/smapi/appended-commands/search-task";
import httpClient from "../../../../../../lib/clients/http-client";
import jsonView from "../../../../../../lib/view/json-view";
import Messenger from "../../../../../../lib/view/messenger";
import optionModel from "../../../../../../lib/commands/option-model.json";
import profileHelper from "../../../../../../lib/utils/profile-helper";
import {OptionModel} from "../../../../../../lib/commands/option-validator";

describe("Command search-task test ", () => {
  let infoStub: sinon.SinonStub;
  let errorStub: sinon.SinonStub;
  let instance: SearchTaskCommand;
  const cmdOptions = {
    skillId: "test",
    providerSkillId: "test",
    maxResults: "test",
    nextToken: "test",
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
    instance = new SearchTaskCommand(optionModel as OptionModel);
  });

  it("| should have options configured", () => {
    expect(instance.name()).be.a("string");
    expect(instance.description()).be.a("string");
    expect(instance.requiredOptions()).be.a("array");
    expect(instance.optionalOptions()).be.a("array");
  });

  it("| should display task list", async () => {
    const body = {
      taskSummaryList: [
        {
          description: "y",
          name: "x",
          version: "1",
        },
      ],
      totalCount: 1,
    };
    const expectedOutput = jsonView.toString(body);
    sinon.stub(httpClient, "request").yields(null, {body, statusCode: 200});

    await instance.handle(cmdOptions);
    expect(infoStub).calledOnceWith(expectedOutput);
  });

  it("| should encode spaces", () => {
    const input = "Test, TestTwo, Three,Four";
    const expected = "Test,%20TestTwo,%20Three,Four";
    const result = SearchTaskCommand.encodeSpaces(input);
    expect(result).eql(expected);
  });

  it("| should display error thrown by smapi client", async () => {
    const testError = "testError";
    sinon.stub(httpClient, "request").yields(new Error(testError));

    await expect(instance.handle(cmdOptions)).rejectedWith(testError);
  });

  it("| should display error thrown by smapi server", async () => {
    const body = {message: "Bad request."};
    sinon.stub(httpClient, "request").yields(null, {body, statusCode: 400});

    await expect(instance.handle(cmdOptions)).eventually.rejected.include('"message": "Bad request."');
  });

  afterEach(() => {
    sinon.restore();
  });
});
