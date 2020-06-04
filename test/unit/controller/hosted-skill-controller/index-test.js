const { expect } = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CloneFlow = require('@src/controllers/hosted-skill-controller/clone-flow');
const helper = require('@src/controllers/hosted-skill-controller/helper');
const HostedSkillController = require('@src/controllers/hosted-skill-controller');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const CONSTANTS = require('@src/utils/constants');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');

describe('Controller test - hosted skill controller test', () => {
    const TEST_PROFILE = 'default'; // test file uses 'default' profile
    const TEST_DO_DEBUG = false;
    const TEST_SKILL_ID = 'SKILL_ID';
    const TEST_SKILL_NAME = 'SKILL_NAME';
    const TEST_MANIFEST = {};
    const TEST_VENDOR_ID = 'TEST_VENDOR_ID';
    const TEST_PERMISSION_TYPE = 'TEST_PERMISSION_TYPE';
    const TEST_PROJECT_PATH = 'PROJECT_PATH';
    const TEST_LOCALE = 'en-US';
    const TEST_CONFIGURATION = {
        profile: TEST_PROFILE,
        doDebug: TEST_DO_DEBUG
    };
    describe('# inspect correctness for constructor', () => {
        it('| initiate as a HostedSkillController class', () => {
            const hostedSkillController = new HostedSkillController(TEST_CONFIGURATION);
            expect(hostedSkillController).to.be.instanceOf(HostedSkillController);
            expect(hostedSkillController.profile).equal(TEST_PROFILE);
            expect(hostedSkillController.doDebug).equal(TEST_DO_DEBUG);
        });
    });

    describe('# test class method: createSkill', () => {
        let hostedSkillController;
        beforeEach(() => {
            hostedSkillController = new HostedSkillController(TEST_CONFIGURATION);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| create hosted skill fails, expect error thrown', (done) => {
            // setup
            const TEST_ERROR = 'TEST_ERROR';
            sinon.stub(httpClient, 'request').callsArgWith(3, TEST_ERROR); // stub createHostedSkill request
            // call
            hostedSkillController.createSkill(TEST_MANIFEST, (err, res) => {
                expect(err).equal(TEST_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| create hosted skill response status >= 300, expect error thrown', (done) => {
            // setup
            const TEST_ERROR = 'TEST_ERROR';
            const TEST_STATUS_ERROR = {
                statusCode: 403,
                body: {
                    error: TEST_ERROR
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_STATUS_ERROR); // stub createHostedSkill request
            // call
            hostedSkillController.createSkill(TEST_MANIFEST, (err, res) => {
                expect(err).equal(jsonView.toString({ error: TEST_ERROR }));
                expect(res).equal(undefined);
                done();
            });
        });

        it('| polling skill status fails, expect error thrown', (done) => {
            // setup
            const TEST_CREATE_SKILL_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {}
            };
            const TEST_POLLING_ERROR = 'TEST_POLLING_ERROR';
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_CREATE_SKILL_RESPONSE); // stub createHostedSkill request
            sinon.stub(helper, 'pollingSkillStatus').callsArgWith(2, TEST_POLLING_ERROR);
            // call
            hostedSkillController.createSkill(TEST_MANIFEST, (err, res) => {
                expect(err).equal(TEST_POLLING_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| polling skill status succeed, expect skillId return', (done) => {
            // setup
            const TEST_CREATE_SKILL_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {
                    skillId: TEST_SKILL_ID
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_CREATE_SKILL_RESPONSE); // stub createHostedSkill request
            sinon.stub(helper, 'pollingSkillStatus').callsArgWith(2, null);
            sinon.stub(helper, 'handleSkillStatus').callsArgWith(2, null);
            // call
            hostedSkillController.createSkill(TEST_MANIFEST, (err, res) => {
                expect(err).equal(null);
                expect(res).equal(TEST_SKILL_ID);
                done();
            });
        });
    });

    describe('# test class method: clone', () => {
        let hostedSkillController;
        let infoStub;
        beforeEach(() => {
            hostedSkillController = new HostedSkillController(TEST_CONFIGURATION);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| project directory already exists, expect error thrown ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').withArgs(TEST_PROJECT_PATH).returns(true);
            // call
            hostedSkillController.clone(TEST_SKILL_ID, TEST_SKILL_NAME, TEST_PROJECT_PATH, (err, res) => {
                expect(err).equal(`${TEST_PROJECT_PATH} directory already exists.`);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| get Hosted skill Metadata fails, expect error thrown ', (done) => {
            // setup
            const TEST_METADATA_ERROR = 'TEST_METADATA_ERROR';
            const TEST_ERROR = new Error(TEST_METADATA_ERROR);
            sinon.stub(fs, 'existsSync').withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(httpClient, 'request').callsArgWith(3, TEST_ERROR); // stub getAlexaHostedSkillMetadata smapi request
            // call
            hostedSkillController.clone(TEST_SKILL_ID, TEST_SKILL_NAME, TEST_PROJECT_PATH, (err, res) => {
                expect(err.message).equal(TEST_METADATA_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| get Hosted skill Metadata response status >= 300, expect error thrown ', (done) => {
            // setup
            const TEST_METADATA_ERROR = 'TEST_METADATA_ERROR';
            const TEST_STATUS_ERROR = {
                statusCode: 403,
                body: {
                    error: TEST_METADATA_ERROR
                }
            };
            sinon.stub(fs, 'existsSync').withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_STATUS_ERROR); // stub getAlexaHostedSkillMetadata smapi request
            // call
            hostedSkillController.clone(TEST_SKILL_ID, TEST_SKILL_NAME, TEST_PROJECT_PATH, (err, res) => {
                expect(err).equal(jsonView.toString({ error: TEST_METADATA_ERROR }));
                expect(res).equal(undefined);
                done();
            });
        });

        it('| do skill package exist fails, expect error thrown ', (done) => {
            // setup
            const TEST_SKILL_PACKAGE_ERROR = 'TEST_SKILL_PACKAGE_ERROR';
            const TEST_STATUS_RESPONSE = {
                statusCode: 200,
                body: {}
            };
            sinon.stub(fs, 'existsSync').withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_STATUS_RESPONSE); // stub getAlexaHostedSkillMetadata smapi request
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillMetadata').yields(null, { repository: { url: 'test' } });
            sinon.stub(CloneFlow, 'generateProject');
            sinon.stub(CloneFlow, 'cloneProjectFromGit');
            sinon.stub(CloneFlow, 'doSkillPackageExist').callsArgWith(3, TEST_SKILL_PACKAGE_ERROR);
            // call
            hostedSkillController.clone(TEST_SKILL_ID, TEST_SKILL_NAME, TEST_PROJECT_PATH, (err, res) => {
                expect(err).equal(TEST_SKILL_PACKAGE_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| skill package exists, expect skill-package generated ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillMetadata').yields(null, { repository: { url: 'test' } });
            sinon.stub(CloneFlow, 'generateProject');
            sinon.stub(CloneFlow, 'cloneProjectFromGit');
            sinon.stub(CloneFlow, 'doSkillPackageExist').callsArgWith(3, null, true);
            // call
            hostedSkillController.clone(TEST_SKILL_ID, TEST_SKILL_NAME, TEST_PROJECT_PATH, (err) => {
                expect(err).equal(undefined);
                expect(Messenger.getInstance().info.args[0][0]).equal(
                    `\nSkill schema and interactionModels for ${TEST_SKILL_NAME} created at\n\t./skill-package\n`
                );
                done();
            });
        });

        it('| skill package do NOT exist, export skill-package fails, expect no error ', (done) => {
            // setup
            const TEST_EXPORT_ERROR = 'TEST_EXPORT_ERROR';
            sinon.stub(fs, 'existsSync').withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillMetadata').yields(null, { repository: { url: 'test' } });
            sinon.stub(CloneFlow, 'generateProject');
            sinon.stub(CloneFlow, 'cloneProjectFromGit');
            sinon.stub(CloneFlow, 'doSkillPackageExist').callsArgWith(3, null, false);
            sinon.stub(SkillMetadataController.prototype, 'getSkillPackage').callsArgWith(3, TEST_EXPORT_ERROR);
            // call
            hostedSkillController.clone(TEST_SKILL_ID, TEST_SKILL_NAME, TEST_PROJECT_PATH, (err) => {
                expect(err).equal(TEST_EXPORT_ERROR);
                done();
            });
        });

        it('| skill package do NOT exist, export skill-package succeed, expect skill-package generated ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(HostedSkillController.prototype, 'getHostedSkillMetadata').yields(null, { repository: { url: 'test' } });
            sinon.stub(CloneFlow, 'generateProject');
            sinon.stub(CloneFlow, 'cloneProjectFromGit');
            sinon.stub(CloneFlow, 'doSkillPackageExist').callsArgWith(3, null);
            sinon.stub(SkillMetadataController.prototype, 'getSkillPackage').callsArgWith(3, null);
            // call
            hostedSkillController.clone(TEST_SKILL_ID, TEST_SKILL_NAME, TEST_PROJECT_PATH, (err) => {
                expect(err).equal(undefined);
                expect(Messenger.getInstance().info.args[0][0]).equal(
                    `\nSkill schema and interactionModels for ${TEST_SKILL_NAME} created at\n\t./skill-package\n`
                );
                done();
            });
        });
    });


    describe('# test class method: getHostedSkillPermission', () => {
        let hostedSkillController;
        beforeEach(() => {
            hostedSkillController = new HostedSkillController(TEST_CONFIGURATION);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| get hosted skill permission fails, expect error thrown', (done) => {
            // setup
            const TEST_ERROR = 'TEST_ERROR';
            sinon.stub(httpClient, 'request').callsArgWith(3, TEST_ERROR); // stub getHostedSkillPermission request
            // call
            hostedSkillController.getHostedSkillPermission(TEST_VENDOR_ID, TEST_PERMISSION_TYPE, (err, res) => {
                expect(err).equal(TEST_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| get hosted skill permission response status >= 300, expect error thrown', (done) => {
            // setup
            const TEST_ERROR = 'TEST_ERROR';
            const TEST_STATUS_ERROR = {
                statusCode: 403,
                body: {
                    error: TEST_ERROR
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_STATUS_ERROR); // stub getHostedSkillPermission request
            // call
            hostedSkillController.getHostedSkillPermission(TEST_VENDOR_ID, TEST_PERMISSION_TYPE, (err, res) => {
                expect(err).equal(jsonView.toString({ error: TEST_ERROR }));
                expect(res).equal(undefined);
                done();
            });
        });

        it('| get hosted skill permission succeed, expect error thrown', (done) => {
            // setup
            const TEST_PERMISSION_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {}
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_PERMISSION_RESPONSE); // stub getHostedSkillPermission request
            // call
            hostedSkillController.getHostedSkillPermission(TEST_VENDOR_ID, TEST_PERMISSION_TYPE, (err) => {
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test class method: checkSkillStatus', () => {
        let hostedSkillController;
        let infoStub;
        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
            });
            hostedSkillController = new HostedSkillController(TEST_CONFIGURATION);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| polling to get skill status fails, expect error thrown ', (done) => {
            // setup
            const TEST_STATUS_ERROR = 'TEST_STATUS_ERROR';
            const TEST_ERROR = new Error(TEST_STATUS_ERROR);
            sinon.stub(httpClient, 'request').callsArgWith(3, TEST_ERROR); // stub getSkillStatus smapi request
            // call
            hostedSkillController.checkSkillStatus(TEST_SKILL_ID, (err, res) => {
                expect(err.message).equal(TEST_STATUS_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| polling to get skill status response >= 300, expect error thrown ', (done) => {
            // setup
            const TEST_STATUS_ERROR = 'TEST_STATUS_ERROR';
            const TEST_ERROR = {
                statusCode: 403,
                body: {
                    error: TEST_STATUS_ERROR
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_ERROR); // stub getSkillStatus smapi request
            // call
            hostedSkillController.checkSkillStatus(TEST_SKILL_ID, (err, res) => {
                expect(err).equal(jsonView.toString({ error: TEST_STATUS_ERROR }));
                expect(res).equal(undefined);
                done();
            });
        });

        it('| polling to get skill status until all resources are SUCCEEDED, expect correct response', (done) => {
            // setup
            const TEST_STATUS_RESPONSE_0 = {
                statusCode: 200,
                headers: {},
                body: {
                    [CONSTANTS.HOSTED_SKILL.RESOURCES.MANIFEST]: {
                        lastUpdateRequest: {
                            status: 'SUCCEEDED'
                        }
                    }
                }
            };
            const TEST_STATUS_RESPONSE_1 = {
                statusCode: 200,
                headers: {},
                body: {
                    [CONSTANTS.HOSTED_SKILL.RESOURCES.MANIFEST]: {
                        lastUpdateRequest: {
                            status: 'SUCCEEDED'
                        }
                    },
                    [CONSTANTS.HOSTED_SKILL.RESOURCES.INTERACTION_MODEL]: {
                        [TEST_LOCALE]: {
                            lastUpdateRequest: {
                                status: 'SUCCEEDED'
                            }
                        }
                    },
                    [CONSTANTS.HOSTED_SKILL.RESOURCES.PROVISIONING]: {
                        lastUpdateRequest: {
                            status: 'SUCCEEDED'
                        }
                    }
                }
            };
            const stubTestFunc = sinon.stub(httpClient, 'request'); // stub getSkillStatus smapi request
            stubTestFunc.onCall(0).callsArgWith(3, null, TEST_STATUS_RESPONSE_0);
            stubTestFunc.onCall(1).callsArgWith(3, null, TEST_STATUS_RESPONSE_1);
            // call
            hostedSkillController.checkSkillStatus(TEST_SKILL_ID, (err, res) => {
                expect(err).equal(null);
                expect(res).equal(TEST_SKILL_ID);
                done();
            });
        });

        it('| polling to get skill status response is null, expect error thrown ', (done) => {
            // setup
            const TEST_RESPONSE = null;
            sinon.stub(helper, 'pollingSkillStatus').callsArgWith(2, null, TEST_RESPONSE);
            // call
            hostedSkillController.checkSkillStatus(TEST_SKILL_ID, (err, res) => {
                expect(err).equal('Response from the creation of hosted skill is not valid.');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| polling to get skill status some resources are IN_PROGRESS, expect error thrown ', (done) => {
            // setup
            const TEST_RESPONSE = {
                manifest: CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.SUCCESS,
                interactionModel: CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.IN_PROGRESS,
                hostedSkillProvisioning: CONSTANTS.HOSTED_SKILL.PROVISIONING_STATUS.IN_PROGRESS
            };
            sinon.stub(helper, 'pollingSkillStatus').callsArgWith(2, null, TEST_RESPONSE);
            // call
            hostedSkillController.checkSkillStatus(TEST_SKILL_ID, (err, res) => {
                expect(err).equal('Timeout when checking the status of hosted-skill creation. Please try again.');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| polling to get provisioning is FAILURE, expect error thrown ', (done) => {
            // setup
            const TEST_RESPONSE = {
                manifest: CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.SUCCESS,
                interactionModel: CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.SUCCESS,
                hostedSkillProvisioning: CONSTANTS.HOSTED_SKILL.PROVISIONING_STATUS.FAILURE
            };
            sinon.stub(helper, 'pollingSkillStatus').callsArgWith(2, null, TEST_RESPONSE);
            // call
            hostedSkillController.checkSkillStatus(TEST_SKILL_ID, (err, res) => {
                expect(err).equal(
                    'Check skill status failed for the following reason:\nSkill provisioning step failed.\n'
                    + 'Infrastructure provision for the hosted skill failed. Please try again.'
                );
                expect(res).equal(undefined);
                done();
            });
        });

        it('| polling to get skill status interactionModel is FAILURE, expect error thrown ', (done) => {
            // setup
            const TEST_RESPONSE = {
                manifest: CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.FAILURE,
                interactionModel: CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.FAILURE,
                hostedSkillProvisioning: CONSTANTS.HOSTED_SKILL.PROVISIONING_STATUS.SUCCESS
            };
            sinon.stub(helper, 'pollingSkillStatus').callsArgWith(2, null, TEST_RESPONSE);
            // call
            hostedSkillController.checkSkillStatus(TEST_SKILL_ID, (err, res) => {
                expect(err).equal(
                    'Check skill status failed for the following reason:\n'
                    + 'Skill interaction model building step failed\nSkill manifest building step failed\n'
                    + 'Infrastructure provision for the hosted skill failed. Please try again.'
                );
                expect(res).equal(undefined);
                done();
            });
        });
    });

    describe('# test class method: deleteSkill', () => {
        let hostedSkillController;
        beforeEach(() => {
            hostedSkillController = new HostedSkillController(TEST_CONFIGURATION);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| delete skill fails, expect error thrown', (done) => {
            // setup
            const TEST_ERROR = 'TEST_ERROR';
            sinon.stub(httpClient, 'request').callsArgWith(3, TEST_ERROR); // stub deleteSkill request
            // call
            hostedSkillController.deleteSkill(TEST_SKILL_ID, (err, res) => {
                expect(err).equal(TEST_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| delete skill  succeed, expect no response', (done) => {
            // setup
            const TEST_DELETE_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {}
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_DELETE_RESPONSE); // stub deleteSkill request
            // call
            hostedSkillController.deleteSkill(TEST_SKILL_ID, (err) => {
                expect(err).equal(undefined);
                done();
            });
        });
    });
});
