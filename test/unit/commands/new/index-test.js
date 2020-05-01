const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const NewCommand = require('@src/commands/new');
const helper = require('@src/commands/new/helper');
const hostedHelper = require('@src/commands/new/hosted-skill-helper');
const optionModel = require('@src/commands/option-model');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');
const wizardHelper = require('@src/commands/new/wizard-helper');

describe('Commands new test - command class test', () => {
    const FIXTURE_BASE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(FIXTURE_BASE_PATH, 'regular-proj', 'ask-resources.json');
    const FIXTURE_MANIFEST_FILE_PATH = path.join(FIXTURE_BASE_PATH, 'manifest.json');
    const FIXTURE_HOSTED_RESOURCES_CONFIG_FILE_PATH = path.join(FIXTURE_BASE_PATH, 'hosted-proj', 'ask-resources.json');
    const TEST_PROFILE = 'default';
    const TEST_VENDOR_ID = 'vendorId';
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_SKILL_NAME = 'skillName';
    const TEST_PROJECT_PATH = 'projectPath';
    const TEST_ERROR = 'TEST_ERROR';
    const TEST_DEPLOYMENT_TYPE = '@ask-cli/cfn-deployer';
    const TEST_HOSTED_DEPLOYMENT = '@ask-cli/hosted-skill-deployer';
    const TEST_CMD = {
        profile: TEST_PROFILE
    };

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
        const instance = new NewCommand(optionModel);
        expect(instance.name()).equal('new');
        expect(instance.description()).equal('create a new skill project from Alexa skill templates');
        expect(instance.requiredOptions()).deep.equal([]);
        expect(instance.optionalOptions()).deep.equal(['templateUrl', 'templateBranch', 'profile', 'debug']);
    });

    describe('validate command handle', () => {
        describe('command handle - collect user creation Project Info', () => {
            let instance;

            beforeEach(() => {
                instance = new NewCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(profileHelper, 'resolveVendorId').returns(TEST_PROFILE);
                sinon.stub(wizardHelper, 'collectUserCreationProjectInfo');
                sinon.stub(hostedHelper, 'validateUserQualification');
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| when profile is not correct, expect throw error', (done) => {
                // setup
                profileHelper.runtimeProfile.throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('error');
                    expect(errorStub.args[0][0].message).equal('error');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| wizard helper collectUserCreationProjectInfo fails, expect error thrown', (done) => {
                // setup
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.args[0][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| wizard helper collectUserCreationProjectInfo without user input, expect error thrown', (done) => {
                // setup
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, null);
                // call
                instance.handle(TEST_CMD, (err, res) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(res).equal(undefined);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - create hosted skill', () => {
            let instance;

            beforeEach(() => {
                instance = new NewCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(profileHelper, 'resolveVendorId').returns(TEST_PROFILE);
                sinon.stub(wizardHelper, 'collectUserCreationProjectInfo');
                sinon.stub(hostedHelper, 'validateUserQualification');
                sinon.stub(hostedHelper, 'createHostedSkill');
                new ResourcesConfig(FIXTURE_HOSTED_RESOURCES_CONFIG_FILE_PATH);
            });

            afterEach(() => {
                sinon.restore();
                ResourcesConfig.dispose();
            });

            it('| hosted helper validate user qualification fails, expect error thrown', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    deploymentType: TEST_HOSTED_DEPLOYMENT
                };
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                hostedHelper.validateUserQualification.callsArgWith(2, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| hosted helper create hosted skill fails, expect error thrown', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    deploymentType: TEST_HOSTED_DEPLOYMENT
                };
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                hostedHelper.validateUserQualification.callsArgWith(2, null);
                hostedHelper.createHostedSkill.callsArgWith(3, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| hosted helper create hosted skill succeed, expect correct response', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    deploymentType: TEST_HOSTED_DEPLOYMENT
                };
                const GIT_USAGE_HOSTED_SKILL_DOCUMENTATION = 'https://developer.amazon.com/en-US/docs/alexa/'
                    + 'hosted-skills/build-a-skill-end-to-end-using-an-alexa-hosted-skill.html#askcli';
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                hostedHelper.validateUserQualification.callsArgWith(2, null);
                hostedHelper.createHostedSkill.callsArgWith(3, null, TEST_SKILL_ID);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(infoStub.args[1][0]).equal(`Hosted skill provisioning finished. Skill-Id: ${TEST_SKILL_ID}`);
                    expect(infoStub.args[2][0]).equal(`Please follow the instructions at ${GIT_USAGE_HOSTED_SKILL_DOCUMENTATION}`
                        + ' to learn more about the usage of "git" for Hosted skill.');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - create non hosted skill', () => {
            let instance;

            beforeEach(() => {
                instance = new NewCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(profileHelper, 'resolveVendorId').returns(TEST_VENDOR_ID);
                sinon.stub(helper, 'loadSkillProjectModel');
                sinon.stub(helper, 'downloadTemplateFromGit');
                sinon.stub(helper, 'initializeDeployDelegate');
                sinon.stub(wizardHelper, 'collectUserCreationProjectInfo');
                sinon.stub(helper, 'updateSkillProjectWithUserSettings');
                new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
                new Manifest(FIXTURE_MANIFEST_FILE_PATH);
            });

            afterEach(() => {
                sinon.restore();
                ResourcesConfig.dispose();
                Manifest.dispose();
            });

            it('| download template From git fails, expect error thrown', (done) => {
                // setup
                const TEST_USER_INPUT = {};
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                helper.downloadTemplateFromGit.callsArgWith(2, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| load skill project model fails, expect error thrown', (done) => {
                // setup
                const TEST_USER_INPUT = {};
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                helper.downloadTemplateFromGit.callsArgWith(2, null);
                helper.loadSkillProjectModel.throws(new Error(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| update skill project with user settings fails, expect error thrown', (done) => {
                // setup
                const TEST_USER_INPUT = {};
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                helper.downloadTemplateFromGit.callsArgWith(2, null);
                helper.updateSkillProjectWithUserSettings.throws(new Error(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| initialize Deploy Delegate fails, expect error thrown', (done) => {
                // setup
                const TEST_USER_INPUT = {};
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                helper.downloadTemplateFromGit.callsArgWith(2, null);
                helper.initializeDeployDelegate.callsArgWith(4, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| create Non Hosted Skill succeed, expect correct response', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    skillName: TEST_SKILL_NAME
                };
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                helper.downloadTemplateFromGit.callsArgWith(2, null, TEST_PROJECT_PATH);
                helper.initializeDeployDelegate.callsArgWith(4, null, TEST_DEPLOYMENT_TYPE);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(infoStub.args[1][0]).equal(`Project for skill "${TEST_SKILL_NAME}" is successfully created at ${TEST_PROJECT_PATH}\n`);
                    expect(infoStub.args[2][0]).equal(`Project initialized with deploy delegate "${TEST_DEPLOYMENT_TYPE}" successfully.`);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| create Non Hosted Skill without deployment type succeed, expect correct response', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    skillName: TEST_SKILL_NAME
                };
                wizardHelper.collectUserCreationProjectInfo.callsArgWith(1, null, TEST_USER_INPUT);
                helper.downloadTemplateFromGit.callsArgWith(2, null, TEST_PROJECT_PATH);
                helper.initializeDeployDelegate.callsArgWith(4, null, null);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(infoStub.args[1][0]).equal(`Project for skill "${TEST_SKILL_NAME}" is successfully created at ${TEST_PROJECT_PATH}\n`);
                    expect(infoStub.args[2][0]).equal('Project initialized successfully.');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });
    });
});
