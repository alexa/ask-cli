const { expect } = require('chai');
const sinon = require('sinon');
const profileHelper = require('@src/utils/profile-helper');
const awsSetupWizard = require('@src/commands/init/aws-setup-wizard');
const askSetupHelper = require('@src/commands/init/ask-setup-helper');
const handler = require('@src/commands/init/handler');
const messages = require('@src/commands/init/messages');
const lwaUtil = require('@src/utils/lwa');
const ui = require('@src/commands/init/ui');
const stringUtils = require('@src/utils/string-utils');

describe('Command: Init - handler test', () => {
    describe('# Initialization process handler test', () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            sandbox.stub(profileHelper, 'askProfileSyntaxValidation');
            sandbox.stub(askSetupHelper, 'isFirstTimeCreation');
            sandbox.stub(profileHelper, 'stringFormatter');
            sandbox.stub(profileHelper, 'getListProfile');
            sandbox.stub(console, 'log');
            sandbox.stub(console, 'error');
            sandbox.stub(process, 'exit');
            sandbox.stub(ui, 'createOrUpdateProfile');
            sandbox.stub(askSetupHelper, 'setupAskConfig');
            sandbox.stub(askSetupHelper, 'setVendorId');
            sandbox.stub(awsSetupWizard, 'startFlow');
            sandbox.stub(lwaUtil, 'accessTokenGenerator');
            sandbox.stub(stringUtils, 'isNonBlankString');
        });

        it('| is first time creation with no profile entered by user: valid profile', () => {
            // setup
            askSetupHelper.isFirstTimeCreation.returns(true);
            profileHelper.askProfileSyntaxValidation.withArgs(sinon.match.string).returns(true);

            // call
            handler.handleOptions({ });

            // verify
            expect(lwaUtil.accessTokenGenerator.called).equal(true);
        });

        it('| has existing profiles and profile not entered by user, error while creating profile', () => {
            // setup
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs(sinon.match.string).returns(true);
            profileHelper.stringFormatter.withArgs(sinon.match.array).returns([]);
            profileHelper.getListProfile.returns([]);
            ui.createOrUpdateProfile.callsArgOnWith(2, {}, 'error', 'askProfile');

            // call
            handler.handleOptions({ });

            // verify
            expect(console.error.args[0][0]).equal(`[Error]: ${messages.PROFILE_NAME_VALIDATION_ERROR}`);
            expect(process.exit.args[0][0]).equal(1);
        });

        it('| has existing profiles and profile not entered by user, no error while creating profile', () => {
            // setup
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs(sinon.match.string).returns(true);
            profileHelper.stringFormatter.withArgs(sinon.match.array).returns([]);
            profileHelper.getListProfile.returns([]);
            ui.createOrUpdateProfile.callsArgOnWith(2, {}, null, 'askProfile');

            // call
            handler.handleOptions({ });

            // verify
            expect(lwaUtil.accessTokenGenerator.withArgs(sinon.match.any, sinon.match.object, sinon.match.func).called).equal(true);
        });

        it('| has existing profiles but profile entered by user: valid profile', () => {
            // setup
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs('askProfile').returns(true);

            // call
            handler.handleOptions({ profile: 'askProfile' });

            // verify
            expect(lwaUtil.accessTokenGenerator.called).equal(true);
        });

        it('| invalid profile entered by user', () => {
            // setup
            profileHelper.askProfileSyntaxValidation.withArgs('askProfile').returns(false);
            askSetupHelper.isFirstTimeCreation.returns(true);

            // call
            handler.handleOptions({ });

            // verify
            expect(console.error.args[0][0]).equal(`[Error]: ${messages.PROFILE_NAME_VALIDATION_ERROR}`);
            expect(process.exit.args[0][0]).equal(1);
        });

        it('| directInitProcess accessTokenGenerator throws error', () => {
            // setup
            const ERROR_FROM_TOKEN_GENERATOR = 'error from token generator';
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs('askProfile').returns(true);
            lwaUtil.accessTokenGenerator.callsArgOnWith(2, {}, ERROR_FROM_TOKEN_GENERATOR, null);

            // call
            handler.handleOptions({ profile: 'askProfile' });

            // verify
            expect(console.error.args[0][0]).equal(`[Error]: ${ERROR_FROM_TOKEN_GENERATOR}`);
            expect(process.exit.args[0][0]).equal(1);
        });

        it('| directInitProcess setupAskConfig throws error', () => {
            // setup
            const ERROR_FROM_ASK_CONFIG_SETUP = 'error from ask config setup';
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs('askProfile').returns(true);
            lwaUtil.accessTokenGenerator.callsArgOnWith(2, {}, null, {});
            askSetupHelper.setupAskConfig.callsArgOnWith(2, {}, ERROR_FROM_ASK_CONFIG_SETUP);

            // call
            handler.handleOptions({ profile: 'askProfile' });

            // verify
            expect(console.error.args[0][0]).equal(`[Error]: ${ERROR_FROM_ASK_CONFIG_SETUP}`);
            expect(process.exit.args[0][0]).equal(1);
        });

        it('| directInitProcess setVendorId throws error', () => {
            // setup
            const ERROR_FROM_SET_VENDOR_ID = 'error from set vendor id';
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs('askProfile').returns(true);
            lwaUtil.accessTokenGenerator.callsArgOnWith(2, {}, null, {});
            askSetupHelper.setupAskConfig.callsArgOnWith(2, {}, null);
            askSetupHelper.setVendorId.callsArgOnWith(2, {}, ERROR_FROM_SET_VENDOR_ID, 'vendorId');

            // call
            handler.handleOptions({ profile: 'askProfile' });

            // verify
            expect(console.error.args[0][0]).equal(`[Error]: ${ERROR_FROM_SET_VENDOR_ID}`);
            expect(process.exit.args[0][0]).equal(1);
        });

        it('| directInitProcess awsResolver throws error', () => {
            // setup
            const ERROR_FROM_AWS_RESOLVER = 'error from set vendor id';
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs('askProfile').returns(true);
            lwaUtil.accessTokenGenerator.callsArgOnWith(2, {}, null, {});
            askSetupHelper.setupAskConfig.callsArgOnWith(2, {}, null);
            askSetupHelper.setVendorId.callsArgOnWith(2, {}, null, 'vendorId');
            awsSetupWizard.startFlow.callsArgOnWith(2, {}, ERROR_FROM_AWS_RESOLVER);

            // call
            handler.handleOptions({ profile: 'askProfile' });

            // verify
            expect(console.error.args[0][0]).equal(`[Error]: ${ERROR_FROM_AWS_RESOLVER}`);
            expect(process.exit.args[0][0]).equal(1);
        });

        it('| directInitProcess complete profile setup process', () => {
            // setup
            const ASK_PROFILE = 'askProfile';
            const AWS_PROFILE = 'awsProfile';
            const VENDOR_ID = 'vendorId';
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs(ASK_PROFILE).returns(true);
            lwaUtil.accessTokenGenerator.callsArgOnWith(2, {}, null, {});
            askSetupHelper.setupAskConfig.callsArgOnWith(2, {}, null);
            askSetupHelper.setVendorId.callsArgOnWith(2, {}, null, VENDOR_ID);
            awsSetupWizard.startFlow.callsArgOnWith(2, {}, null, AWS_PROFILE);
            stringUtils.isNonBlankString.withArgs(sinon.match.string).returns(true);

            // call
            handler.handleOptions({ profile: ASK_PROFILE });

            // verify
            expect(console.log.args[0][0]).equal(messages.ASK_CLI_INITIALIZATION_MESSAGE);
            expect(console.log.args[1][0])
                .equal(`ASK Profile "${ASK_PROFILE}" was successfully created. The details are recorded in ask-cli config ($HOME/.ask/cli_config).`);
            expect(console.log.args[2][0]).equal(`Vendor ID set as ${VENDOR_ID}.`);
            expect(console.log.args[4][0]).equal(messages.AWS_INITIALIZATION_MESSAGE);
            expect(console.log.args[5][0]).equal(`AWS profile "${AWS_PROFILE}" was successfully associated with your ASK profile "${ASK_PROFILE}".`);
            expect(console.log.args[7][0]).equal('------------------------- Initialization Complete -------------------------');
            expect(console.log.args[8][0]).equal('Here is the summary for the profile setup: ');
            expect(console.log.args[9][0]).equal(`  ASK Profile: ${ASK_PROFILE}`);
            expect(console.log.args[10][0]).equal(`  AWS Profile: ${AWS_PROFILE}`);
            expect(console.log.args[11][0]).equal(`  Vendor ID: ${VENDOR_ID}`);
        });

        it('| directInitProcess invalid awsProfile', () => {
            // setup
            const ASK_PROFILE = 'askProfile';
            const AWS_PROFILE = null;
            const VENDOR_ID = 'vendorId';
            stringUtils.isNonBlankString.withArgs(sinon.match.string).returns(false);
            askSetupHelper.isFirstTimeCreation.returns(false);
            profileHelper.askProfileSyntaxValidation.withArgs(ASK_PROFILE).returns(true);
            lwaUtil.accessTokenGenerator.callsArgOnWith(2, {}, null, {});
            askSetupHelper.setupAskConfig.callsArgOnWith(2, {}, null);
            askSetupHelper.setVendorId.callsArgOnWith(2, {}, null, VENDOR_ID);
            awsSetupWizard.startFlow.callsArgOnWith(2, {}, null, AWS_PROFILE);

            // call
            handler.handleOptions({ profile: ASK_PROFILE });

            // verify
            expect(console.log.args[9][0]).equal(`  No AWS profile linked to profile "${ASK_PROFILE}"`);
        });

        afterEach(() => {
            sandbox.restore();
        });
    });

    describe('# init options handler test', () => {
        it('| invalid options', () => {
            // setup
            sinon.stub(console, 'error');
            sinon.stub(process, 'exit');

            // call
            handler.handleOptions(' ');

            // verify
            expect(console.error.args[0][0]).equal(`[Error]: ${messages.INVALID_COMMAND_ERROR}`);
            expect(process.exit.args[0][0]).equal(1);
        });

        it('| show list of profiles', () => {
            // setup
            sinon.stub(console, 'log');
            sinon.spy(profileHelper, 'displayProfile');

            // call
            handler.handleOptions({ listProfiles: true });

            // verify
            expect(profileHelper.displayProfile.called).equal(true);
        });

        afterEach(() => {
            sinon.restore();
        });
    });
});
