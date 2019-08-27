const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const helper = require('@src/commands/init/aws-setup-helper');
const ui = require('@src/commands/init/ui');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');

describe('Command: Init - AWS setup helper test', () => {
    const TEST_ASK_PROFILE = 'askProfile';

    describe('# inspect method handleEnvironmentVariableAwsSetup', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| no env var set for AWS profile, expect callback with false result', (done) => {
            // setup
            sinon.stub(stringUtils, 'isNonBlankString').returns(false);
            // call
            helper.handleEnvironmentVariableAwsSetup(TEST_ASK_PROFILE, (err, res) => {
                // expect
                expect(err).equal(null);
                expect(res).equal(false);
                done();
            });
        });

        it('| user selects "no", expect callback with false result', (done) => {
            // setup
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, 'No');
            // call
            helper.handleEnvironmentVariableAwsSetup(TEST_ASK_PROFILE, (err, res) => {
                // expect
                expect(err).equal(null);
                expect(res).equal(false);
                done();
            });
        });

        it('| user selects desired result, expect callback with the selection', (done) => {
            // setup
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(ui, 'selectEnvironmentVariables').callsArgWith(0, 'Yes');
            sinon.stub(profileHelper, 'setupProfile');
            // call
            helper.handleEnvironmentVariableAwsSetup(TEST_ASK_PROFILE, (err, res) => {
                // expect
                expect(err).equal(null);
                expect(res).equal(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
                expect(profileHelper.setupProfile.args[0][0]).equal(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
                expect(profileHelper.setupProfile.args[0][1]).equal(TEST_ASK_PROFILE);
                done();
            });
        });
    });

    describe('# inspect method decideAwsProfileName', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| profile list is empty, expect callback with default name', (done) => {
            helper.decideAwsProfileName([], (name) => {
                expect(name).equal(CONSTANTS.COMMAND.INIT.AWS_DEFAULT_PROFILE_NAME);
                done();
            });
        });

        it('| profile list is not empty, expect callback user input name', (done) => {
            sinon.stub(ui, 'requestAwsProfileName').callsArgWith(1, '1');
            helper.decideAwsProfileName(['1', '2'], (name) => {
                expect(name).equal('1');
                done();
            });
        });
    });

    describe('# inspect method openIamCreateUserPage', () => {
        const TEST_USER_NAME = 'user';
        let opnStub, proxyHelper;

        beforeEach(() => {
            opnStub = sinon.stub();
            proxyHelper = proxyquire('@src/commands/init/aws-setup-helper', {
                opn: opnStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| when no-browser is set, expect correct console log', (done) => {
            // setup
            sinon.stub(console, 'log');
            // call
            proxyHelper.openIamCreateUserPage(false, TEST_USER_NAME, () => {
                // expect
                expect(opnStub.callCount).equal(0);
                expect(console.log.args[0][0]).equal('\nComplete the IAM user creation with required permissions from the AWS console, '
                    + 'then come back to the terminal.');
                expect(console.log.args[1][0]).equal('Please open the following url in your browser:');
                expect(console.log.args[2][0].includes(TEST_USER_NAME)).equal(true);
                console.log.restore();
                done();
            });
        });

        it('| when having access to browser, expect correct console log', (done) => {
            // setup
            sinon.stub(console, 'log');
            // call
            proxyHelper.openIamCreateUserPage(true, TEST_USER_NAME, () => {
                // expect
                expect(opnStub.args[0][0].includes(TEST_USER_NAME)).equal(true);
                expect(console.log.args[0][0]).equal('\nComplete the IAM user creation with required permissions from the AWS console, '
                    + 'then come back to the terminal.');
                console.log.restore();
                done();
            });
        });
    });
});
