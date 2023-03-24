import {expect} from "chai";
import sinon from "sinon";

import * as helper from "../../../../lib/commands/dialog/helper";
import {DialogController} from "../../../../lib/controllers/dialog-controller";

describe("# Commands Dialog test - helper test", () => {
  describe("# test validateDialogArgs", () => {
    const TEST_SKILL_ID = "skillId";
    const TEST_STAGE = "development";
    const TEST_LOCALE = "en-US";
    const TEST_MSG = "test_msg";
    let dialogMode: DialogController;

    let manifestStub: sinon.SinonStub;
    let enablementStub: sinon.SinonStub;

    beforeEach(() => {
      manifestStub = sinon.stub();
      enablementStub = sinon.stub();
      dialogMode = new DialogController({
        smapiClient: {
          skill: {
            manifest: {
              getManifest: manifestStub,
            } as any,
            getSkillEnablement: enablementStub,
          } as any,
        } as any,
        skillId: TEST_SKILL_ID,
        stage: TEST_STAGE,
        locale: TEST_LOCALE,
      } as any);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| Skill Manifest request error runs error callback", async () => {
      // setup
      manifestStub.rejects(Error(TEST_MSG));
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .eventually.rejectedWith(TEST_MSG);
    });

    it("| Skill Manifest non 200 response runs error callback", async () => {
      // setup
      const errorMsg = `SMAPI get-manifest request error: 400 - ${TEST_MSG}`;
      manifestStub.resolves({
        statusCode: 400,
        body: {
          message: TEST_MSG,
        },
      });
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .rejectedWith(errorMsg);
    });

    it("| Skill Manifest response body with no api JSON field runs error callback", async () => {
      // setup
      const errorMsg = 'Ensure "manifest.apis" object exists in the skill manifest.';
      manifestStub.resolves({
        statusCode: 200,
        body: {},
      });
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .rejectedWith(errorMsg);
    });

    it("| Skill Manifest response body with api JSON field but no api keys runs error callback", async () => {
      // setup
      const errorMsg = "Dialog command only supports custom skill type.";
      manifestStub.resolves({
        statusCode: 200,
        body: {
          manifest: {
            apis: {},
          },
        },
      });
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .rejectedWith(errorMsg);
    });

    it("| Skill Manifest response body with api JSON field not custom runs error callback", async () => {
      // setup
      const errorMsg = 'Dialog command only supports custom skill type, but current skill is a "smartHome" type.';
      manifestStub.resolves({
        statusCode: 200,
        body: {
          manifest: {
            apis: {
              smartHome: {},
            },
          },
        },
      });
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .rejectedWith(errorMsg);
    });

    it("| Skill Manifest response body with no locales JSON field runs error callback", async () => {
      // setup
      const errorMsg = 'Ensure the "manifest.publishingInformation.locales" exists in the skill manifest before simulating your skill.';
      manifestStub.resolves({
        statusCode: 200,
        body: {
          manifest: {
            apis: {
              custom: {},
            },
          },
          publishingInformation: {},
        },
      });
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .rejectedWith(errorMsg);
    });

    it("| Skill Manifest response body does not contain locale passed into constructor runs error callback", async () => {
      // setup
      const errorMsg =
        "Locale en-US was not found for your skill. " + "Ensure the locale you want to simulate exists in your publishingInformation.";
      manifestStub.resolves({
        statusCode: 200,
        body: {
          manifest: {
            apis: {
              custom: {},
            },
            publishingInformation: {
              locales: {},
            },
          },
        },
      });
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .rejectedWith(errorMsg);
    });

    it("| Skill Manifest callback successful, Skill Enablement request error runs error callback", async () => {
      // setup
      manifestStub.resolves({
        statusCode: 200,
        body: {
          manifest: {
            apis: {
              custom: {},
            },
            publishingInformation: {
              locales: {
                "en-US": {},
              },
            },
          },
        },
      });
      enablementStub.rejects(Error(TEST_MSG));
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .eventually.rejectedWith(TEST_MSG);
    });

    it("| Skill Manifest callback successful, Skill Enablement response of >= 300 runs error callback", async () => {
      // setup
      const errorMsg = `SMAPI get-skill-enablement request error: 400 - ${TEST_MSG}`;
      manifestStub.resolves({
        statusCode: 200,
        body: {
          manifest: {
            apis: {
              custom: {},
            },
            publishingInformation: {
              locales: {
                "en-US": {},
              },
            },
          },
        },
      });
      enablementStub.resolves({
        statusCode: 400,
        body: {
          message: TEST_MSG,
        },
      });
      // call
      await expect(helper.validateDialogArgs(dialogMode))
        // verify
        .rejectedWith(errorMsg);
    });

    it("| Skill Manifest callback successful, Skill Enablement successful", async () => {
      // setup
      const TEST_RES = {
        statusCode: 204,
        body: {
          message: TEST_MSG,
        },
      };
      manifestStub.resolves({
        statusCode: 200,
        body: {
          manifest: {
            apis: {
              custom: {},
            },
            publishingInformation: {
              locales: {
                "en-US": {},
              },
            },
          },
        },
      });
      enablementStub.resolves(TEST_RES);
      // call
      // verify
      expect(helper.validateDialogArgs(dialogMode)).eventually.fulfilled;
    });
  });
});
