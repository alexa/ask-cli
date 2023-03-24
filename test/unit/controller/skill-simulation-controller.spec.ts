import {expect} from "chai";
import sinon from "sinon";

import jsonView from "../../../lib/view/json-view";

import {SkillSimulationController, SkillSimulationControllerProps} from "../../../lib/controllers/skill-simulation-controller";

const skillSimulatorBaseProps: SkillSimulationControllerProps = {
  profile: "default",
  debug: true,
  skillId: "a1b2c3",
  locale: "en-US",
  stage: "DEVELOPMENT",
  saveSkillIo: "",
};

describe("Controller test - skill simulation controller test", () => {
  describe("# test constructor", () => {
    it("| constructor with config parameter returns SkillSimulationCotroller object", () => {
      // call
      const simulationController = new SkillSimulationController(skillSimulatorBaseProps);
      // verify
      expect(simulationController).to.be.instanceOf(SkillSimulationController);
    });

    it("| constructor with empty config object returns SkillSimulationController object", () => {
      // call
      const simulationController = new SkillSimulationController({} as any);
      // verify
      expect(simulationController).to.be.instanceOf(SkillSimulationController);
    });

    it("| constructor with no args throws exception", () => {
      try {
        // call
        new SkillSimulationController({} as any);
      } catch (err) {
        // verify
        expect(err).to.match(new RegExp("Cannot have an undefined configuration."));
      }
    });
  });

  describe("# test class method - startSkillSimulation", () => {
    let simulateSkillStub: sinon.SinonStub;
    let simulationController: SkillSimulationController;
    const TEST_MSG = "TEST_MSG";

    before(() => {
      simulationController = new SkillSimulationController(skillSimulatorBaseProps);
      simulateSkillStub = sinon.stub(simulationController.smapiClient.skill.test, "simulateSkill");
    });

    after(() => {
      sinon.restore();
    });

    it("| test for SMAPI.test.simulateSkill gives correct 200 response", async () => {
      // setup
      const TEST_RES = {
        statusCode: 200,
        headers: {},
        body: {
          id: "a1b2c3",
          status: "IN_PROGRESS",
          result: null,
        },
      };
      simulateSkillStub.resolves(TEST_RES);
      // call
      const response = await simulationController.startSkillSimulation(TEST_MSG, true);

      expect(response.statusCode).equal(200);
    });

    it("| test for SMAPI.test.simulateSkill gives correct 300+ error", async () => {
      // setup
      const TEST_RES = {
        statusCode: 400,
        headers: {},
        body: {
          message: TEST_MSG,
        },
      };
      simulateSkillStub.resolves(TEST_RES);
      // call
      await expect(simulationController.startSkillSimulation(TEST_MSG, true)).rejectedWith(jsonView.toString(TEST_RES.body));
    });

    it("| test for SMAPI.test.simulateSkill gives correct error", async () => {
      // setup
      simulateSkillStub.rejects(Error(TEST_MSG));
      // call
      await expect(simulationController.startSkillSimulation(TEST_MSG, true)).rejectedWith(TEST_MSG);
    });
  });

  describe("# test class method - getSkillSimulationResult", () => {
    let simulationController: SkillSimulationController;
    let getSimulationStub: sinon.SinonStub;
    const TEST_MSG = "TEST_MSG";

    beforeEach(() => {
      simulationController = new SkillSimulationController(skillSimulatorBaseProps);
      getSimulationStub = sinon.stub(simulationController.smapiClient.skill.test, "getSimulation");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| getSimulation polling terminates on SUCCESSFUL status received", async () => {
      // setup
      const TEST_RES = {
        statusCode: 200,
        headers: {},
        body: {
          status: "SUCCESSFUL",
        },
      };
      getSimulationStub.resolves(TEST_RES);
      // call
      const response = await simulationController.getSkillSimulationResult("");
      // verify
      expect(response.body.status).equal("SUCCESSFUL");
    });

    it("| getSimulation polling terminates on statusCode greater than 300", async () => {
      // setup
      const TEST_RES = {
        statusCode: 400,
        headers: {},
        body: {
          status: "SUCCESSFUL",
        },
      };
      getSimulationStub.resolves(TEST_RES);
      // call
      try {
        await simulationController.getSkillSimulationResult("");
      } catch (err) {
        // verify
        expect((err as any).message).equal(jsonView.toString(TEST_RES.body));
      }
    });

    it("| getSimulation polling terminates on FAILED status received", async () => {
      // setup
      const TEST_RES = {
        statusCode: 200,
        headers: {},
        body: {
          status: "FAILED",
          result: {
            error: {
              message: "error msg",
            },
          },
        },
      };
      getSimulationStub.resolves(TEST_RES);
      // call
      try {
        await simulationController.getSkillSimulationResult("");
      } catch (err) {
        // verify
        expect((err as any).message).equal("Failed to simulate skill. Error: error msg");
      }
    });

    it("| getSimulation polling terminates when max retry is reached from request error", async () => {
      // setup
      getSimulationStub.rejects(TEST_MSG);
      // call
      try {
        await simulationController.getSkillSimulationResult("");
      } catch (err) {
        // verify
        expect((err as any).message).equal(TEST_MSG);
      }
    });
  });
});
