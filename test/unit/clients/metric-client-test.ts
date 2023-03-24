import chai from "chai";
import {v4 as uuid} from "uuid";
import chaiUuid from "chai-uuid";
import chaiJsonSchema from "chai-json-schema";
import sinon from "sinon";
import {METRICS} from "../../../lib/utils/constants";
import profileHelper from "../../../lib/utils/profile-helper";
import AppConfig from "../../../lib/model/app-config";
import {MetricClient, MetricActionResult, MetricAction} from "../../../lib/clients/metric-client";
import jsonSchema from "../../../test/fixture/ask-devtools-metrics.schema.json";

const {expect} = chai;
chai.use(chaiUuid);
chai.use(chaiJsonSchema);

describe("Clients test - cli metric client", () => {
  const getShareUsageStub: sinon.SinonStub = sinon.stub();
  const getMachineIdStub: sinon.SinonStub = sinon.stub();
  const setMachineIdStub: sinon.SinonStub = sinon.stub();
  const writeConfigStub: sinon.SinonStub = sinon.stub();
  let isEnvProfileStub: sinon.SinonStub;
  let configExistsStub: sinon.SinonStub;
  let shareUsageVariableValue: string | undefined;

  beforeEach(() => {
    shareUsageVariableValue = process.env.ASK_SHARE_USAGE;
    delete process.env.ASK_SHARE_USAGE;
    configExistsStub = sinon.stub(AppConfig, "configFileExists").returns(true);
    isEnvProfileStub = sinon.stub(profileHelper, "isEnvProfile").returns(false);
    sinon.stub(AppConfig.prototype, "read");
    sinon.stub(AppConfig, "getInstance").returns({
      getShareUsage: getShareUsageStub.returns(true),
      getMachineId: getMachineIdStub.returns(uuid()),
      setMachineId: setMachineIdStub,
      write: writeConfigStub,
      read: sinon.stub(),
    });
  });

  afterEach(() => {
    process.env.ASK_SHARE_USAGE = shareUsageVariableValue;
    sinon.restore();
  });

  describe("# constructor validation", () => {
    it("| creates instance of MetricClient, expect initial data to be set", () => {
      // set up
      const client = new MetricClient();

      // call
      const data = client.getData();

      // verify
      expect(data).have.keys(["actions", "version", "machineId", "newUser", "timeStarted", "clientId", "timeUploaded"]);
      expect(data.actions).eql([]);
      expect(data.timeStarted).instanceof(Date);
    });

    it("| creates machine id if it does not exist", () => {
      getMachineIdStub.returns(undefined);

      // call
      new MetricClient();

      // verify
      expect(setMachineIdStub.callCount).eql(1);
      expect(writeConfigStub.callCount).eql(1);
    });
  });

  describe("# start action validation", () => {
    let client: MetricClient;
    beforeEach(() => {
      client = new MetricClient();
    });

    it("| adds action, expect action to be set", () => {
      const name = "ask.clone";
      const type = "userCommand";
      // call
      client.startAction(name, type);

      const {actions} = client.getData();
      const [action] = actions;

      // verify
      expect(actions).instanceof(Array).have.lengthOf(1);
      expect(action).include({endTime: null, failureMessage: "", name, result: null, type});
      expect(action.startTime).instanceof(Date);
      expect(action.id).to.be.a.uuid();
    });

    it("| adds multiple action, expect actions to be set", () => {
      const startActionsParams = [
        {name: "ask.clone", type: "userCommand"},
        {name: "ask.init", type: "internalCommand"},
        {name: "ask.foo", type: "userCommand"},
      ];

      // call
      startActionsParams.forEach((params) => {
        client.startAction(params.name, params.type);
      });

      const actions = client.getData().actions;

      // verify
      expect(actions).instanceof(Array).have.lengthOf(startActionsParams.length);
      actions.forEach((action: MetricAction, index: number) => {
        const {name, type} = startActionsParams[index];
        expect(action).include({endTime: null, failureMessage: "", name, result: null, type});
        expect(action.startTime).instanceof(Date);
        expect(action.id).to.be.a.uuid();
      });
    });

    it("| adds action with options, expect options to be set", () => {
      // sample: ask dialog --locale en-US --replay personalfile.json
      const actionName = "dialog",
        actionType = "userCommand";
      const sampleOptions: {[key: string]: string} = {
        locale: "en-US",
        replay: "personalfile.json",
      };
      const optionNames = Object.keys(sampleOptions);
      client.startAction(actionName, actionType);

      // call
      optionNames.forEach((name) => {
        client.setOption(name, sampleOptions[name]);
      });

      // verify
      const data = client.getData();
      const lastAction = data.actions[data.actions.length - 1];
      const options = lastAction.options;

      expect(options).instanceOf(Array).have.lengthOf(optionNames.length);
      expect(options).has.members(optionNames);
    });

    it("| adds action with options, expect only storeable values are set", () => {
      // sample: ask dialog --locale en-US --replay personalfile.json
      const actionName = "dialog",
        actionType = "userCommand";
      const sampleOptions: {[key: string]: string} = {
        locale: "en-US",
        replay: "personalfile.json",
      };
      const optionNames = Object.keys(sampleOptions);
      client.startAction(actionName, actionType);

      // call
      optionNames.forEach((name) => {
        client.setOption(name, sampleOptions[name]);
      });

      // verify
      // only the storeable keys are allowed in telemetry
      const data = client.getData();
      const lastAction = data.actions[data.actions.length - 1];
      const optionData = lastAction.optionData;

      optionNames.forEach((name) => {
        if (METRICS.STOREABLE_KEYS.includes(name)) {
          expect(Object.keys(optionData).includes(name)).to.be.true; // expect storeable things allowed
          expect(optionData[name]).to.equal(sampleOptions[name]);
        } else {
          expect(Object.keys(optionData).includes(name)).to.be.false; // ...and nothing else
        }
      });
    });
  });

  describe("# end action validation", () => {
    let client: MetricClient;
    let action: MetricAction;
    const name: string = "ask.clone";
    const type: string = "userCommand";
    beforeEach(() => {
      client = new MetricClient();
      action = client.startAction(name, type);
    });

    it("| ends action with success, expect end event to be set with success status", () => {
      // call
      action.end();

      // verify
      expect(action).include({failureMessage: "", name, result: MetricActionResult.SUCCESS, type});
      expect(action.startTime).instanceof(Date);
      expect(action.endTime).instanceof(Date);
      expect(action.id).to.be.a.uuid();
    });

    it("| ends action that was already ended, expect endTime of originally ended action to not change", () => {
      // call
      // close first time
      action.end();
      const originalEndTime = action.endTime;

      // close second time
      action.end();
      const endTimeAfterSecondEndRequest = action.endTime;

      // verify
      expect(action).include({failureMessage: "", name, result: MetricActionResult.SUCCESS, type});
      expect(originalEndTime).eql(endTimeAfterSecondEndRequest);
      expect(action.startTime).instanceof(Date);
      expect(action.endTime).instanceof(Date);
      expect(action.id).to.be.a.uuid();
    });

    it("| ends action with error message, expect end event to be set with failure status", () => {
      const failureMessage = "Boom!";
      // call
      action.end(failureMessage);

      // verify
      expect(action).include({failureMessage, name, result: MetricActionResult.FAILURE, type});
      expect(action.startTime).instanceof(Date);
      expect(action.endTime).instanceof(Date);
      expect(action.id).to.be.a.uuid();
    });

    it("| ends action with error object, expect end event to be set with failure status", () => {
      const failureMessage = "Boom!";
      // call
      action.end(new Error(failureMessage));

      // verify
      expect(action).include({failureMessage, name, result: MetricActionResult.FAILURE, type});
      expect(action.startTime).instanceof(Date);
      expect(action.endTime).instanceof(Date);
      expect(action.id).to.be.a.uuid();
    });
  });

  describe("# sends metrics validation, for various commands", () => {
    let client: MetricClient;
    let httpClientPostStub: sinon.SinonStub;

    // expectations when post succeeds
    const verifyActionSuccess = async (name: string) => {
      httpClientPostStub = sinon.stub(client.httpClient, "post").resolves({});

      client.startAction(name, "userCommand");

      // call
      const {success} = await client.sendData();

      // verify
      const [calledUrl, calledPayload] = httpClientPostStub.args[0];

      expect(success).eql(true);
      expect(httpClientPostStub.calledOnce).eql(true);
      expect(calledUrl).eql(METRICS.ENDPOINT);
      expect(JSON.parse(calledPayload)).to.be.a.jsonSchema(jsonSchema);
    };

    // expectations when post fails
    const verifyActionFails = async (name: string) => {
      httpClientPostStub = sinon.stub(client.httpClient, "post").rejects();

      client.startAction(name, "userCommand");

      // call
      const {success} = await client.sendData();

      // verify
      const [calledUrl, calledPayload] = httpClientPostStub.args[0];

      expect(success).eql(false);
      expect(httpClientPostStub.calledThrice).eql(true);
      expect(calledUrl).eql(METRICS.ENDPOINT);
      expect(JSON.parse(calledPayload)).to.be.a.jsonSchema(jsonSchema);
    };

    beforeEach(() => {
      client = new MetricClient();
    });

    afterEach(() => {
      sinon.restore();
    });

    // smapi, data sent
    it("| sends data for smapi, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("smapi");
    });

    // smapi, data can't be sent
    it("| sends data for smapi, expect metrics not sent to metric server", async () => {
      await verifyActionFails("smapi");
    });

    // non-smapi, data sent
    it("| sends data for configure, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("configure");
    });

    it("| sends data for deploy, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("deploy");
    });

    it("| sends data for new, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("new");
    });

    it("| sends data for init, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("init");
    });

    it("| sends data for dialog, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("dialog");
    });

    it("| sends data for compile, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("compile");
    });

    it("| sends data for run, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("run");
    });

    it("| sends data for decompile, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("decompile");
    });

    it("| sends data for util, expect metrics sent to metric server", async () => {
      await verifyActionSuccess("util");
    });

    // non-smapi, data can't be sent
    it("| sends data for configure, expect metrics not sent to metric server", async () => {
      await verifyActionFails("configure");
    });

    it("| sends data for deploy, expect metrics not sent to metric server", async () => {
      await verifyActionFails("deploy");
    });

    it("| sends data for new, expect metrics not sent to metric server", async () => {
      await verifyActionFails("new");
    });

    it("| sends data for init, expect metrics not sent to metric server", async () => {
      await verifyActionFails("init");
    });

    it("| sends data for dialog, expect metrics not sent to metric server", async () => {
      await verifyActionFails("dialog");
    });

    it("| sends data for compile, expect metrics not sent to metric server", async () => {
      await verifyActionFails("compile");
    });

    it("| sends data for run, expect metrics not sent to metric server", async () => {
      await verifyActionFails("run");
    });

    it("| sends data for decompile, expect metrics not sent to metric server", async () => {
      await verifyActionFails("decompile");
    });

    it("| sends data for util, expect metrics not sent to metric server", async () => {
      await verifyActionFails("util");
    });
  });

  describe("# sends metrics validation", () => {
    let client: MetricClient;
    let httpClientPostStub: sinon.SinonStub;
    const name: string = "ask.clone";
    const type: string = "userCommand";

    beforeEach(() => {
      client = new MetricClient();
      client.startAction(name, type);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| sends metrics, expect metrics to be send to metric server", async () => {
      httpClientPostStub = sinon.stub(client.httpClient, "post").resolves({});

      // call
      const {success} = await client.sendData();

      // verify
      const [calledUrl, calledPayload] = httpClientPostStub.args[0];

      expect(success).eql(true);
      expect(httpClientPostStub.calledOnce).eql(true);
      expect(calledUrl).eql(METRICS.ENDPOINT);
      expect(JSON.parse(calledPayload)).to.be.a.jsonSchema(jsonSchema);
    });

    it("| sends metrics, expect metrics not to be send to metric server when enabled is false", async () => {
      configExistsStub.returns(false);
      client = new MetricClient();
      httpClientPostStub = sinon.stub(client.httpClient, "post");

      // call
      const {success} = await client.sendData();

      // verify
      expect(success).eql(true);
      expect(httpClientPostStub.called).eql(false);
    });

    it("| sends metrics, expect metrics not to be send to metric server when ASK_SHARE_USAGE is false", async () => {
      process.env.ASK_SHARE_USAGE = "false";
      client = new MetricClient();
      httpClientPostStub = sinon.stub(client.httpClient, "post");

      // call
      const {success} = await client.sendData();

      // verify
      expect(success).eql(true);
      expect(httpClientPostStub.called).eql(false);
    });

    it("| sends metrics, expect metrics be send to metric server when using env profile", async () => {
      isEnvProfileStub.returns(true);
      client = new MetricClient();
      httpClientPostStub = sinon.stub(client.httpClient, "post").resolves({});

      // call
      const {success} = await client.sendData();

      // verify
      expect(success).eql(true);
      expect(httpClientPostStub.called).eql(true);
      expect(httpClientPostStub.args[0][1]).contains('"machine_id":"all_environmental"');
    });

    it("| sends metrics, expect to retry on transmission error", async () => {
      httpClientPostStub = sinon.stub(client.httpClient, "post").rejects();

      // call
      const {success} = await client.sendData();

      // verify
      const [calledUrl, calledPayload] = httpClientPostStub.args[0];

      expect(success).eql(false);
      expect(httpClientPostStub.calledThrice).eql(true);
      expect(calledUrl).eql(METRICS.ENDPOINT);
      expect(JSON.parse(calledPayload)).to.be.a.jsonSchema(jsonSchema);
    });
  });
});
