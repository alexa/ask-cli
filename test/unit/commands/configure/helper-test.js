const { expect } = require('chai');
const sinon = require('sinon');

const askProfileSetupHelper = require('@src/commands/configure/ask-profile-setup-helper');
const awsProfileSetupHelper = require('@src/commands/configure/aws-profile-setup-helper');
const messages = require('@src/commands/configure/messages');
const helper = require('@src/commands/configure/helper');
const AppConfig = require('@src/model/app-config');
const Messenger = require('@src/view/messenger');

describe('Command: Configure - helper test', () => {
    const TEST_PROFILE = 'testProfile';
    const TEST_AWS_PROFILE = 'testAwsProfile';
    const TEST_DO_DEBUG = false;
    const TEST_NEED_BROWSER = false;
    const TEST_VENDOR_ID = 'testVendorId';
    const TEST_ERROR_MESSAGE = 'errorMessage';
    const TEST_ACCESS_TOKEN = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 3600,
        expires_at: 'expires_at'
    };
    const TEST_CONFIG = {
        askProfile: TEST_PROFILE,
        needBrowser: TEST_NEED_BROWSER,
        debug: TEST_DO_DEBUG
    };
    let setTokenStub;
    let infoStub;
    let warnStub;
    let setAwsProfileStub;
    let writeStub;
    let setVendorIdStub;
    describe('# test initiateAskProfileSetup', () => {
        beforeEach(() => {
            infoStub = sinon.stub();
            warnStub = sinon.stub();
            setAwsProfileStub = sinon.stub();
            setVendorIdStub = sinon.stub();
            writeStub = sinon.stub();
            setTokenStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
                warn: warnStub
            });
            sinon.stub(AppConfig, 'getInstance').returns({
                write: writeStub,
                setAwsProfile: setAwsProfileStub,
                setToken: setTokenStub,
                setVendorId: setVendorIdStub
            });
            sinon.stub(askProfileSetupHelper, 'setupAskToken');
            sinon.stub(askProfileSetupHelper, 'setupVendorId');
            sinon.stub(awsProfileSetupHelper, 'setupAwsProfile');
        });

        it('| setupAskToken returns error', (done) => {
            // setup
            askProfileSetupHelper.setupAskToken.callsArgWith(1, TEST_ERROR_MESSAGE);

            // call
            helper.initiateAskProfileSetup(TEST_CONFIG, (error, askProfile) => {
                // verify
                expect(warnStub.args[0][0]).eq(messages.LWA_TOKEN_SHARE_WARN_MESSAGE);
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(askProfile).eq(undefined);
                done();
            });
        });

        it('| setupAskToken returns valid token and setupVendorId throws error ', (done) => {
            // setup
            askProfileSetupHelper.setupAskToken.callsArgWith(1, null, TEST_ACCESS_TOKEN);
            askProfileSetupHelper.setupVendorId.callsArgWith(1, TEST_ERROR_MESSAGE);

            // call
            helper.initiateAskProfileSetup(TEST_CONFIG, (error, askProfile) => {
                // verify
                expect(warnStub.args[0][0]).eq(messages.LWA_TOKEN_SHARE_WARN_MESSAGE);
                expect(setTokenStub.args[0][0]).eq(TEST_PROFILE);
                expect(setTokenStub.args[0][1]).to.deep.eq(TEST_ACCESS_TOKEN);
                expect(infoStub.args[0][0]).eq(`ASK Profile "${TEST_PROFILE}" was successfully created. The details are recorded in ask-cli config file (.ask/cli_config) located at your **HOME** folder.`);
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(askProfile).eq(undefined);
                done();
            });
        });

        it('| setupVendorId returns valid vendorId and setupAwsProfile throws error', (done) => {
            // setup
            askProfileSetupHelper.setupAskToken.callsArgWith(1, null, TEST_ACCESS_TOKEN);
            askProfileSetupHelper.setupVendorId.callsArgWith(1, null, TEST_VENDOR_ID);
            awsProfileSetupHelper.setupAwsProfile.callsArgWith(1, TEST_ERROR_MESSAGE);

            // call
            helper.initiateAskProfileSetup(TEST_CONFIG, (error, askProfile) => {
                // verify
                expect(warnStub.args[0][0]).eq(messages.LWA_TOKEN_SHARE_WARN_MESSAGE);
                expect(setVendorIdStub.args[0][0]).eq(TEST_PROFILE);
                expect(setVendorIdStub.args[0][1]).to.deep.eq(TEST_VENDOR_ID);
                expect(infoStub.args[0][0]).eq(`ASK Profile "${TEST_PROFILE}" was successfully created. The details are recorded in ask-cli config file (.ask/cli_config) located at your **HOME** folder.`);
                expect(infoStub.args[1][0]).eq(`Vendor ID set as ${TEST_VENDOR_ID}.\n`);
                expect(error).eq(TEST_ERROR_MESSAGE);
                expect(askProfile).eq(undefined);
                done();
            });
        });

        it('| successfully initiated askProfile but awsProfile is not set', (done) => {
            // setup
            askProfileSetupHelper.setupAskToken.callsArgWith(1, null, TEST_ACCESS_TOKEN);
            askProfileSetupHelper.setupVendorId.callsArgWith(1, null, TEST_VENDOR_ID);
            awsProfileSetupHelper.setupAwsProfile.callsArgWith(1, null);

            // call
            helper.initiateAskProfileSetup(TEST_CONFIG, (error, askProfile) => {
                // verify
                expect(warnStub.args[0][0]).eq(messages.LWA_TOKEN_SHARE_WARN_MESSAGE);
                expect(setVendorIdStub.args[0][0]).eq(TEST_PROFILE);
                expect(setVendorIdStub.args[0][1]).to.deep.eq(TEST_VENDOR_ID);
                expect(infoStub.args[0][0]).eq(`ASK Profile "${TEST_PROFILE}" was successfully created. The details are recorded in ask-cli config file (.ask/cli_config) located at your **HOME** folder.`);
                expect(infoStub.args[1][0]).eq(`Vendor ID set as ${TEST_VENDOR_ID}.\n`);
                expect(infoStub.args[2][0]).eq(messages.AWS_CONFIGURATION_MESSAGE);
                expect(warnStub.args[1][0]).eq(messages.AWS_SECRET_ACCESS_KEY_AND_ID_SHARE_WARN_MESSAGE);
                expect(setAwsProfileStub.args[0][0]).eq(TEST_PROFILE);
                expect(setAwsProfileStub.args[0][1]).to.deep.eq(undefined);
                expect(error).eq(null);
                expect(askProfile).eq(TEST_PROFILE);
                done();
            });
        });

        it('| successfully initiated askProfile and awsProfile', (done) => {
            // setup
            askProfileSetupHelper.setupAskToken.callsArgWith(1, null, TEST_ACCESS_TOKEN);
            askProfileSetupHelper.setupVendorId.callsArgWith(1, null, TEST_VENDOR_ID);
            awsProfileSetupHelper.setupAwsProfile.callsArgWith(1, null, TEST_AWS_PROFILE);

            // call
            helper.initiateAskProfileSetup(TEST_CONFIG, (error, askProfile) => {
                // verify
                expect(warnStub.args[0][0]).eq(messages.LWA_TOKEN_SHARE_WARN_MESSAGE);
                expect(setVendorIdStub.args[0][0]).eq(TEST_PROFILE);
                expect(setVendorIdStub.args[0][1]).to.deep.eq(TEST_VENDOR_ID);
                expect(infoStub.args[0][0]).eq(`ASK Profile "${TEST_PROFILE}" was successfully created. The details are recorded in ask-cli config file (.ask/cli_config) located at your **HOME** folder.`);
                expect(infoStub.args[1][0]).eq(`Vendor ID set as ${TEST_VENDOR_ID}.\n`);
                expect(infoStub.args[2][0]).eq(messages.AWS_CONFIGURATION_MESSAGE);
                expect(warnStub.args[1][0]).eq(messages.AWS_SECRET_ACCESS_KEY_AND_ID_SHARE_WARN_MESSAGE);
                expect(infoStub.args[3][0]).eq(`AWS profile "${TEST_AWS_PROFILE}" was successfully associated with your ASK profile "${TEST_PROFILE}".\n`);
                expect(setAwsProfileStub.args[0][0]).eq(TEST_PROFILE);
                expect(setAwsProfileStub.args[0][1]).to.deep.eq(TEST_AWS_PROFILE);
                expect(error).eq(null);
                expect(askProfile).eq(TEST_PROFILE);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });
});
