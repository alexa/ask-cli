const { expect } = require('chai');
const sinon = require('sinon');
const awsProfileHandler = require('aws-profile-handler');
const fs = require('fs-extra');
const path = require('path');
const querystring = require('querystring');
const proxyquire = require('proxyquire');

const awsProfileSetupHelper = require('@src/commands/configure/aws-profile-setup-helper');
const messages = require('@src/commands/configure/messages');
const ui = require('@src/commands/configure/ui');
const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');

describe('Command: Configure - AWS profile setup helper test', () => {
    const TEST_PROFILE = 'testAwsProfile';
    const TEST_DO_DEBUG = false;
    const TEST_NEED_BROWSER = false;
    const TEST_CONFIG_PATH = '~/.aws/credentials';
    const TEST_CONFIG = {
        askProfile: TEST_PROFILE,
        needBrowser: TEST_NEED_BROWSER,
        debug: TEST_DO_DEBUG
    };
    const TEST_ERROR_MESSAGE = 'errorThrown';
    const TEST_NEW_AWS_PROFILE_NAME = 'newProfileName';
    const TEST_PARAMS = {
        accessKey: true,
        step: 'review',
        userNames: `ask-cli-${TEST_NEW_AWS_PROFILE_NAME}`,
        permissionType: 'policies',
        policies: [
            CONSTANTS.AWS.IAM.USER.POLICY_ARN.IAM_FULL,
            CONSTANTS.AWS.IAM.USER.POLICY_ARN.CFN_FULL,
            CONSTANTS.AWS.IAM.USER.POLICY_ARN.S3_FULL,
            CONSTANTS.AWS.IAM.USER.POLICY_ARN.LAMBDA_FULL
        ]
    };
    const TEST_CREDENTIALS = { aws_access_key_id: 'accessKeyId', aws_secret_access_key: 'secretAccessKey' };

    describe('# test setupAwsProfile', () => {
        beforeEach(() => {
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(path, 'join').returns(TEST_CONFIG_PATH);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| returns error, awsProfileHandler listProfiles function throws error, expect error called back ', (done) => {
            // setup
            sinon.stub(awsProfileHandler, 'listProfiles').throws(new Error(TEST_ERROR_MESSAGE));
            // call
            awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err, awsProfile) => {
                // verify
                expect(err.message).eq(TEST_ERROR_MESSAGE);
                expect(awsProfile).eq(undefined);
                done();
            });
        });

        describe('# test _initiateAwsProfileSetup', () => {
            it('| returns error, ui confirmSettingAws fails', (done) => {
                // setup
                sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, TEST_ERROR_MESSAGE);
                sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);

                // call
                awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err, awsProfile) => {
                    // verify
                    expect(err).eq(TEST_ERROR_MESSAGE);
                    expect(awsProfile).eq(TEST_ERROR_MESSAGE);
                    done();
                });
            });

            it('| returns error due to invalid setup choice', (done) => {
                // setup
                const infoStub = sinon.stub();
                sinon.stub(Messenger, 'getInstance').returns({
                    info: infoStub
                });
                sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, null);
                sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);

                // call
                awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err, awsProfile) => {
                    // verify
                    expect(infoStub.args[0][0]).eq(messages.SKIP_AWS_CONFIGURATION);
                    expect(err).eq(undefined);
                    expect(awsProfile).eq(undefined);
                    done();
                });
            });

            describe('# test _handleEnvironmentVariableAwsSetup', () => {
                it('| returns error, ui selectEnvironmentVariables fails', (done) => {
                    // setup
                    sinon.stub(stringUtils, 'isNonBlankString').returns(true);
                    sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);
                    sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, TEST_ERROR_MESSAGE);
                    sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);

                    // call
                    awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err, awsProfile) => {
                        // verify
                        expect(err).eq(TEST_ERROR_MESSAGE);
                        expect(awsProfile).eq(TEST_ERROR_MESSAGE);
                        done();
                    });
                });

                it('| returns error, setup choice is Yes', (done) => {
                    // setup
                    sinon.stub(stringUtils, 'isNonBlankString').returns(true);
                    sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);
                    sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, null, 'Yes');
                    sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);
                    sinon.stub(profileHelper, 'setupProfile');

                    // call
                    awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err, awsProfile) => {
                        // verify
                        expect(profileHelper.setupProfile.args[0][0]).eq(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
                        expect(profileHelper.setupProfile.args[0][1]).eq(TEST_PROFILE);
                        expect(err).eq(null);
                        expect(awsProfile).eq(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
                        done();
                    });
                });

                it('| returns error, ui createNewOrSelectAWSProfile fails ', (done) => {
                    // setup
                    sinon.stub(stringUtils, 'isNonBlankString').returns(false);
                    sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);
                    sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, TEST_ERROR_MESSAGE);
                    sinon.stub(ui, 'createNewOrSelectAWSProfile').callsArgWith(1, TEST_ERROR_MESSAGE);
                    sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);

                    // call
                    awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err, awsProfile) => {
                        // verify
                        expect(err).eq(TEST_ERROR_MESSAGE);
                        expect(awsProfile).eq(TEST_ERROR_MESSAGE);
                        done();
                    });
                });

                it('| returns awsProfile, user chooses existing profile ', (done) => {
                    // setup
                    sinon.stub(stringUtils, 'isNonBlankString').returns(false);
                    sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);
                    sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, TEST_ERROR_MESSAGE);
                    sinon.stub(ui, 'createNewOrSelectAWSProfile').callsArgWith(1, null, 'existing_profile');
                    sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);
                    sinon.stub(profileHelper, 'setupProfile');

                    // call
                    awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err, awsProfile) => {
                        // verify
                        expect(profileHelper.setupProfile.args[0][0]).eq('existing_profile');
                        expect(profileHelper.setupProfile.args[0][1]).eq(TEST_PROFILE);
                        expect(err).eq(null);
                        expect(awsProfile).eq('existing_profile');
                        done();
                    });
                });
            });
        });
    });

    describe('# test _createAwsProfileFlow', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| fs ensureFileSync throws error', (done) => {
            // setup
            sinon.stub(path, 'join').returns(TEST_CONFIG_PATH);
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(fs, 'ensureFileSync').throws(new Error(TEST_ERROR_MESSAGE));
            sinon.stub(stringUtils, 'isNonBlankString').returns(false);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);

            // call
            awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err) => {
                // verify
                expect(err.message).eq(TEST_ERROR_MESSAGE);
                done();
            });
        });

        it('| returns valid awsProfile ', (done) => {
            // setup
            const DEFAULT_AWS_PROFILE = 'ask_cli_default';
            const openStub = sinon.stub();
            const proxyHelper = proxyquire('@src/commands/configure/aws-profile-setup-helper', {
                open: openStub
            });
            const infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(fs, 'ensureFileSync');
            sinon.stub(fs, 'chmodSync');
            sinon.stub(stringUtils, 'isNonBlankString').returns(false);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);
            sinon.stub(ui, 'addNewCredentials').callsArgWith(0, null, TEST_CREDENTIALS);
            sinon.stub(awsProfileHandler, 'addProfile');
            sinon.stub(profileHelper, 'setupProfile');

            // call
            proxyHelper.setupAwsProfile({ askProfile: TEST_PROFILE, needBrowser: true }, (err, awsProfile) => {
                // verify
                expect(awsProfileHandler.addProfile.args[0][0]).eq(DEFAULT_AWS_PROFILE);
                expect(awsProfileHandler.addProfile.args[0][1]).to.deep.eq(TEST_CREDENTIALS);
                expect(profileHelper.setupProfile.args[0][0]).eq(DEFAULT_AWS_PROFILE);
                expect(profileHelper.setupProfile.args[0][1]).eq(TEST_PROFILE);
                expect(infoStub.args[0][0]).eq(messages.AWS_CREATE_PROFILE_TITLE);
                expect(infoStub.args[1][0]).eq(`\nAWS profile "${DEFAULT_AWS_PROFILE}" was successfully created. The details are recorded in aws credentials file (.aws/credentials) located at your **HOME** folder.`);
                expect(err).eq(null);
                expect(awsProfile).eq(DEFAULT_AWS_PROFILE);
                done();
            });
        });

        it('| returns error, ui requestAwsProfileName fails ', (done) => {
            // setup
            sinon.stub(path, 'join').returns(TEST_CONFIG_PATH);
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);
            sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, null, 'No');
            sinon.stub(ui, 'createNewOrSelectAWSProfile').callsArgWith(1, null, 'Create new profile');
            sinon.stub(ui, 'requestAwsProfileName').callsArgWith(1, TEST_ERROR_MESSAGE);
            sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);
            sinon.stub(fs, 'ensureFileSync');
            sinon.stub(fs, 'chmodSync');
            sinon.stub(fs, 'existsSync').returns(true);

            // call
            awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err) => {
                // verify
                expect(err).eq(TEST_ERROR_MESSAGE);
                done();
            });
        });

        it('| returns error, ui addNewCredentials fails ', (done) => {
            // setup
            sinon.stub(path, 'join').returns(TEST_CONFIG_PATH);
            const infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);
            sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, null, 'No');
            sinon.stub(ui, 'createNewOrSelectAWSProfile').callsArgWith(1, null, 'Create new profile');
            sinon.stub(ui, 'requestAwsProfileName').callsArgWith(1, null, TEST_NEW_AWS_PROFILE_NAME);
            sinon.stub(ui, 'addNewCredentials').callsArgWith(0, TEST_ERROR_MESSAGE);
            sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);
            sinon.stub(fs, 'ensureFileSync');
            sinon.stub(fs, 'chmodSync');
            sinon.stub(fs, 'existsSync').returns(true);

            // call
            awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err) => {
                // verify
                expect(infoStub.args[0][0]).eq(messages.AWS_CREATE_PROFILE_TITLE);
                expect(infoStub.args[1][0]).eq(messages.AWS_CREATE_PROFILE_NO_BROWSER_OPEN_BROWSER);
                expect(infoStub.args[2][0]).eq(`    ${CONSTANTS.AWS.IAM.USER.NEW_USER_BASE_URL}${querystring.stringify(TEST_PARAMS)}`);
                done();
            });
        });

        it('| successfully added awsProfile and credentials ', (done) => {
            // setup
            sinon.stub(path, 'join').returns(TEST_CONFIG_PATH);
            const infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(ui, 'confirmSettingAws').callsArgWith(0, null, true);
            sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, null, 'No');
            sinon.stub(ui, 'createNewOrSelectAWSProfile').callsArgWith(1, null, 'Create new profile');
            sinon.stub(ui, 'requestAwsProfileName').callsArgWith(1, null, TEST_NEW_AWS_PROFILE_NAME);
            sinon.stub(ui, 'addNewCredentials').callsArgWith(0, null, TEST_CREDENTIALS);
            sinon.stub(awsProfileHandler, 'listProfiles').returns([TEST_PROFILE]);
            sinon.stub(fs, 'ensureFileSync');
            sinon.stub(fs, 'chmodSync');
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(awsProfileHandler, 'addProfile');
            sinon.stub(profileHelper, 'setupProfile');

            // call
            awsProfileSetupHelper.setupAwsProfile(TEST_CONFIG, (err, awsProfile) => {
                // verify
                expect(awsProfileHandler.addProfile.args[0][0]).eq(TEST_NEW_AWS_PROFILE_NAME);
                expect(awsProfileHandler.addProfile.args[0][1]).to.deep.eq(TEST_CREDENTIALS);
                expect(profileHelper.setupProfile.args[0][0]).eq(TEST_NEW_AWS_PROFILE_NAME);
                expect(profileHelper.setupProfile.args[0][1]).eq(TEST_PROFILE);
                expect(infoStub.args[0][0]).eq(messages.AWS_CREATE_PROFILE_TITLE);
                expect(infoStub.args[1][0]).eq(messages.AWS_CREATE_PROFILE_NO_BROWSER_OPEN_BROWSER);
                expect(infoStub.args[2][0]).eq(`    ${CONSTANTS.AWS.IAM.USER.NEW_USER_BASE_URL}${querystring.stringify(TEST_PARAMS)}`);
                expect(infoStub.args[3][0]).eq(`\nAWS profile "${TEST_NEW_AWS_PROFILE_NAME}" was successfully created. The details are recorded in aws credentials file (.aws/credentials) located at your **HOME** folder.`);
                expect(err).eq(null);
                expect(awsProfile).eq(TEST_NEW_AWS_PROFILE_NAME);

                done();
            });
        });
    });
});
