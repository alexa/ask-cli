const { expect } = require('chai');
const sinon = require('sinon');

const InitCommand = require('./node_modules/@src/commands/init');
const helper = require('./node_modules/@src/commands/init/helper');
const optionModel = require('./node_modules/@src/commands/option-model');
const Messenger = require('./node_modules/@src/view/messenger');
const profileHelper = require('./node_modules/@src/utils/profile-helper');


describe('Commands init test - command class test', () => {
    const TEST_PROFILE = 'default';
    const TEST_ERROR = 'init error';
    const TEST_SKILL_ID = 'skillId';
    const TEST_SRC = 'src';
    const TEST_SKILL_META = { src: TEST_SRC };
    const TEST_SKILL_CODE = { src: TEST_SRC };
    const TEST_SKILL_INFRA = {};

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
        const instance = new InitCommand(optionModel);
        expect(instance.name()).equal('init');
        expect(instance.description()).equal('setup a new or existing Alexa skill project');
        expect(instance.requiredOptions()).deep.equal([]);
        expect(instance.optionalOptions()).deep.equal(['profile', 'debug']);
    });

    describe('validate command handle', () => {
        describe('command handle - pre init check', () => {
            let instance;

            beforeEach(() => {
                instance = new InitCommand(optionModel);
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

            it('| when pre init check fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                sinon.stub(helper, 'preInitCheck').callsArgWith(2, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - collect ask resources', () => {
            let instance;

            beforeEach(() => {
                instance = new InitCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(helper, 'preInitCheck').callsArgWith(2);
                sinon.stub(helper, 'getSkillIdUserInput');
                sinon.stub(helper, 'getSkillMetadataUserInput');
                sinon.stub(helper, 'getSkillCodeUserInput');
                sinon.stub(helper, 'getSkillInfraUserInput');
                sinon.stub(helper, 'previewAndWriteAskResources').callsArgWith(3, TEST_ERROR);
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| when collect skill id fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill meta src fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill code src fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
                helper.getSkillCodeUserInput.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill code src is not provided, callback without continuing', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
                helper.getSkillCodeUserInput.callsArgWith(0, null, null);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(helper.previewAndWriteAskResources.args[0][1]).deep.equal({
                        skillId: TEST_SKILL_ID,
                        skillMeta: {
                            src: TEST_SRC
                        }
                    });
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill infra fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
                helper.getSkillCodeUserInput.callsArgWith(0, null, TEST_SKILL_CODE);
                helper.getSkillInfraUserInput.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill info all succeed, expect it passes correct user input', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
                helper.getSkillCodeUserInput.callsArgWith(0, null, TEST_SKILL_CODE);
                helper.getSkillInfraUserInput.callsArgWith(0, null, TEST_SKILL_INFRA);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(helper.previewAndWriteAskResources.args[0][1]).deep.equal({
                        skillId: TEST_SKILL_ID,
                        skillMeta: TEST_SKILL_META,
                        skillCode: TEST_SKILL_CODE,
                        skillInfra: TEST_SKILL_INFRA
                    });
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - post user input logics', () => {
            let instance;

            beforeEach(() => {
                instance = new InitCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(helper, 'preInitCheck').callsArgWith(2);
                sinon.stub(helper, 'getSkillIdUserInput').callsArgWith(0, null, TEST_SKILL_ID);
                sinon.stub(helper, 'getSkillMetadataUserInput').callsArgWith(0, null, TEST_SKILL_META);
                sinon.stub(helper, 'getSkillCodeUserInput').callsArgWith(0, null, TEST_SKILL_CODE);
                sinon.stub(helper, 'getSkillInfraUserInput').callsArgWith(0, null, TEST_SKILL_INFRA);

                sinon.stub(helper, 'previewAndWriteAskResources');
                sinon.stub(helper, 'bootstrapSkillInfra');
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| when preview and write fails, expect throws error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.previewAndWriteAskResources.callsArgWith(3, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when post init executions fails, expect throws error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.previewAndWriteAskResources.callsArgWith(3);
                helper.bootstrapSkillInfra.callsArgWith(3, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when all the steps succeed, expect seeing success message', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.previewAndWriteAskResources.callsArgWith(3);
                helper.bootstrapSkillInfra.callsArgWith(3);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('\nSuccess! Run "ask deploy" to deploy your skill.');
                    expect(infoStub.callCount).equal(1);
                    expect(errorStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });
    });
});
