import {expect} from "chai";
import sinon from "sinon";
import AuthorizationController from "../../../../lib/controllers/authorization-controller";
import InitCommand from "../../../../lib/commands/init";
import helper from "../../../../lib/commands/init/helper";
import HostedSkillController from "../../../../lib/controllers/hosted-skill-controller";
import httpClient from "../../../../lib/clients/http-client";
import CliWarn from "../../../../lib/exceptions/cli-warn";
import jsonView from "../../../../lib/view/json-view";
import optionModel from "../../../../lib/commands/option-model.json";
import Messenger from "../../../../lib/view/messenger";
import profileHelper from "../../../../lib/utils/profile-helper";
import ui from "../../../../lib/commands/init/ui";
import {OptionModel} from "../../../../lib/commands/option-validator";

describe("Commands init test - command class test", () => {
  const TEST_PROFILE = "default";
  const TEST_ERROR = Error("init error");
  const TEST_WARN = new CliWarn("init warn");
  const TEST_SKILL_ID = "skillId";
  const TEST_SKILL_NAME = "TEST_SKILL_NAME";
  const TEST_SRC = "src";
  const TEST_SKILL_META = {src: TEST_SRC};
  const TEST_SKILL_CODE = {src: TEST_SRC};
  const TEST_SKILL_INFRA = {};
  const TEST_HOSTED_SKILL_ID = "hosted skill id";

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
    const instance = new InitCommand(optionModel as OptionModel);
    expect(instance.name()).equal("init");
    expect(instance.description()).equal("setup a new or existing Alexa skill project");
    expect(instance.requiredOptions()).deep.equal([]);
    expect(instance.optionalOptions()).deep.equal(["hosted-skill-id", "profile", "debug"]);
  });

  describe("validate command handle", () => {
    describe("command handle - pre init check", () => {
      let instance: InitCommand;
      let profileHelperStub: sinon.SinonStub;

      beforeEach(() => {
        instance = new InitCommand(optionModel as OptionModel);
        profileHelperStub = sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
      });

      afterEach(() => {
        sinon.restore();
      });

      it("| when profile is not correct, expect throw error", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        profileHelperStub.throws(TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when pre init check fails, expect throw error", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        sinon.stub(helper, "preInitCheck").callsArgWith(2, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when pre init check returns CliWarn, expect provide users warnings", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        sinon.stub(helper, "preInitCheck").callsArgWith(2, TEST_WARN);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_WARN);
        // verify
        expect(warnStub).calledOnceWith(TEST_WARN.message);
        expect(infoStub).not.called;
        expect(errorStub).not.called;
      });
    });

    describe("command handle - collect ask resources", () => {
      let instance: InitCommand;

      let helperGetSkillIdUserInputStub: sinon.SinonStub;
      let helperGetSkillMetadataUserInput: sinon.SinonStub;
      let helperGetSkillCodeUserInput: sinon.SinonStub;
      let helperPreviewAndWriteAskResources: sinon.SinonStub;
      let helperGetSkillInfraUserInput: sinon.SinonStub;

      beforeEach(() => {
        instance = new InitCommand(optionModel as OptionModel);
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(helper, "preInitCheck").callsArgWith(2);
        helperGetSkillIdUserInputStub = sinon.stub(helper, "getSkillIdUserInput");
        helperGetSkillMetadataUserInput = sinon.stub(helper, "getSkillMetadataUserInput");
        helperGetSkillCodeUserInput = sinon.stub(helper, "getSkillCodeUserInput");
        helperGetSkillInfraUserInput = sinon.stub(helper, "getSkillInfraUserInput");
        helperPreviewAndWriteAskResources = sinon.stub(helper, "previewAndWriteAskResources").callsArgWith(3, TEST_ERROR);
      });

      afterEach(() => {
        sinon.restore();
      });

      it("| when collect skill id fails, expect throw error", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperGetSkillIdUserInputStub.callsArgWith(0, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when collect skill meta src fails, expect throw error", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperGetSkillIdUserInputStub.callsArgWith(0, null, TEST_SKILL_ID);
        helperGetSkillMetadataUserInput.callsArgWith(0, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when collect skill code src fails, expect throw error", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperGetSkillIdUserInputStub.callsArgWith(0, null, TEST_SKILL_ID);
        helperGetSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
        helperGetSkillCodeUserInput.callsArgWith(0, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when collect skill code src is not provided, callback without continuing", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperGetSkillIdUserInputStub.callsArgWith(0, null, TEST_SKILL_ID);
        helperGetSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
        helperGetSkillCodeUserInput.callsArgWith(0, null, null);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;

        expect(helperPreviewAndWriteAskResources.getCall(0).args[1]).deep.equal({
          skillId: TEST_SKILL_ID,
          skillMeta: {
            src: TEST_SRC,
          },
        });
      });

      it("| when collect skill infra fails, expect throw error", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperGetSkillIdUserInputStub.callsArgWith(0, null, TEST_SKILL_ID);
        helperGetSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
        helperGetSkillCodeUserInput.callsArgWith(0, null, TEST_SKILL_CODE);
        helperGetSkillInfraUserInput.callsArgWith(0, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when collect skill info all succeed, expect it passes correct user input", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperGetSkillIdUserInputStub.callsArgWith(0, null, TEST_SKILL_ID);
        helperGetSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
        helperGetSkillCodeUserInput.callsArgWith(0, null, TEST_SKILL_CODE);
        helperGetSkillInfraUserInput.callsArgWith(0, null, TEST_SKILL_INFRA);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;

        expect(helperPreviewAndWriteAskResources.getCall(0).args[1]).deep.equal({
          skillId: TEST_SKILL_ID,
          skillMeta: TEST_SKILL_META,
          skillCode: TEST_SKILL_CODE,
          skillInfra: TEST_SKILL_INFRA,
        });
      });
    });

    describe("command handle - post user input logics", () => {
      let instance: InitCommand;

      let helperPreviewAndWriteAskResources: sinon.SinonStub;
      let helperBootstrapSkillInfra: sinon.SinonStub;

      beforeEach(() => {
        instance = new InitCommand(optionModel as OptionModel);
        sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
        sinon.stub(helper, "preInitCheck").callsArgWith(2);
        sinon.stub(helper, "getSkillIdUserInput").callsArgWith(0, null, TEST_SKILL_ID);
        sinon.stub(helper, "getSkillMetadataUserInput").callsArgWith(0, null, TEST_SKILL_META);
        sinon.stub(helper, "getSkillCodeUserInput").callsArgWith(0, null, TEST_SKILL_CODE);
        sinon.stub(helper, "getSkillInfraUserInput").callsArgWith(0, null, TEST_SKILL_INFRA);

        helperPreviewAndWriteAskResources = sinon.stub(helper, "previewAndWriteAskResources");
        helperBootstrapSkillInfra = sinon.stub(helper, "bootstrapSkillInfra");
      });

      afterEach(() => {
        sinon.restore();
      });

      it("| when preview and write fails, expect throws error", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperPreviewAndWriteAskResources.callsArgWith(3, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when preview and write returns CliWarn, expect display warnings", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperPreviewAndWriteAskResources.callsArgWith(3, TEST_WARN);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_WARN);
        // verify
        expect(warnStub).calledOnceWith(TEST_WARN.message);
        expect(infoStub).not.called;
        expect(errorStub).not.called;
      });

      it("| when post init executions fails, expect throws error", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperPreviewAndWriteAskResources.callsArgWith(3);
        helperBootstrapSkillInfra.callsArgWith(3, TEST_ERROR);
        // call
        await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
        // verify
        expect(errorStub).calledOnceWith(TEST_ERROR);
        expect(infoStub).not.called;
        expect(warnStub).not.called;
      });

      it("| when all the steps succeed, expect seeing success message", async () => {
        // setup
        const TEST_CMD = {
          profile: TEST_PROFILE,
        };
        helperPreviewAndWriteAskResources.callsArgWith(3);
        helperBootstrapSkillInfra.callsArgWith(3);
        // call
        await instance.handle(TEST_CMD);
        // verify
        expect(infoStub).calledOnceWith('\nSuccess! Run "ask deploy" to deploy your skill.');
        expect(errorStub).not.called;
        expect(warnStub).not.called;
      });
    });
  });

  describe("command handle - get skill name", () => {
    let instance: InitCommand;
    const TEST_CMD = {
      profile: TEST_PROFILE,
      hostedSkillId: TEST_HOSTED_SKILL_ID,
    };

    beforeEach(() => {
      instance = new InitCommand(optionModel as OptionModel);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| get skill manifest fails, expect error thrown", async () => {
      // setup
      sinon.stub(httpClient, "request").callsArgWith(3, TEST_ERROR); // stub getManifest request
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      // verify
      expect(errorStub).calledOnceWith(TEST_ERROR);
    });

    it("| get skill manifest response with status code >= 300, expect error thrown", async () => {
      // setup
      const GET_MANIFEST_ERROR = {
        statusCode: 403,
        body: {
          error: TEST_ERROR,
        },
      };
      sinon.stub(httpClient, "request").callsArgWith(3, null, GET_MANIFEST_ERROR); // stub getManifest request
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(jsonView.toString({error: TEST_ERROR}));
      // verify
      expect(errorStub).calledOnceWith(jsonView.toString({error: TEST_ERROR}));
    });

    it("| get skill manifest succeed without locales, expect error thrown", async () => {
      // setup
      const TEST_NO_FOUND_ERROR = "No skill name found.";
      const GET_MANIFEST_RESPONSE_NO_LOCALES = {
        statusCode: 200,
        headers: {},
        body: {
          manifest: {
            publishingInformation: {},
          },
        },
      };
      sinon.stub(httpClient, "request").callsArgWith(3, null, GET_MANIFEST_RESPONSE_NO_LOCALES); // stub getManifest request
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_NO_FOUND_ERROR);
      // verify
      expect(errorStub).calledOnceWith(TEST_NO_FOUND_ERROR);
    });
  });

  describe("command handle - confirm project folder name", () => {
    let instance: InitCommand;
    const TEST_CMD = {
      profile: TEST_PROFILE,
      hostedSkillId: TEST_HOSTED_SKILL_ID,
    };
    const TEST_LOCALE = "en-US";

    beforeEach(() => {
      instance = new InitCommand(optionModel as OptionModel);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| get project name, ui get project folder name fails, expect error thrown", async () => {
      // setup
      const GET_MANIFEST_RESPONSE = {
        statusCode: 200,
        headers: {},
        body: {
          manifest: {
            publishingInformation: {
              locales: {
                [TEST_LOCALE]: {
                  name: TEST_SKILL_NAME,
                },
              },
            },
          },
        },
      };
      const TEST_UI_ERROR = "TEST_UI_ERROR";
      sinon.stub(httpClient, "request").callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
      sinon.stub(ui, "getProjectFolderName").callsArgWith(1, TEST_UI_ERROR);
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_UI_ERROR);
      // verify
      expect(errorStub).calledOnceWith(TEST_UI_ERROR);
    });
  });

  describe("command handle - clone", () => {
    let instance: InitCommand;
    const TEST_CMD = {
      profile: TEST_PROFILE,
      hostedSkillId: TEST_HOSTED_SKILL_ID,
    };
    const TEST_LOCALE_CA = "en-CA";

    beforeEach(() => {
      instance = new InitCommand(optionModel as OptionModel);
      sinon.stub(AuthorizationController.prototype, "tokenRefreshAndRead").callsArgWith(1);
      sinon.stub(profileHelper, "runtimeProfile").returns(TEST_PROFILE);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| hosted skill controller updateAskSystemScripts fails, expect error thrown", async () => {
      // setup
      const TEST_FOLDER_NAME = "TEST_FOLDER_NAME";
      const GET_MANIFEST_RESPONSE = {
        statusCode: 200,
        headers: {},
        body: {
          manifest: {
            publishingInformation: {
              locales: {
                [TEST_LOCALE_CA]: {
                  name: TEST_SKILL_NAME,
                },
              },
            },
          },
        },
      };
      sinon.stub(httpClient, "request").callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
      sinon.stub(ui, "getProjectFolderName").callsArgWith(1, null, TEST_FOLDER_NAME);
      sinon.stub(HostedSkillController.prototype, "updateAskSystemScripts").callsArgWith(0, TEST_ERROR);
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      // verify
      expect(errorStub).calledOnceWith(TEST_ERROR);
    });

    it("| hosted skill controller clone fails, expect error thrown", async () => {
      // setup
      const TEST_FOLDER_NAME = "TEST_FOLDER_NAME";
      const GET_MANIFEST_RESPONSE = {
        statusCode: 200,
        headers: {},
        body: {
          manifest: {
            publishingInformation: {
              locales: {
                [TEST_LOCALE_CA]: {
                  name: TEST_SKILL_NAME,
                },
              },
            },
          },
        },
      };
      sinon.stub(httpClient, "request").callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
      sinon.stub(ui, "getProjectFolderName").callsArgWith(1, null, TEST_FOLDER_NAME);
      sinon.stub(HostedSkillController.prototype, "updateAskSystemScripts").callsArgWith(0, null);
      sinon.stub(HostedSkillController.prototype, "clone").callsArgWith(3, TEST_ERROR);
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      // verify
      expect(errorStub).calledOnceWith(TEST_ERROR);
    });

    it("| downloadAskScripts fails, expect error thrown", async () => {
      // setup
      const TEST_FOLDER_NAME = "TEST_FOLDER_NAME";
      const TEST_LOCALE = "en-US";
      const GET_MANIFEST_RESPONSE = {
        statusCode: 200,
        headers: {},
        body: {
          manifest: {
            publishingInformation: {
              locales: {
                [TEST_LOCALE]: {
                  name: TEST_SKILL_NAME,
                },
              },
            },
          },
        },
      };
      sinon.stub(httpClient, "request").callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
      sinon.stub(ui, "getProjectFolderName").callsArgWith(1, null, TEST_FOLDER_NAME);
      sinon.stub(HostedSkillController.prototype, "updateAskSystemScripts").callsArgWith(0, null);
      sinon.stub(HostedSkillController.prototype, "clone").callsArgWith(3, null);
      sinon.stub(HostedSkillController.prototype, "updateSkillPrePushScript").callsArgWith(1, TEST_ERROR);
      // call
      await expect(instance.handle(TEST_CMD)).rejectedWith(TEST_ERROR);
      // verify
      expect(errorStub).calledOnceWith(TEST_ERROR);
    });

    it("| hosted skill controller clone succeed, expect project initialized", async () => {
      // setup
      const TEST_FOLDER_NAME = "TEST_FOLDER_NAME";
      const TEST_LOCALE = "en-US";
      const GET_MANIFEST_RESPONSE = {
        statusCode: 200,
        headers: {},
        body: {
          manifest: {
            publishingInformation: {
              locales: {
                [TEST_LOCALE]: {
                  name: TEST_SKILL_NAME,
                },
              },
            },
          },
        },
      };
      sinon.stub(httpClient, "request").callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
      sinon.stub(ui, "getProjectFolderName").callsArgWith(1, null, TEST_FOLDER_NAME);
      sinon.stub(HostedSkillController.prototype, "updateAskSystemScripts").callsArgWith(0, null);
      sinon.stub(HostedSkillController.prototype, "clone").callsArgWith(3, null);
      sinon.stub(HostedSkillController.prototype, "updateSkillPrePushScript").callsArgWith(1, null);
      // call
      await instance.handle(TEST_CMD);
      // verify
      expect(infoStub).calledOnceWith(`\n${TEST_SKILL_NAME} successfully initialized.\n`);
    });
  });
});
