const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');

const ConfigureCommand = require('@src/commands/configure');
const helper = require('@src/commands/configure/helper');
const messages = require('@src/commands/configure/messages');
const ui = require('@src/commands/configure/ui');
const optionModel = require('@src/commands/option-model');
const AppConfig = require('@src/model/app-config');
const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');


describe('Commands Configure test - command class test', () => {
    const TEST_APP_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'cli_config');
    const TEST_PROFILE = 'default';
    const TEST_CMD = {
        profile: TEST_PROFILE
    };
    const TEST_INVALID_PROFILE = '&@%$&%@$^';
    const TEST_ERROR_MESSAGE = 'error';
    const TEST_AWS_PROFILE = 'awsProfile';
    const TEST_VENDOR_ID = 'vendorId';
    let infoStub;
    let errorStub;
    let warnStub;
    let getProfileListStub;

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
        const instance = new ConfigureCommand(optionModel);
        expect(instance.name()).eq('configure');
        expect(instance.description()).eq('helps to configure the credentials that ask-cli uses to authenticate the user to Amazon developer services');
        expect(instance.requiredOptions()).deep.eq([]);
        expect(instance.optionalOptions()).deep.eq(['no-browser', 'profile', 'debug']);
    });

    describe('validate command handle - ensure AppConfig initiated', () => {
        let instance;
        const INVALID_FILE_PATH = '/invalid/path';

        beforeEach(() => {
            instance = new ConfigureCommand(optionModel);
        });

        afterEach(() => {
            sinon.restore();
            AppConfig.dispose();
        });

        it('| AppConfig creation, expect throw error', (done) => {
            // setup
            sinon.stub(path, 'join').returns(INVALID_FILE_PATH);
            sinon.stub(fs, 'existsSync').returns(true);

            // call
            instance.handle(TEST_CMD, (err, askProfile) => {
                // verify
                expect(infoStub.args[0][0]).eq(messages.ASK_CLI_CONFIGURATION_MESSAGE);
                expect(err.message).eq(`No access to read/write file ${INVALID_FILE_PATH}.`);
                expect(askProfile).eq(undefined);
                done();
            });
        });

        it('| returns error, invalid profile entered by user', (done) => {
            // setup
            sinon.stub(path, 'join').returns(TEST_APP_CONFIG_FILE_PATH);
            const existsSyncStub = sinon.stub(fs, 'existsSync');
            existsSyncStub.onCall(0).returns(false);
            existsSyncStub.onCall(1).returns(true);
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(jsonfile, 'writeFileSync');
            sinon.stub(stringUtils, 'validateSyntax').returns(false);
            getProfileListStub = sinon.stub().returns([]);
            sinon.stub(AppConfig, 'getInstance').returns({
                getProfilesList: getProfileListStub,
            });

            // call
            instance.handle({}, (err, askProfile) => {
                // verify
                expect(infoStub.args[0][0]).eq(messages.ASK_CLI_CONFIGURATION_MESSAGE);
                expect(fs.ensureDirSync.callCount).eq(1);
                expect(jsonfile.writeFileSync.callCount).eq(1);
                expect(err).eq(messages.PROFILE_NAME_VALIDATION_ERROR);
                expect(askProfile).eq(undefined);
                done();
            });
        });

        describe(('# existing profiles'), () => {
            beforeEach(() => {
                instance = new ConfigureCommand(optionModel);
                sinon.stub(path, 'join').returns(TEST_APP_CONFIG_FILE_PATH);
                const existsSyncStub = sinon.stub(fs, 'existsSync');
                existsSyncStub.onCall(0).returns(false);
                existsSyncStub.onCall(1).returns(true);
                sinon.stub(fs, 'ensureDirSync');
                sinon.stub(jsonfile, 'writeFileSync');
                getProfileListStub = sinon.stub().returns([TEST_INVALID_PROFILE]);
                const getAwsProfileStub = sinon.stub().returns(TEST_AWS_PROFILE);
                const getVendorIdStub = sinon.stub().returns(TEST_VENDOR_ID);
                sinon.stub(AppConfig, 'getInstance').returns({
                    getProfilesList: getProfileListStub,
                    getAwsProfile: getAwsProfileStub,
                    getVendorId: getVendorIdStub
                });
            });

            it('| returns error, existing profiles but user enters invalid profile name', (done) => {
                // setup
                sinon.stub(stringUtils, 'validateSyntax').returns(false);

                // call
                instance.handle({ profile: TEST_INVALID_PROFILE }, (err, askProfile) => {
                    // verify
                    expect(infoStub.args[0][0]).eq(messages.ASK_CLI_CONFIGURATION_MESSAGE);
                    expect(fs.ensureDirSync.callCount).eq(1);
                    expect(jsonfile.writeFileSync.callCount).eq(1);
                    expect(err).eq(messages.PROFILE_NAME_VALIDATION_ERROR);
                    expect(askProfile).eq(undefined);
                    done();
                });
            });

            it('| returns error, existing profiles and valid profile name, setup fails', (done) => {
                // setup
                sinon.stub(stringUtils, 'validateSyntax').returns(true);
                sinon.stub(helper, 'initiateAskProfileSetup').callsArgWith(1, TEST_ERROR_MESSAGE);

                // call
                instance.handle(TEST_CMD, (err, askProfile) => {
                    // verify
                    expect(infoStub.args[0][0]).eq(messages.ASK_CLI_CONFIGURATION_MESSAGE);
                    expect(fs.ensureDirSync.callCount).eq(1);
                    expect(jsonfile.writeFileSync.callCount).eq(1);
                    expect(err).eq(TEST_ERROR_MESSAGE);
                    expect(askProfile).eq(undefined);
                    done();
                });
            });

            it('| returns error, existing profiles and invalid profile name, ask for creation of new profile fails', (done) => {
                // setup
                sinon.stub(stringUtils, 'validateSyntax').returns(true);
                sinon.stub(ui, 'createOrUpdateProfile').callsArgWith(1, TEST_ERROR_MESSAGE);

                // call
                instance.handle({}, (err, askProfile) => {
                    // verify
                    expect(infoStub.args[0][0]).eq(messages.ASK_CLI_CONFIGURATION_MESSAGE);
                    expect(fs.ensureDirSync.callCount).eq(1);
                    expect(jsonfile.writeFileSync.callCount).eq(1);
                    expect(err).eq(TEST_ERROR_MESSAGE);
                    expect(askProfile).eq(undefined);
                    done();
                });
            });

            it('| returns error, existing profiles and invalid profile name, setup fails', (done) => {
                // setup
                sinon.stub(stringUtils, 'validateSyntax').returns(true);
                sinon.stub(ui, 'createOrUpdateProfile').callsArgWith(1, null, TEST_PROFILE);
                sinon.stub(helper, 'initiateAskProfileSetup').callsArgWith(1, TEST_ERROR_MESSAGE);

                // call
                instance.handle({}, (err, askProfile) => {
                    // verify
                    expect(infoStub.args[0][0]).eq(messages.ASK_CLI_CONFIGURATION_MESSAGE);
                    expect(fs.ensureDirSync.callCount).eq(1);
                    expect(jsonfile.writeFileSync.callCount).eq(1);
                    expect(err).eq(TEST_ERROR_MESSAGE);
                    expect(askProfile).eq(undefined);
                    done();
                });
            });

            it('| successfully configured profiles', (done) => {
                // setup
                sinon.stub(stringUtils, 'validateSyntax').returns(true);
                sinon.stub(ui, 'createOrUpdateProfile').callsArgWith(1, null, TEST_PROFILE);
                sinon.stub(helper, 'initiateAskProfileSetup').callsArgWith(1, null, TEST_PROFILE);

                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(infoStub.args[0][0]).eq(messages.ASK_CLI_CONFIGURATION_MESSAGE);
                    expect(infoStub.args[1][0]).eq(messages.CONFIGURE_SETUP_SUCCESS_MESSAGE);
                    expect(infoStub.args[2][0]).eq(`ASK Profile: ${TEST_PROFILE}`);
                    expect(infoStub.args[3][0]).eq(`AWS Profile: ${TEST_AWS_PROFILE}`);
                    expect(infoStub.args[4][0]).eq(`Vendor ID: ${TEST_VENDOR_ID}`);
                    expect(fs.ensureDirSync.callCount).eq(1);
                    expect(jsonfile.writeFileSync.callCount).eq(1);
                    expect(err).eq(undefined);
                    done();
                });
            });
        });
    });
});
