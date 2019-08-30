const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const NewCommand = require('@src/commands/v2new');
const helper = require('@src/commands/v2new/helper');
const optionModel = require('@src/commands/option-model');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');


describe('Commands new test - command class test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'resources-config.json');
    const FIXTURE_MANIFEST_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'manifest.json');

    const TEST_PROFILE = 'default';
    const TEST_TEMPLATE_URL = 'templateUrl';
    const TEST_SKILL_NAME = 'skillName';
    const TEST_PROJECT_PATH = 'projectPath';
    const TEST_USER_INPUT = {
        skillName: TEST_SKILL_NAME,
        projectFolderPath: TEST_PROJECT_PATH
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
        expect(instance.optionalOptions()).deep.equal(['templateUrl', 'profile', 'debug']);
    });

    describe('validate command handle', () => {
        describe('command handle - download skill templates', () => {
            let instance;

            beforeEach(() => {
                instance = new NewCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| when profile is not correct, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
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

            it('| new with official template fail, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                sinon.stub(helper, 'newWithOfficialTemplate').callsArgWith(1, 'error');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal('error');
                    expect(errorStub.args[0][0]).equal('error');
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| new with custom template fail, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    templateUrl: TEST_TEMPLATE_URL,
                    profile: TEST_PROFILE
                };
                sinon.stub(helper, 'newWithCustomTemplate').callsArgWith(2, 'error');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal('error');
                    expect(errorStub.args[0][0]).equal('error');
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| new with custom template without user input, expect quit the process', (done) => {
                // setup
                const TEST_CMD = {
                    templateUrl: TEST_TEMPLATE_URL,
                    profile: TEST_PROFILE
                };
                sinon.stub(helper, 'newWithCustomTemplate').callsArgWith(2);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| new with custom template without user input, expect quit the process', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                sinon.stub(helper, 'newWithOfficialTemplate').callsArgWith(1);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| new with custom template pass but load model fail, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    templateUrl: TEST_TEMPLATE_URL,
                    profile: TEST_PROFILE
                };
                sinon.stub(helper, 'newWithCustomTemplate').callsArgWith(2, 'error');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal('error');
                    expect(errorStub.args[0][0]).equal('error');
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - skill project loading and refresh', () => {
            let instance;
            const TEST_CMD = {
                templateUrl: TEST_TEMPLATE_URL,
                profile: TEST_PROFILE
            };

            beforeEach(() => {
                instance = new NewCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(helper, 'newWithCustomTemplate').callsArgWith(2, null, TEST_USER_INPUT);
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| load skill project fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'loadSkillProjectModel').throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('error');
                    expect(errorStub.args[0][0].message).equal('error');
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(infoStub.args[2][0]).equal(`Project for skill "${TEST_SKILL_NAME}" is successfully created at ${TEST_PROJECT_PATH}\n`);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| refresh skill project fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'loadSkillProjectModel');
                sinon.stub(helper, 'updateSkillProjectWithUserSettings').throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('error');
                    expect(errorStub.args[0][0].message).equal('error');
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(infoStub.args[2][0]).equal(`Project for skill "${TEST_SKILL_NAME}" is successfully created at ${TEST_PROJECT_PATH}\n`);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - initiate deploy delegate', () => {
            let instance;
            const TEST_CMD = {
                profile: TEST_PROFILE
            };

            beforeEach(() => {
                instance = new NewCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(helper, 'newWithOfficialTemplate').callsArgWith(1, null, TEST_USER_INPUT);
                sinon.stub(helper, 'loadSkillProjectModel');
                sinon.stub(helper, 'updateSkillProjectWithUserSettings');
                new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
                new Manifest(FIXTURE_MANIFEST_FILE_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
                Manifest.dispose();
                sinon.restore();
            });

            it('| helper bootstrap project fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'bootstrapProject').callsArgWith(3, 'error');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal('error');
                    expect(errorStub.args[0][0]).equal('error');
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(infoStub.args[2][0]).equal(`Project for skill "${TEST_SKILL_NAME}" is successfully created at ${TEST_PROJECT_PATH}\n`);
                    expect(infoStub.args[3][0]).equal('-------------- Skill Infrastructure --------------');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| helper bootstrap project pass, expect execute succeeds', (done) => {
                // setup
                sinon.stub(helper, 'bootstrapProject').callsArgWith(3);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.args[0][0]).equal('-------------- Skill Metadata & Code --------------');
                    expect(infoStub.args[1][0]).equal('Please follow the wizard to start your Alexa skill project ->');
                    expect(infoStub.args[2][0]).equal(`Project for skill "${TEST_SKILL_NAME}" is successfully created at ${TEST_PROJECT_PATH}\n`);
                    expect(infoStub.args[3][0]).equal('-------------- Skill Infrastructure --------------');
                    expect(infoStub.args[4][0].startsWith('Project initialized with deploy delegate')).equal(true);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });
    });
});
