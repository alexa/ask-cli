import {expect} from "chai";
import path from "path";
import sinon from "sinon";
import AuthorizationController from "../../../../../lib/controllers/authorization-controller";
import GitCredentialsHelperCommand from "../../../../../lib/commands/util/git-credentials-helper";
import * as httpClient from "../../../../../lib/clients/http-client";
import Messenger from "../../../../../lib/view/messenger";
import optionModel from "../../../../../lib/commands/option-model.json";
import profileHelper from "../../../../../lib/utils/profile-helper";
import ResourcesConfig from "../../../../../lib/model/resources-config";
import {OptionModel} from "../../../../../lib/commands/option-validator";

describe("Commands git-credentials-helper test - command class test", () => {
  const TEST_PROFILE = "default";
  const TEST_DEBUG = false;
  const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(
    process.cwd(),
    "test",
    "unit",
    "fixture",
    "model",
    "hosted-proj",
    "ask-resources.json",
  );

  let infoStub: sinon.SinonStub;
  let errorStub: sinon.SinonStub;
  let warnStub: sinon.SinonStub;

  beforeEach(() => {
    infoStub = sinon.stub();
    errorStub = sinon.stub();
    warnStub = sinon.stub();
    sinon.stub(Messenger, "getInstance").returns({
      info: infoStub,
      error: errorStub,
      warn: warnStub,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("| validate command information is set correctly", () => {
    const instance = new GitCredentialsHelperCommand(optionModel as OptionModel);
    expect(instance.name()).equal("git-credentials-helper");
    expect(instance.description()).equal("gets git credentials for hosted skill repository");
    expect(instance.requiredOptions()).deep.equal([]);
    expect(instance.optionalOptions()).deep.equal(["profile", "debug"]);
  });

  describe("validate command handle", () => {
    const TEST_CMD = {
      profile: TEST_PROFILE,
      debug: TEST_DEBUG,
    };
    const TEST_ERROR_MESSAGE = "ERROR";
    const ERROR = new Error(TEST_ERROR_MESSAGE);
    let instance: GitCredentialsHelperCommand;
    let profileHelperRuntimeProfileStub: sinon.SinonStub;
    beforeEach(() => {
      profileHelperRuntimeProfileStub = sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      instance = new GitCredentialsHelperCommand(optionModel as OptionModel);
      new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
    });

    afterEach(() => {
      sinon.restore();
      const repository = {
        repository: {
          type: "GIT",
          url: "https://git-codecommit.us-east-1.amazonaws.com/v1/repos/5555555-4444-3333-2222-1111111111",
        },
      };
      ResourcesConfig.getInstance().setSkillInfraDeployState(TEST_PROFILE, repository);
    });

    describe("command handle - before get git credentials", () => {
      it("| when called from git and operation is not get, expect error out", async () => {
        // setup
        const remaining = ["not supported operation"];
        // call
        const expectedErr = `The ask-cli git credentials helper doesn't support operation "${remaining[0]}".`;

        await expect(instance.handle(TEST_CMD, remaining)).rejectedWith(expectedErr);

        expect(errorStub).calledOnceWith(expectedErr);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when called from git and operation is store, expect do nothing", async () => {
        // setup
        const remaining = ["store"];
        // call
        await instance.handle(TEST_CMD, remaining);
        //verify
        expect(errorStub).not.called;
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when called from git and operation is erase, expect do nothing", async () => {
        // setup
        const remaining = ["erase"];
        // call
        await instance.handle(TEST_CMD, remaining);

        expect(errorStub).not.called;
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when profile is not correct, expect throw error", async () => {
        // setup
        profileHelperRuntimeProfileStub.throws(new Error("error"));
        // call
        await expect(instance.handle(TEST_CMD, undefined)).eventually.rejected;

        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: "error"}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });
    });

    describe("command handle - request to get git credentials", () => {
      beforeEach(() => {
        sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
      });

      it("| get git credentials fails, expect throw error", async () => {
        // setup
        sinon.stub(path, "join").returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        sinon.stub(httpClient, "request").callsArgWith(3, ERROR); // stub getGitCredentials request
        // call
        await expect(instance.handle(TEST_CMD, undefined)).eventually.rejected;
        // verify
        expect(errorStub).calledOnceWith(sinon.match({message: TEST_ERROR_MESSAGE}));
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| get git credentials response with status code >= 300, expect throw error", async () => {
        // setup
        const GET_STATUS_ERROR = {
          statusCode: 403,
          body: {
            error: TEST_ERROR_MESSAGE,
          },
          headers: {},
        };
        sinon.stub(path, "join").returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        sinon.stub(httpClient, "request").callsArgWith(3, GET_STATUS_ERROR); // stub getGitCredentials request
        // call
        await expect(instance.handle(TEST_CMD, undefined)).rejected;
        //verify
        expect(errorStub).calledOnceWith(GET_STATUS_ERROR);
      });

      it("| get git credentials succeed, expect correct output", async () => {
        // setup
        const TEST_STATUS_CODE = 200;
        const TEST_USERNAME = "TEST_USERNAME";
        const TEST_PASSWORD = "TEST_PASSWORD";
        const GET_METADATA_RESPONSE = {
          statusCode: TEST_STATUS_CODE,
          headers: {},
          body: {
            alexaHosted: {
              repository: {
                url: "test",
              },
            },
          },
        };
        const GET_STATUS_RESPONSE = {
          statusCode: TEST_STATUS_CODE,
          headers: {},
          body: {
            repositoryCredentials: {
              username: TEST_USERNAME,
              password: TEST_PASSWORD,
            },
          },
        };
        sinon.stub(path, "join").returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);

        sinon
          .stub(httpClient, "request")
          .onFirstCall()
          .yields(null, GET_METADATA_RESPONSE)
          .onSecondCall()
          .yields(null, GET_STATUS_RESPONSE);

        // call
        await instance.handle(TEST_CMD, undefined);
        //verify
        expect(infoStub).calledOnceWith(`username=${TEST_USERNAME}\npassword=${TEST_PASSWORD}`);
      });
    });
  });
});
