import {expect} from "chai";
import {ImportStatus} from "../../../lib/model/import-status";

describe("import status", () => {
  const SKILL_ID = "test.id";
  const RESOURCE1_NAME = "InteractionModel.ar-SA";
  const RESOURCE1_STATUS = "status1";
  const RESOURCE2_NAME = "InteractionModel.pt-BR";
  const RESOURCE2_STATUS = "status2";
  const SMAPI_RESPONSE = {
    body: {
      skill: {
        skillId: SKILL_ID,
        resources: [
          {
            name: RESOURCE1_NAME,
            status: RESOURCE1_STATUS,
          },
          {
            name: RESOURCE2_NAME,
            status: RESOURCE2_STATUS,
          },
        ],
      },
    },
  };

  describe("ImportStatus Constructor", () => {
    it("when empty SMAPI response", () => {
      let importStatus: ImportStatus = new ImportStatus({});

      expect(importStatus).not.equal(null);
      expect(importStatus.skillId).equal(undefined);
      expect(importStatus.resources).not.equal(null);
      expect(importStatus.resources.length).equal(0);
    });

    it("when empty body SMAPI response", () => {
      let importStatus: ImportStatus = new ImportStatus({body: {}});

      expect(importStatus).not.equal(null);
      expect(importStatus.skillId).equal(undefined);
      expect(importStatus.resources).not.equal(null);
      expect(importStatus.resources.length).equal(0);
    });

    it("when empty skill SMAPI response", () => {
      let importStatus: ImportStatus = new ImportStatus({body: {skill: {}}});

      expect(importStatus).not.equal(null);
      expect(importStatus.skillId).equal(undefined);
      expect(importStatus.resources).not.equal(null);
      expect(importStatus.resources.length).equal(0);
    });

    it("with full SMAPI response", () => {
      let importStatus: ImportStatus = new ImportStatus(SMAPI_RESPONSE);

      expect(importStatus).not.equal(null);
      expect(importStatus.skillId).equal(SKILL_ID);
      expect(importStatus.resources).not.equal(null);
      expect(importStatus.resources.length).equal(2);
      expect(importStatus.resources[0].locale).equal("ar-SA");
      expect(importStatus.resources[0].status).equal(RESOURCE1_STATUS);
      expect(importStatus.resources[1].locale).equal("pt-BR");
      expect(importStatus.resources[1].status).equal(RESOURCE2_STATUS);
    });
  });
});
