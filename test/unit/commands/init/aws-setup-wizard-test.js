const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const awsProfileHandler = require('aws-profile-handler');

const awsSetupWizard = require('@src/commands/init/aws-setup-wizard');
const helper = require('@src/commands/init/aws-setup-helper');
const ui = require('@src/commands/init/ui');
const profileHelper = require('@src/utils/profile-helper');
const messages = require('@src/commands/init/messages');

describe('Command: Init - AWS setup wizard test', () => {
    const TEST_IS_BROWSER = false;
    const TEST_ASK_PROFILE = 'askProfile';
    const TEST_AWS_PROFILE = 'awsProfile';

    describe('# test function startFlow', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| awsProfileHandler listProfiles function throws error, expect error called back', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(awsProfileHandler, 'listProfiles').throws(new Error('error'));
            // call
            awsSetupWizard.startFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, (err) => {
                // expect
                expect(err.message).equal('error');
                done();
            });
        });

        it('| confirm not using AWS, expect callback no error and log skip aws init message', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, false);
            sinon.stub(console, 'log');
            // call
            awsSetupWizard.startFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, (err) => {
                // expect
                expect(err).equal(undefined);
                expect(console.log.args[0][0]).equal(messages.SKIP_AWS_INITIALIZATION);
                console.log.restore();
                done();
            });
        });

        it('| setup through env var AWS profile but error happens, expect callback error', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, true);
            sinon.stub(helper, 'handleEnvironmentVariableAwsSetup').callsArgWith(1, 'error');
            // call
            awsSetupWizard.startFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, (err) => {
                // expect
                expect(err).equal('error');
                done();
            });
        });

        it('| setup through env var AWS profile, expect no error callback and quit the process', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, true);
            sinon.stub(helper, 'handleEnvironmentVariableAwsSetup').callsArgWith(1, null, true);
            // call
            awsSetupWizard.startFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, () => {
                // expect
                expect();
                done();
            });
        });

        it('| profile list is empty, expect go to create AWS profile flow', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, true);
            sinon.stub(helper, 'handleEnvironmentVariableAwsSetup').callsArgWith(1, null, false);
            sinon.stub(awsSetupWizard, 'createAwsProfileFlow').callsArgWith(3);
            sinon.stub(ui, 'createNewOrSelectAWSProfile');
            // call
            awsSetupWizard.startFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, () => {
                // expect
                expect(awsSetupWizard.createAwsProfileFlow.args[0][0]).equal(false);
                expect(awsSetupWizard.createAwsProfileFlow.args[0][1]).equal(TEST_ASK_PROFILE);
                expect(awsSetupWizard.createAwsProfileFlow.args[0][2]).deep.equal([]);
                done();
            });
        });

        it('| profile list is not empty and user select to create new profile, expect go to create AWS profile flow', (done) => {
            // setup
            const TEST_PROFILES_LIST = ['1', '2'];
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(awsProfileHandler, 'listProfiles').returns(TEST_PROFILES_LIST);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, true);
            sinon.stub(helper, 'handleEnvironmentVariableAwsSetup').callsArgWith(1, null, false);
            sinon.stub(awsSetupWizard, 'createAwsProfileFlow').callsArgWith(3);
            sinon.stub(ui, 'createNewOrSelectAWSProfile').callsArgWith(1, 'Create new profile');
            // call
            awsSetupWizard.startFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, () => {
                // expect
                expect(awsSetupWizard.createAwsProfileFlow.args[0][0]).equal(false);
                expect(awsSetupWizard.createAwsProfileFlow.args[0][1]).equal(TEST_ASK_PROFILE);
                expect(awsSetupWizard.createAwsProfileFlow.args[0][2]).deep.equal(TEST_PROFILES_LIST);
                done();
            });
        });

        it('| profile list is not empty and user select to update existing profile, expect to link the profile', (done) => {
            // setup
            const TEST_PROFILES_LIST = ['1', '2'];
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(awsProfileHandler, 'listProfiles').returns(TEST_PROFILES_LIST);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, true);
            sinon.stub(helper, 'handleEnvironmentVariableAwsSetup').callsArgWith(1, null, false);
            sinon.stub(awsSetupWizard, 'createAwsProfileFlow');
            sinon.stub(ui, 'createNewOrSelectAWSProfile').callsArgWith(1, '1');
            sinon.stub(profileHelper, 'setupProfile');
            // call
            awsSetupWizard.startFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, () => {
                // expect
                expect(profileHelper.setupProfile.args[0][0]).equal('1');
                expect(profileHelper.setupProfile.args[0][1]).equal(TEST_ASK_PROFILE);
                done();
            });
        });
    });

    describe('# test function createAwsProfileFlow', () => {
        const TEST_AWS_PROFILES_LIST = ['1', '2', TEST_AWS_PROFILE];

        afterEach(() => {
            sinon.restore();
        });

        it('| fs ensure file fails, expect error callback', (done) => {
            // setup
            sinon.stub(fs, 'ensureFileSync').throws(new Error('error'));
            // call
            awsSetupWizard.createAwsProfileFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, TEST_AWS_PROFILES_LIST, (err) => {
                // expect
                expect(err.message).equal('error');
                done();
            });
        });

        it('| fs ensure file fails, expect error callback', (done) => {
            // setup
            const TEST_CREDENTIALS = {};
            sinon.stub(fs, 'ensureFileSync');
            sinon.stub(helper, 'decideAwsProfileName').callsArgWith(1, TEST_AWS_PROFILE);
            sinon.stub(helper, 'openIamCreateUserPage').callsArgWith(2);
            sinon.stub(ui, 'addNewCredentials').callsArgWith(0, TEST_CREDENTIALS);
            sinon.stub(awsProfileHandler, 'addProfile');
            sinon.stub(profileHelper, 'setupProfile');
            sinon.stub(console, 'log');
            // call
            awsSetupWizard.createAwsProfileFlow(TEST_IS_BROWSER, TEST_ASK_PROFILE, TEST_AWS_PROFILES_LIST, (err, finalName) => {
                // expect
                expect(helper.openIamCreateUserPage.args[0][0]).equal(false);
                expect(helper.openIamCreateUserPage.args[0][1]).equal(`ask-cli-${TEST_AWS_PROFILE}`);
                expect(awsProfileHandler.addProfile.args[0][0]).equal(TEST_AWS_PROFILE);
                expect(awsProfileHandler.addProfile.args[0][1]).equal(TEST_CREDENTIALS);
                expect(profileHelper.setupProfile.args[0][0]).equal(TEST_AWS_PROFILE);
                expect(profileHelper.setupProfile.args[0][1]).equal(TEST_ASK_PROFILE);
                expect(console.log.args[0][0]).equal(`\nAWS profile "${TEST_AWS_PROFILE}" was successfully created. \
The details are recorded in aws credentials file ($HOME/.aws/credentials).`);
                expect(err).equal(null);
                expect(finalName).equal(TEST_AWS_PROFILE);
                console.log.restore();
                done();
            });
        });
    });
});
