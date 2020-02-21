const chai = require('chai');
const chaiUuid = require('chai-uuid');
const chaiJsonSchema = require('chai-json-schema');
const sinon = require('sinon');
const { MetricClient, MetricActionResult } = require('@src/clients/metric-client');
const jsonSchema = require('@test/fixture/ask-devtools-metrics.schema.json');

const { expect } = chai;
chai.use(chaiUuid);
chai.use(chaiJsonSchema);

describe('Clients test - cli metric client', () => {
    const clientOptions = {
        version: '1.0.1',
        machineId: '8b2723f2-a25e-4d2c-89df-f9f590b8bb6e',
        newUser: true,
        clientId: 'ASK CLI',
        serverUrl: 'https://somehost.com/dev/telemetry',
    };

    const { version, machineId, newUser, clientId, serverUrl } = clientOptions;

    describe('# constructor validation', () => {
        it('| creates instance of MetricClient, expect initial data to be set', () => {
            // set up
            const client = new MetricClient(clientOptions);

            // call
            const data = client.getData();

            // verify
            expect(data).include({ version, machineId, newUser, clientId, timeUploaded: null });
            expect(data.actions).eql([]);
            expect(data.timeStarted).instanceof(Date);
        });
    });

    describe('# start action validation', () => {
        let client;
        beforeEach(() => {
            client = new MetricClient(clientOptions);
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
            client = new MetricClient(clientOptions);
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
            client = new MetricClient(clientOptions);
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
            expect(calledUrl).eql(serverUrl);
            expect(JSON.parse(calledPayload)).to.be.jsonSchema(jsonSchema);
        });

        it('| sends metrics, expect metrics not to be send to metric server when enabled is false', async () => {
            httpClientPostStub = sinon.stub(client.httpClient, 'post');

            const disabledClient = new MetricClient({ enabled: false, ...clientOptions });

            // call
            const { success } = await disabledClient.sendData();

            // verify
            expect(success).eql(true);
            expect(httpClientPostStub.called).eql(false);
        });

        it('| sends metrics, expect to retry on transmission error', async () => {
            httpClientPostStub = sinon.stub(client.httpClient, 'post').rejects();

            // call
            const { success } = await client.sendData();

            // verify
            const [calledUrl, calledPayload] = httpClientPostStub.args[0];

            expect(success).eql(false);
            expect(httpClientPostStub.calledThrice).eql(true);
            expect(calledUrl).eql(serverUrl);
            expect(JSON.parse(calledPayload)).to.be.jsonSchema(jsonSchema);
        });
    });
});
