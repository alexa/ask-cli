const { expect } = require('chai');
const sinon = require('sinon');

const AddLocalesCommand = require('@src/commands/skill/add-locales');
const helper = require('@src/commands/skill/add-locales/helper');
const optionModel = require('@src/commands/option-model');
const ui = require('@src/commands/skill/add-locales/ui');
const profileHelper = require('@src/utils/profile-helper');
const Messenger = require('@src/view/messenger');

describe('Commands add-locales test - command class test', () => {
    const TEST_DEBUG = false;

    let infoStub;
    let errorStub;
    let warnStub;

    beforeEach(() => {
        infoStub = sinon.stub();
        errorStub = sinon.stub();
        warnStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({
            info: infoStub,
            error: errorStub,
            warn: warnStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('| validate command information is set correctly', () => {
        const instance = new AddLocalesCommand(optionModel);
        expect(instance.name()).equal('add-locales');
        expect(instance.description()).equal('add new locale(s) from existing locale or from the template');
        expect(instance.requiredOptions()).deep.equal([]);
        expect(instance.optionalOptions()).deep.equal(['profile', 'debug']);
    });

    describe('validate command handle', () => {
        const TEST_ERROR = 'command error';
        const TEST_PROFILE = 'profile';
        const TEST_LOCALES_LIST = ['1', '2', '3'];
        const TEST_LOCALES_SOURCE_MAP = new Map([
            ['1', 'file1'],
            ['2', 'file2'],
            ['3', 'file3'],
        ]);
        let instance;

        beforeEach(() => {
            instance = new AddLocalesCommand(optionModel);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| profile fails to get the runtime profile, expect error message error out', (done) => {
            // setup
            const TEST_CMD = {
                debug: TEST_DEBUG
            };
            sinon.stub(profileHelper, 'runtimeProfile').throws(TEST_ERROR);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err.name).equal(TEST_ERROR);
                expect(errorStub.args[0][0].name).equal(TEST_ERROR);
                expect(infoStub.callCount).equal(0);
                expect(warnStub.callCount).equal(0);
                done();
            });
        });

        it('| helper fails to initiate proj models, expect error message error out', (done) => {
            // setup
            const TEST_CMD = {
                debug: TEST_DEBUG
            };
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(helper, 'initiateModels').throws(TEST_ERROR);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err.name).equal(TEST_ERROR);
                expect(errorStub.args[0][0].name).equal(TEST_ERROR);
                expect(infoStub.callCount).equal(0);
                expect(warnStub.callCount).equal(0);
                done();
            });
        });

        it('| select locales fails with error, expect error message error out', (done) => {
            // setup
            const TEST_CMD = {
                debug: TEST_DEBUG
            };
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(helper, 'initiateModels').returns(null);
            sinon.stub(ui, 'selectLocales').callsArgWith(1, TEST_ERROR);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(errorStub.args[0][0]).equal(TEST_ERROR);
                expect(infoStub.callCount).equal(0);
                expect(warnStub.callCount).equal(0);
                done();
            });
        });

        it('| add locales fails with error, expect error message error out', (done) => {
            // setup
            const TEST_CMD = {
                debug: TEST_DEBUG
            };
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(helper, 'initiateModels').returns(null);
            sinon.stub(ui, 'selectLocales').callsArgWith(1, undefined, TEST_LOCALES_LIST);
            sinon.stub(helper, 'addLocales').callsArgWith(3, TEST_ERROR);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(errorStub.args[0][0]).equal(TEST_ERROR);
                expect(infoStub.callCount).equal(0);
                expect(warnStub.callCount).equal(0);
                done();
            });
        });

        it('| cmd executes without error, expect callback without error', (done) => {
            // setup
            const TEST_CMD = {
                debug: TEST_DEBUG
            };
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(helper, 'initiateModels').returns(null);
            sinon.stub(ui, 'selectLocales').callsArgWith(1, undefined, TEST_LOCALES_LIST);
            sinon.stub(helper, 'addLocales').callsArgWith(3, undefined, TEST_LOCALES_SOURCE_MAP);
            sinon.stub(ui, 'displayAddLocalesResult').returns(null);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(undefined);
                expect(errorStub.callCount).equal(0);
                expect(infoStub.callCount).equal(0);
                expect(warnStub.callCount).equal(0);
                done();
            });
        });
    });
});
