const { expect } = require('chai');
const sinon = require('sinon');

const AuthorizationController = require('@src/controllers/authorization-controller');
const GetTaskCommand = require('@src/commands/smapi/appended-commands/get-task');
const httpClient = require('@src/clients/http-client');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');


describe('Command get-task test ', () => {
    let infoStub;
    let errorStub;
    let instance;
    const cmdOptions = {
        skillId: 'test',
        taskName: 'test',
        taskVersion: 'test'
    };

    beforeEach(() => {
        infoStub = sinon.stub();
        errorStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({
            info: infoStub,
            error: errorStub,
        });
        sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        sinon.stub(profileHelper, 'runtimeProfile').returns('test');
        instance = new GetTaskCommand(optionModel);
    });

    it('| should have options configured', () => {
        expect(instance.name()).be.a('string');
        expect(instance.description()).be.a('string');
        expect(instance.requiredOptions()).be.a('array');
        expect(instance.optionalOptions()).be.a('array');
    });

    it('| should display task definition', (done) => {
        const definition = '{ "x":"y", "b": "z"}';
        const expectedOutput = jsonView.toString(JSON.parse(definition));
        sinon.stub(httpClient, 'request').yields(null, { body: { definition }, statusCode: 200 });

        instance.handle(cmdOptions, () => {
            expect(infoStub.calledOnceWith(expectedOutput)).eql(true);
            done();
        });
    });

    it('| should display error thrown by smapi client', (done) => {
        const testError = 'testError';
        sinon.stub(httpClient, 'request').yields(new Error(testError));

        instance.handle(cmdOptions, (err) => {
            expect(err.message).eql(testError);
            done();
        });
    });

    it('| should display error thrown by smapi server', (done) => {
        const body = { message: 'Bad request.' };
        sinon.stub(httpClient, 'request').yields(null, { body, statusCode: 400 });

        instance.handle(cmdOptions, (err) => {
            expect(err).includes('"message": "Bad request."');
            done();
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
