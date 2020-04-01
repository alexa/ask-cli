const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');

const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const helper = require('@src/commands/init/helper');
const ui = require('@src/commands/init/ui');
const ResourcesConfig = require('@src/model/resources-config');
const AskResources = require('@src/model/resources-config/ask-resources');
const AskStates = require('@src/model/resources-config/ask-states');
const CONSTANTS = require('@src/utils/constants');
const Messenger = require('@src/view/messenger');


describe('Commands init - helper test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj', 'ask-resources.json');
    const TEST_PROFILE = 'default';
    const TEST_SKILL_ID = 'skillId';
    const TEST_SRC = 'src';
    const TEST_ROOT = 'root';
    const TEST_ERROR = 'init error';

    describe('# unit test for method preInitCheck', () => {
        let uiShowInitStub;
        let uiConfirmOverwriteStub;
        let fsExistsStub;

        beforeEach(() => {
            uiShowInitStub = sinon.stub(ui, 'showInitInstruction');
            fsExistsStub = sinon.stub(fs, 'existsSync').returns(true);
            uiConfirmOverwriteStub = sinon.stub(ui, 'confirmOverwrite');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| verify init instruction displayed, but overwrite confirmation fails', (done) => {
            // setup
            uiConfirmOverwriteStub.callsArgWith(0, TEST_ERROR);
            // call
            helper.preInitCheck(TEST_ROOT, TEST_PROFILE, (err, res) => {
                // verify
                expect(uiShowInitStub.callCount).equal(1);
                expect(err).equal(TEST_ERROR);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| pre init check and overwrite confirmation returns false', (done) => {
            // setup
            uiConfirmOverwriteStub.callsArgWith(0, null, false);
            // call
            helper.preInitCheck(TEST_ROOT, TEST_PROFILE, (err, res) => {
                // verify
                expect(uiShowInitStub.callCount).equal(1);
                expect(err.message).equal(`Please modify the existing ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG} file or choose to overwrite.`);
                expect(err.name).equal('CliWarn');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| pre init check and overwrite confirmation returns true', (done) => {
            // setup
            uiConfirmOverwriteStub.callsArgWith(0, null, true);
            // call
            helper.preInitCheck(TEST_ROOT, TEST_PROFILE, (err, res) => {
                // verify
                expect(uiShowInitStub.callCount).equal(1);
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| pre init check and ask resources file not exists', (done) => {
            // setup
            fsExistsStub.returns(false);
            // call
            helper.preInitCheck(TEST_ROOT, TEST_PROFILE, (err, res) => {
                // verify
                expect(uiShowInitStub.callCount).equal(1);
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                done();
            });
        });
    });

    describe('# unit test for method getSkillIdUserInput', () => {
        beforeEach(() => {
            sinon.stub(ui, 'getSkillId');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| get skillId from user but error happens', (done) => {
            // setup
            ui.getSkillId.callsArgWith(0, TEST_ERROR);
            // call
            helper.getSkillIdUserInput((err, response) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(response).equal(null);
                done();
            });
        });

        it('| get skillId from user inputs success', (done) => {
            // setup
            ui.getSkillId.callsArgWith(0, null, TEST_SKILL_ID);
            // call
            helper.getSkillIdUserInput((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).equal(TEST_SKILL_ID);
                done();
            });
        });
    });

    describe('# unit test for method getSkillMetadataUserInput', () => {
        beforeEach(() => {
            sinon.stub(ui, 'getSkillMetaSrc');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| getSkillMetaSrc from user but error happens', (done) => {
            // setup
            ui.getSkillMetaSrc.callsArgWith(0, TEST_ERROR);
            // call
            helper.getSkillMetadataUserInput((err, response) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(response).equal(null);
                done();
            });
        });

        it('| getSkillMetaSrc from user inputs success', (done) => {
            // setup
            ui.getSkillMetaSrc.callsArgWith(0, null, TEST_SRC);
            // call
            helper.getSkillMetadataUserInput((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).deep.equal({ src: TEST_SRC });
                done();
            });
        });
    });

    describe('# unit test for method getSkillCodeUserInput', () => {
        beforeEach(() => {
            sinon.stub(ui, 'getCodeSrcForRegion');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| getSkillCodeUserInput from user but error happens', (done) => {
            // setup
            ui.getCodeSrcForRegion.callsArgWith(1, TEST_ERROR);
            // call
            helper.getSkillCodeUserInput((err, response) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| getSkillCodeUserInput from user as empty string', (done) => {
            // setup
            ui.getCodeSrcForRegion.callsArgWith(1, null, '');
            // call
            helper.getSkillCodeUserInput((err, response) => {
                // verify
                expect(err).equal(undefined);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| getSkillCodeUserInput from user inputs success', (done) => {
            // setup
            ui.getCodeSrcForRegion.callsArgWith(1, null, TEST_SRC);
            // call
            helper.getSkillCodeUserInput((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).deep.equal({ default: { src: TEST_SRC } });
                done();
            });
        });
    });

    describe('# unit test for method getSkillInfraUserInput', () => {
        function TEST_INFRA(isUsingCfn, runtime, handler) {
            return { isUsingCfn, runtime, handler };
        }

        beforeEach(() => {
            sinon.stub(ui, 'getSkillInfra');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| getSkillInfraUserInput from user but error happens', (done) => {
            // setup
            ui.getSkillInfra.callsArgWith(0, TEST_ERROR);
            // call
            helper.getSkillInfraUserInput((err, response) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| getSkillInfraUserInput from user input success', (done) => {
            // setup
            ui.getSkillInfra.callsArgWith(0, null, TEST_INFRA(true, 'runtime', 'handler'));
            // call
            helper.getSkillInfraUserInput((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).deep.equal({
                    type: '@ask-cli/cfn-deployer',
                    userConfig: {
                        runtime: 'runtime',
                        handler: 'handler'
                    }
                });
                done();
            });
        });

        it('| getSkillInfraUserInput from user input success, without using cfn', (done) => {
            // setup
            ui.getSkillInfra.callsArgWith(0, null, TEST_INFRA(false, 'runtime', 'handler'));
            // call
            helper.getSkillInfraUserInput((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).deep.equal({
                    type: '@ask-cli/lambda-deployer',
                    userConfig: {
                        runtime: 'runtime',
                        handler: 'handler'
                    }
                });
                done();
            });
        });
    });

    describe('# unit test for method previewAndWriteAskResources', () => {
        const TEST_USER_INPUT = {
            skillId: TEST_SKILL_ID,
            skillMeta: {
                src: TEST_SRC
            },
            skillCode: {
                default: {
                    src: TEST_SRC
                }
            },
            skillInfra: {
                type: '@ask-cli/cfn-deployer',
                userConfig: {
                    runtime: 'runtime',
                    handler: 'handler'
                }
            }
        };

        beforeEach(() => {
            sinon.stub(ui, 'showPreviewAndConfirm');
            sinon.stub(fs, 'removeSync');
            sinon.stub(path, 'join').returns(TEST_SRC);
            sinon.stub(AskResources, 'withContent');
            sinon.stub(AskStates, 'withContent');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| previewAndWriteAskResources fails when displaying the preview and confirming', (done) => {
            // setup
            ui.showPreviewAndConfirm.callsArgWith(2, TEST_ERROR);
            // call
            helper.previewAndWriteAskResources(TEST_ROOT, TEST_USER_INPUT, TEST_PROFILE, (err, response) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| previewAndWriteAskResources fails when user does not confirm', (done) => {
            // setup
            ui.showPreviewAndConfirm.callsArgWith(2, null, false);
            // call
            helper.previewAndWriteAskResources(TEST_ROOT, TEST_USER_INPUT, TEST_PROFILE, (err, response) => {
                // verify
                expect(err.message).equal('Project init aborted.');
                expect(err.name).equal('CliWarn');
                expect(response).equal(undefined);
                done();
            });
        });

        it('| previewAndWriteAskResources fails when remove file/folder fails', (done) => {
            // setup
            ui.showPreviewAndConfirm.callsArgWith(2, null, true);
            fs.removeSync.throws(TEST_ERROR);
            // call
            helper.previewAndWriteAskResources(TEST_ROOT, TEST_USER_INPUT, TEST_PROFILE, (err, response) => {
                // verify
                expect(err.name).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| previewAndWriteAskResources succeeds', (done) => {
            // setup
            ui.showPreviewAndConfirm.callsArgWith(2, null, true);
            // call
            helper.previewAndWriteAskResources(TEST_ROOT, TEST_USER_INPUT, TEST_PROFILE, (err, response) => {
                // verify
                expect(fs.removeSync.args[0][0]).equal(TEST_SRC);
                expect(fs.removeSync.args[1][0]).equal(TEST_SRC);
                expect(AskResources.withContent.args[0][0]).equal(TEST_SRC);
                expect(AskResources.withContent.args[0][1].profiles[TEST_PROFILE]).deep.equal({
                    skillMetadata: {
                        src: TEST_SRC
                    },
                    code: {
                        default: {
                            src: TEST_SRC
                        }
                    },
                    skillInfrastructure: {
                        type: '@ask-cli/cfn-deployer',
                        userConfig: {
                            runtime: 'runtime',
                            handler: 'handler'
                        }
                    }
                });
                expect(AskStates.withContent.args[0][0]).equal(TEST_SRC);
                expect(AskStates.withContent.args[0][1].profiles[TEST_PROFILE]).deep.equal({
                    skillId: TEST_SKILL_ID,
                    skillInfrastructure: {
                        '@ask-cli/cfn-deployer': {
                            deployState: {}
                        }
                    }
                });
                expect(err).equal(undefined);
                expect(response).equal(undefined);
                done();
            });
        });
    });

    describe('# unit test for method bootstrapSkillInfra', () => {
        const TEST_ROOT_PATH = 'root';
        let infoStub;

        beforeEach(() => {
            sinon.stub(path, 'join');
            path.join.withArgs(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG).returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            path.join.callThrough();
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(SkillInfrastructureController.prototype, 'bootstrapInfrastructures');

            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| post init bootstrap method but error happens', (done) => {
            // setup
            SkillInfrastructureController.prototype.bootstrapInfrastructures.callsArgWith(1, TEST_ERROR);
            // call
            helper.bootstrapSkillInfra(TEST_ROOT_PATH, TEST_PROFILE, false, (err, response) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| post init and bootstrap succeeds with ask-cli deployer', (done) => {
            // setup
            SkillInfrastructureController.prototype.bootstrapInfrastructures.callsArgWith(1, null);
            // call
            helper.bootstrapSkillInfra(TEST_ROOT_PATH, TEST_PROFILE, false, (err, response) => {
                // verify
                expect(infoStub.args[0][0]).equal('Project bootstrap from deployer "@ask-cli/cfn-deployer" succeeded.');
                expect(err).equal(undefined);
                expect(response).equal(undefined);
                done();
            });
        });
    });
});
