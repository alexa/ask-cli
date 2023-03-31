import {expect} from "chai";
import {
  BuildDetailStep,
  SkillStatus
} from "../../../lib/model/skill-status";

describe("Model - Skill Status ", () => {
  describe("SkillStatus", () => {
    const SMAPI_RESPONSE = {
      body: {
        interactionModel: {
          "en-US": {
            lastUpdateRequest: {
              status: "IN_PROGRESS",
              buildDetails: {
                steps: [
                  {
                    name: "LANGUAGE_MODEL_QUICK_BUILD",
                    status: "SUCCEEDED"
                  },
                  {
                    name: "LANGUAGE_MODEL_FULL_BUILD",
                    status: "SUCCEEDED"
                  },
                  {
                    name: "ALEXA_CONVERSATIONS_QUICK_BUILD",
                    status: "FAILED"
                  },
                  {
                    name: "ALEXA_CONVERSATIONS_FULL_BUILD",
                    status: "IN_PROGRESS"
                  }
                ]
              }
            }
          }
        }
      }
    }

    it("constructor initializes a SkillStatus object", () => {
      const obj: SkillStatus = new SkillStatus(SMAPI_RESPONSE);
      expect(obj).to.be.instanceOf(SkillStatus);
      // exposes an Interaction Model
      expect(obj.interactionModel).not.equal(null);
      expect(obj.interactionModel.lastUpdateRequests).not.equal(null);
      expect(obj.interactionModel.lastUpdateRequests[0]).not.equal(undefined);
      expect(obj.interactionModel.lastUpdateRequests[0].locale).equal("en-US");
      expect(obj.interactionModel.lastUpdateRequests[0].buildDetailSteps).not.equal(undefined);
      expect(Object.keys(obj.interactionModel.lastUpdateRequests[0].buildDetailSteps).length).equal(4);

      let buildDetailStep: BuildDetailStep = obj.interactionModel.lastUpdateRequests[0].getBuildDetailStep("LANGUAGE_MODEL_QUICK_BUILD");
      expect(buildDetailStep).not.equal(undefined);
      expect(buildDetailStep.buildType).equal("LANGUAGE_MODEL_QUICK_BUILD");
      expect(buildDetailStep.buildStatus).equal("SUCCEEDED");
      expect(buildDetailStep.isACBuildType).to.be.false;

      buildDetailStep = obj.interactionModel.lastUpdateRequests[0].getBuildDetailStep("LANGUAGE_MODEL_FULL_BUILD");
      expect(buildDetailStep).not.equal(undefined);
      expect(buildDetailStep.buildType).equal("LANGUAGE_MODEL_FULL_BUILD");
      expect(buildDetailStep.buildStatus).equal("SUCCEEDED");
      expect(buildDetailStep.isACBuildType).to.be.false;

      buildDetailStep = obj.interactionModel.lastUpdateRequests[0].getBuildDetailStep("ALEXA_CONVERSATIONS_QUICK_BUILD");
      expect(buildDetailStep).not.equal(undefined);
      expect(buildDetailStep.buildType).equal("ALEXA_CONVERSATIONS_QUICK_BUILD");
      expect(buildDetailStep.buildStatus).equal("FAILED");
      expect(buildDetailStep.isACBuildType).to.be.true;

      buildDetailStep = obj.interactionModel.lastUpdateRequests[0].getBuildDetailStep("ALEXA_CONVERSATIONS_FULL_BUILD");
      expect(buildDetailStep).not.equal(undefined);
      expect(buildDetailStep.buildType).equal("ALEXA_CONVERSATIONS_FULL_BUILD");
      expect(buildDetailStep.buildStatus).equal("IN_PROGRESS");
      expect(buildDetailStep.isACBuildType).to.be.true;
    });
  });
});
