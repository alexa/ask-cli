const chai = require('chai');
const uuid = require('uuid/v4');
const chaiUuid = require('chai-uuid');
const chaiJsonSchema = require('chai-json-schema');
const sinon = require('sinon');
const { METRICS } = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const AppConfig = require('@src/model/app-config');
const { MetricClient, MetricActionResult } = require('@src/clients/metric-client');
const jsonSchema = require('@test/fixture/ask-devtools-metrics.schema.json');

const { expect } = chai;
chai.use(chaiUuid);
chai.use(chaiJsonSchema);

describe('Clients test - cli metric client', () => {
    const getShareUsageStub = sinon.stub();
    const getMachineIdStub = sinon.stub();
    const setMachineIdStub = sinon.stub();
    const writeConfigStub = sinon.stub();
    let isEnvProfileStub;
    let configExistsStub;
    let shareUsageVariableValue;

    beforeEach(() => {
        shareUsageVariableValue = process.env.ASK_SHARE_USAGE;
        delete process.env.ASK_SHARE_USAGE;
        configExistsStub = sinon.stub(AppConfig, 'configFileExists').returns(true);
        isEnvProfileStub = sinon.stub(profileHelper, 'isEnvProfile').returns(false);
        sinon.stub(AppConfig.prototype, 'read');
        sinon.stub(AppConfig, 'getInstance').returns({
            getShareUsage: getShareUsageStub.returns(true),
            getMachineId: getMachineIdStub.returns(uuid()),
            setMachineId: setMachineIdStub,
            write: writeConfigStub,
            read: sinon.stub()
        });
    });

    afterEach(() => {
        process.env.ASK_SHARE_USAGE = shareUsageVariableValue;
        sinon.restore();
    });

    describe('# constructor validation', () => {
        it('| creates instance of MetricClient, expect initial data to be set', () => {
            // set up
            const client = new MetricClient();

            // call
            const data = client.getData();

            // verify
            expect(data).have.keys(['actions', 'version', 'machineId', 'newUser', 'timeStarted', 'clientId', 'timeUploaded']);
            expect(data.actions).eql([]);
            expect(data.timeStarted).instanceof(Date);
        });

        it('| creates machine id if it does not exist', () => {
            getMachineIdStub.returns(undefined);

            // call
            new MetricClient();

            // verify
            expect(setMachineIdStub.callCount).eql(1);
            expect(writeConfigStub.callCount).eql(1);
        });
    });

    describe('# start action validation', () => {
        let client;
        beforeEach(() => {
            client = new MetricClient();
        });

        it('| adds action, expect action to be set', () => {
            const name = 'ask.clone';
            const type = 'userCommand';
            // call
            client.startAction(name, type);

            const { actions } = client.getData();
            const [action] = actions;

            // verify
            expect(actions).instanceof(Array).have.lengthOf(1);
            expect(action).include({ endTime: null, failureMessage: '', name, result: null, type });
            expect(action.startTime).instanceof(Date);
            expect(action.id).to.be.a.uuid();
        });

        it('| adds multiple action, expect actions to be set', () => {
            const startActionsParams = [
                { name: 'ask.clone', type: 'userCommand' },
                { name: 'ask.init', type: 'internalCommand' },
                { name: 'ask.foo', type: 'userCommand' }
            ];

            // call
            startActionsParams.forEach((params) => {
                client.startAction(params.name, params.type);
            });

            const { actions } = client.getData();

            // verify
            expect(actions).instanceof(Array).have.lengthOf(startActionsParams.length);
            actions.forEach((action, index) => {
                const { name, type } = startActionsParams[index];
                expect(action).include({ endTime: null, failureMessage: '', name, result: null, type });
                expect(action.startTime).instanceof(Date);
                expect(action.id).to.be.a.uuid();
            });
        });
    });

    describe('# end action validation', () => {
        let client;
        let action;
        const name = 'ask.clone';
        const type = 'userCommand';
        beforeEach(() => {
            client = new MetricClient();
            action = client.startAction(name, type);
        });

        it('| ends action with success, expect end event to be set with success status', () => {
            // call
            action.end();

            // verify
            expect(action).include({ failureMessage: '', name, result: MetricActionResult.SUCCESS, type });
            expect(action.startTime).instanceof(Date);
            expect(action.endTime).instanceof(Date);
            expect(action.id).to.be.a.uuid();
        });

        it('| ends action that was already ended, expect endTime of originally ended action to not change', () => {
            // call
            // close first time
            action.end();
            const originalEndTime = action.endTime;

            // close second time
            action.end();
            const endTimeAfterSecondEndRequest = action.endTime;

            // verify
            expect(action).include({ failureMessage: '', name, result: MetricActionResult.SUCCESS, type });
            expect(originalEndTime).eql(endTimeAfterSecondEndRequest);
            expect(action.startTime).instanceof(Date);
            expect(action.endTime).instanceof(Date);
            expect(action.id).to.be.a.uuid();
        });

        it('| ends action with error message, expect end event to be set with failure status', () => {
            const failureMessage = 'Boom!';
            // call
            action.end(failureMessage);

            // verify
            expect(action).include({ failureMessage, name, result: MetricActionResult.FAILURE, type });
            expect(action.startTime).instanceof(Date);
            expect(action.endTime).instanceof(Date);
            expect(action.id).to.be.a.uuid();
        });

        it('| ends action with error object, expect end event to be set with failure status', () => {
            const failureMessage = 'Boom!';
            // call
            action.end(new Error(failureMessage));

            // verify
            expect(action).include({ failureMessage, name, result: MetricActionResult.FAILURE, type });
            expect(action.startTime).instanceof(Date);
            expect(action.endTime).instanceof(Date);
            expect(action.id).to.be.a.uuid();
        });
    });

    describe('# sends metrics validation', () => {
        let client;
        let httpClientPostStub;
        const name = 'ask.clone';
        const type = 'userCommand';

        beforeEach(() => {
            client = new MetricClient();
            client.startAction(name, type);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| sends metrics, expect metrics to be send to metric server', async () => {
            httpClientPostStub = sinon.stub(client.httpClient, 'post').resolves({});

            // call
            const { success } = await client.sendData();

            // verify
            const [calledUrl, calledPayload] = httpClientPostStub.args[0];

            expect(success).eql(true);
            expect(httpClientPostStub.calledOnce).eql(true);
            expect(calledUrl).eql(METRICS.ENDPOINT);
            expect(JSON.parse(calledPayload)).to.be.jsonSchema(jsonSchema);
        });

        it('| sends metrics, expect metrics not to be send to metric server when enabled is false', async () => {
            configExistsStub.returns(false);
            client = new MetricClient();
            httpClientPostStub = sinon.stub(client.httpClient, 'post');

            // call
            const { success } = await client.sendData();

            // verify
            expect(success).eql(true);
            expect(httpClientPostStub.called).eql(false);
        });

        it('| sends metrics, expect metrics not to be send to metric server when ASK_SHARE_USAGE is false', async () => {
            process.env.ASK_SHARE_USAGE = false;
            client = new MetricClient();
            httpClientPostStub = sinon.stub(client.httpClient, 'post');

            // call
            const { success } = await client.sendData();

            // verify
            expect(success).eql(true);
            expect(httpClientPostStub.called).eql(false);
        });

        it('| sends metrics, expect metrics be send to metric server when using env profile', async () => {
            isEnvProfileStub.returns(true);
            client = new MetricClient();
            httpClientPostStub = sinon.stub(client.httpClient, 'post').resolves({});

            // call
            const { success } = await client.sendData();

            // verify
            expect(success).eql(true);
            expect(httpClientPostStub.called).eql(true);
            expect(httpClientPostStub.args[0][1]).contains('"machine_id":"all_environmental"');
        });

        it('| sends metrics, expect to retry on transmission error', async () => {
            httpClientPostStub = sinon.stub(client.httpClient, 'post').rejects();

            // call
            const { success } = await client.sendData();

            // verify
            const [calledUrl, calledPayload] = httpClientPostStub.args[0];

            expect(success).eql(false);
            expect(httpClientPostStub.calledThrice).eql(true);
            expect(calledUrl).eql(METRICS.ENDPOINT);
            expect(JSON.parse(calledPayload)).to.be.jsonSchema(jsonSchema);
        });
    });
});
