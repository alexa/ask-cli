const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const portScanner = require('portscanner');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { URL, URLSearchParams } = require('url');

const hostedSkillHelper = require('@src/commands/new/hosted-skill-helper');
const HostedSkillController = require('@src/controllers/hosted-skill-controller');
const CONSTANTS = require('@src/utils/constants');
const LocalHostServer = require('@src/utils/local-host-server');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');

describe('Commands new test - hosted skill helper test', () => {
    const TEST_ERROR = 'TEST_ERROR';
    const TEST_VENDOR_ID = 'TEST_VENDOR_ID';
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_SKILL_NAME = 'TEST_SKILL_NAME';
    const TEST_FOLDER_NAME = 'TEST_FOLDER_NAME';
    const TEST_LANGUAGE = 'TEST_LANGUAGE';
    const TEST_ACTION_URL = 'TEST_ACTION_URL';
    const TEST_ASK_LWA_AUTHORIZE_HOST = 'https://amazon.com';
    const TEST_PORT_STATUS_CLOSED = 'closed';
    const TEST_PERMISSION_REGISTRATION_REQUIRED = {
        status: CONSTANTS.HOSTED_SKILL.PERMISSION_CHECK_RESULT.NEW_USER_REGISTRATION_REQUIRED,
        actionUrl: TEST_ACTION_URL
    };
    const TEST_PERMISSION_ALLOWED = {
        status: CONSTANTS.HOSTED_SKILL.PERMISSION_CHECK_RESULT.ALLOWED
    };

    describe('# test hosted skill helper method - validateUserQualification', () => {
        let infoStub;
        let proxyHelper;
        let endStub;
        let response;
        let loginUrl;
        let urlSearchParams;

        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            const openStub = sinon.stub();
            proxyHelper = proxyquire('@src/commands/new/hosted-skill-helper', {
                open: openStub
            });
            endStub = sinon.stub();
            response = {
                on: sinon.stub().callsArgWith(1),
                end: endStub
            };
            loginUrl = new URL(CONSTANTS.LWA.SIGNIN_URL);
            urlSearchParams = new URLSearchParams();
        });

        afterEach(() => {
            delete process.env.ASK_LWA_AUTHORIZE_HOST;
            sinon.restore();
        });

        it('| get hosted skill permission fails, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, TEST_ERROR);
            // call
            hostedSkillHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| get hosted skill permission response resource limit exceeded, expect no error return', (done) => {
            // setup
            const TEST_RESPONSE = {
                status: CONSTANTS.HOSTED_SKILL.PERMISSION_CHECK_RESULT.RESOURCE_LIMIT_EXCEEDED
            };
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, null, TEST_RESPONSE);
            // call
            hostedSkillHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('Your hosted skills account is limited to a certain number of new hosted skills per minute. '
                + 'Please try again later.');
                done();
            });
        });

        it('| new user registration required to solve captcha, check Port status fails, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, TEST_ERROR);
            // call
            hostedSkillHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(infoStub.args[0][0]).equal('CAPTCHA validation is required for a new hosted skill user.');
                expect(infoStub.args[1][0]).equal('Go to the CAPTCHA page, confirm that you are signed into the correct developer account, '
                + 'and solve the CAPTCHA.\n'
                + 'If your browser does not open the page, quit this process, paste the following url into your browser, '
                + `and complete the CAPTCHA.\n${TEST_ACTION_URL}`);
                done();
            });
        });

        it('| new user registration required to solve captcha, check Port status not closed, expect error thrown', (done) => {
            // setup
            const TEST_PORT_STATUS = '';
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, null, TEST_PORT_STATUS);
            // call
            hostedSkillHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err) => {
                // verify
                expect(err).equal(`${CONSTANTS.LOCALHOST_PORT} port on localhost has been occupied, `
                + 'ask-cli cannot start a local server for receiving authorization code.\n'
                + `Please either abort any processes running on port ${CONSTANTS.LOCALHOST_PORT} `
                + 'or add `--no-browser` flag to the command as an alternative approach.');
                done();
            });
        });

        it('| new user required to solve captcha, open login url with redirect url, expect local host server is listening', () => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, null, TEST_PORT_STATUS_CLOSED);
            sinon.stub(process, 'env');
            const socket = {
                unref: () => {}
            };
            const createStub = sinon.stub(LocalHostServer.prototype, 'create');
            const listenStub = sinon.stub(LocalHostServer.prototype, 'listen').callsArgWith(0);
            const spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');
            const registerEventStub = sinon.stub(LocalHostServer.prototype, 'registerEvent').callsArgWith(1, socket);
            // call
            proxyHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, () => {});
            // verify
            expect(registerEventStub.callCount).eq(1);
            expect(spinnerStartStub.args[0][0]).eq(` Listening on http://localhost:${CONSTANTS.LOCALHOST_PORT}...`);
            expect(spinnerStartStub.callCount).eq(1);
            expect(listenStub.callCount).eq(1);
            expect(createStub.callCount).eq(1);
        });

        it('| new user required to solve captcha, listen response from captcha server error, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, null, TEST_PORT_STATUS_CLOSED);
            sinon.stub(process, 'env');

            sinon.stub(LocalHostServer.prototype, 'listen');
            sinon.stub(LocalHostServer.prototype, 'registerEvent');
            const requestDestroyStub = sinon.stub();
            const request = {
                url: '/captcha?error',
                socket: {
                    destroy: requestDestroyStub
                }
            };
            const spinnerTerminateStub = sinon.stub(SpinnerView.prototype, 'terminate');
            const serverDestroyStub = sinon.stub(LocalHostServer.prototype, 'destroy');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, request, response);
            const TEST_CAPTCHA_ERROR = 'Failed to validate the CAPTCHA with internal service error. Please try again later.';
            // call
            proxyHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err) => {
                // verify
                expect(spinnerTerminateStub.callCount).eq(1);
                expect(serverDestroyStub.callCount).eq(1);
                expect(endStub.callCount).eq(1);
                expect(endStub.args[0][0]).eq(TEST_CAPTCHA_ERROR);
                expect(err).eq(TEST_CAPTCHA_ERROR);
                done();
            });
        });

        it('| new user required to solve captcha, listen response from captcha server vendorId, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, null, TEST_PORT_STATUS_CLOSED);
            sinon.stub(process, 'env');

            sinon.stub(LocalHostServer.prototype, 'listen');
            sinon.stub(LocalHostServer.prototype, 'registerEvent');
            const requestDestroyStub = sinon.stub();
            const request = {
                url: '/captcha?vendorId',
                socket: {
                    destroy: requestDestroyStub
                }
            };
            sinon.stub(SpinnerView.prototype, 'terminate');
            sinon.stub(LocalHostServer.prototype, 'destroy');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, request, response);
            const TEST_CAPTCHA_ERROR = 'The Vendor ID in the browser session does not match the one associated with your CLI profile. \n'
            + 'Please sign into the correct developer account in your browser before completing the CAPTCHA.';
            // call
            proxyHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err) => {
                // verify
                expect(endStub.callCount).eq(1);
                expect(endStub.args[0][0]).eq(TEST_CAPTCHA_ERROR);
                expect(err).eq(TEST_CAPTCHA_ERROR);
                done();
            });
        });

        it('| new user required to solve captcha, listen response from captcha server other errors, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, null, TEST_PORT_STATUS_CLOSED);
            sinon.stub(process, 'env');

            sinon.stub(LocalHostServer.prototype, 'listen');
            sinon.stub(LocalHostServer.prototype, 'registerEvent');
            const requestDestroyStub = sinon.stub();
            const request = {
                url: '',
                socket: {
                    destroy: requestDestroyStub
                }
            };
            sinon.stub(SpinnerView.prototype, 'terminate');
            sinon.stub(LocalHostServer.prototype, 'destroy');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, request, response);
            const TEST_CAPTCHA_ERROR = 'Failed to validate the CAPTCHA. Please try again.';
            // call
            proxyHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err) => {
                // verify
                expect(endStub.callCount).eq(1);
                expect(endStub.args[0][0]).eq(TEST_CAPTCHA_ERROR);
                expect(err).eq(TEST_CAPTCHA_ERROR);
                done();
            });
        });

        it('| new user required to solve captcha, listen response from captcha server to look for "favicon.ico" file, '
        + 'expect ignore the request', () => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission').callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, null, TEST_PORT_STATUS_CLOSED);
            sinon.stub(process, 'env');
            process.env.ASK_LWA_AUTHORIZE_HOST = TEST_ASK_LWA_AUTHORIZE_HOST;

            sinon.stub(LocalHostServer.prototype, 'listen');
            sinon.stub(LocalHostServer.prototype, 'registerEvent');
            const requestDestroyStub = sinon.stub();
            const request = {
                url: '/favicon.ico',
                socket: {
                    destroy: requestDestroyStub
                }
            };
            sinon.stub(SpinnerView.prototype, 'terminate');
            sinon.stub(LocalHostServer.prototype, 'destroy');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, request, response);
            // call
            proxyHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, () => {});
            // verify
            expect(endStub.callCount).eq(1);
        });

        it('| new user required to solve captcha, listen response from captcha server success, check permission again fails, '
        + 'expect error thrown', (done) => {
            // setup
            const hostedSkillPermissionStub = sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission');
            hostedSkillPermissionStub.onCall(0).callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, null, TEST_PORT_STATUS_CLOSED);
            sinon.stub(process, 'env');
            process.env.ASK_LWA_AUTHORIZE_HOST = TEST_ASK_LWA_AUTHORIZE_HOST;

            sinon.stub(LocalHostServer.prototype, 'listen');
            sinon.stub(LocalHostServer.prototype, 'registerEvent');
            const requestDestroyStub = sinon.stub();
            const request = {
                url: '/captcha?success',
                socket: {
                    destroy: requestDestroyStub
                }
            };
            sinon.stub(SpinnerView.prototype, 'terminate');
            sinon.stub(LocalHostServer.prototype, 'destroy');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, request, response);
            const TEST_CAPTCHA_SUCCESS = 'CAPTCHA validation was successful. Please close the browser and return to the command line interface.';
            hostedSkillPermissionStub.onCall(1).callsArgWith(2, TEST_ERROR);
            // call
            proxyHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err) => {
                // verify
                expect(endStub.callCount).eq(1);
                expect(endStub.args[0][0]).eq(TEST_CAPTCHA_SUCCESS);
                expect(err).eq(TEST_ERROR);
                done();
            });
        });

        it('| new user required to solve captcha success, check permission again success, expect no error return', (done) => {
            // setup
            const hostedSkillPermissionStub = sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission');
            hostedSkillPermissionStub.onCall(0).callsArgWith(2, null, TEST_PERMISSION_REGISTRATION_REQUIRED);
            sinon.stub(portScanner, 'checkPortStatus').callsArgWith(1, null, TEST_PORT_STATUS_CLOSED);
            sinon.stub(process, 'env');
            process.env.ASK_LWA_AUTHORIZE_HOST = TEST_ASK_LWA_AUTHORIZE_HOST;

            sinon.stub(LocalHostServer.prototype, 'listen');
            sinon.stub(LocalHostServer.prototype, 'registerEvent');
            const requestDestroyStub = sinon.stub();
            const request = {
                url: '/captcha?success',
                socket: {
                    destroy: requestDestroyStub
                }
            };
            sinon.stub(SpinnerView.prototype, 'terminate');
            sinon.stub(LocalHostServer.prototype, 'destroy');
            sinon.stub(LocalHostServer.prototype, 'create').callsArgWith(0, request, response);
            const TEST_CAPTCHA_SUCCESS = 'CAPTCHA validation was successful. Please close the browser and return to the command line interface.';
            hostedSkillPermissionStub.onCall(1).callsArgWith(2, null, TEST_PERMISSION_ALLOWED);
            // call
            proxyHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err) => {
                // verify
                expect(endStub.callCount).eq(1);
                expect(endStub.args[0][0]).eq(TEST_CAPTCHA_SUCCESS);
                expect(infoStub.args[2][0]).equal('CAPTCHA validation was successfully completed. You are able to create a Alexa hosted skill.');
                expect(err).eq(undefined);
                done();
            });
        });

        it('| not new user check permission success, expect no error return', (done) => {
            // setup
            const hostedSkillPermissionStub = sinon.stub(HostedSkillController.prototype, 'getHostedSkillPermission');
            hostedSkillPermissionStub.callsArgWith(2, null, TEST_PERMISSION_ALLOWED);
            // call
            proxyHelper.validateUserQualification(TEST_VENDOR_ID, HostedSkillController.prototype, (err) => {
                // verify
                expect(err).eq(undefined);
                done();
            });
        });
    });

    describe('# test hosted skill helper method - createHostedSkill', () => {
        const TEST_USER_INPUT = {
            projectFolderName: TEST_FOLDER_NAME,
            skillName: TEST_SKILL_NAME,
            language: TEST_LANGUAGE
        };

        beforeEach(() => {
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| hostedSkillController project already exists, expect error thrown', (done) => {
            // setup
            const TEST_PROJECT_PATH = 'TEST_PROJECT_PATH';
            sinon.stub(path, 'join').returns(TEST_PROJECT_PATH);
            sinon.stub(fs, 'existsSync').returns(true);
            // call
            hostedSkillHelper.createHostedSkill(HostedSkillController.prototype, TEST_USER_INPUT, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(`${TEST_PROJECT_PATH} directory already exists.`);
                done();
            });
        });

        it('| hostedSkillController create skill fails, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'createSkill').callsArgWith(1, TEST_ERROR);
            const spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');
            // call
            hostedSkillHelper.createHostedSkill(HostedSkillController.prototype, TEST_USER_INPUT, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(spinnerStartStub.callCount).eq(1);
                expect(spinnerStartStub.args[0][0]).eq('Creating your Alexa hosted skill. It will take about a minute.');
                expect(res).equal(undefined);
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| hostedSkillController create skill response with skillId, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'createSkill').callsArgWith(1, TEST_ERROR, TEST_SKILL_ID);
            sinon.stub(SpinnerView.prototype, 'start');
            sinon.stub(HostedSkillController.prototype, 'deleteSkill').callsArgWith(1, undefined);
            // call
            hostedSkillHelper.createHostedSkill(HostedSkillController.prototype, TEST_USER_INPUT, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| hostedSkillController create skill succeed, clone fails, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'createSkill').callsArgWith(1, null, TEST_SKILL_ID);
            sinon.stub(SpinnerView.prototype, 'start');
            sinon.stub(process, 'cwd').returns('root/');
            sinon.stub(HostedSkillController.prototype, 'clone').callsArgWith(3, TEST_ERROR);
            // call
            hostedSkillHelper.createHostedSkill(HostedSkillController.prototype, TEST_USER_INPUT, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| hostedSkillController clone succeed, enableSkill fails, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'createSkill').callsArgWith(1, null, TEST_SKILL_ID);
            sinon.stub(process, 'cwd').returns('root/');
            sinon.stub(HostedSkillController.prototype, 'clone').callsArgWith(3, null);
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').yields(TEST_ERROR);
            // call
            hostedSkillHelper.createHostedSkill(HostedSkillController.prototype, TEST_USER_INPUT, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| hostedSkillController clone succeed, downloadGitHooksTemplate fails, expect error thrown', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'createSkill').callsArgWith(1, null, TEST_SKILL_ID);
            sinon.stub(process, 'cwd').returns('root/');
            sinon.stub(HostedSkillController.prototype, 'clone').callsArgWith(3, null);
            sinon.stub(HostedSkillController.prototype, 'downloadGitHooksTemplate').callsArgWith(2, TEST_ERROR);
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').yields();
            // call
            hostedSkillHelper.createHostedSkill(HostedSkillController.prototype, TEST_USER_INPUT, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| hostedSkillController create skill succeed, clone succeed, expect skillId return', (done) => {
            // setup
            sinon.stub(HostedSkillController.prototype, 'createSkill').callsArgWith(1, null, TEST_SKILL_ID);
            sinon.stub(process, 'cwd').returns('root/');
            sinon.stub(HostedSkillController.prototype, 'clone').callsArgWith(3, null);
            sinon.stub(HostedSkillController.prototype, 'downloadGitHooksTemplate').callsArgWith(2, null);
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').yields();
            // call
            hostedSkillHelper.createHostedSkill(HostedSkillController.prototype, TEST_USER_INPUT, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(res).equal(TEST_SKILL_ID);
                expect(err).equal(null);
                done();
            });
        });
    });
});
