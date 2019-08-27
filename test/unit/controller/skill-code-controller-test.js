const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const ResourcesConfig = require('@src/model/resources-config');
const SkillCodeController = require('@src/controllers/skill-code-controller');
const CodeBuilder = require('@src/controllers/skill-code-controller/code-builder');

describe('Controller test - skill code controller test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'resources-config.json');
    const TEST_PROFILE = 'default'; // test file uses 'default' profile
    const TEST_DO_DEBUG = false;
    const TEST_CODE_SRC = 'src';
    const TEST_CODE_BUILD = 'build';
    const TEST_CONFIGURATION = {
        profile: TEST_PROFILE,
        doDebug: TEST_DO_DEBUG
    };

    describe('# inspect correctness for constructor', () => {
        it('| initiate as a SkillCodeController class', () => {
            const skillCodeController = new SkillCodeController(TEST_CONFIGURATION);
            expect(skillCodeController).to.be.instanceOf(SkillCodeController);
            expect(skillCodeController.profile).equal(TEST_PROFILE);
            expect(skillCodeController.doDebug).equal(false);
        });
    });

    describe('# test class method: buildCode', () => {
        const TEST_CODE_LIST = [
            {
                src: TEST_CODE_SRC,
                build: TEST_CODE_BUILD,
                doDebug: TEST_DO_DEBUG
            }
        ];
        let skillCodeController;

        beforeEach(() => {
            skillCodeController = new SkillCodeController(TEST_CONFIGURATION);
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| skillCodeController resolve unique code settings fails, expect error throws', (done) => {
            // setup
            sinon.stub(SkillCodeController.prototype, '_resolveUniqueCodeList').throws(new Error('error'));
            // call
            skillCodeController.buildCode((err) => {
                // verify
                expect(err.message).equal('error');
                done();
            });
        });

        it('| skillCodeController resolve unique code settings passes but code builder execute fails, expect error throws', (done) => {
            // setup
            sinon.stub(SkillCodeController.prototype, '_resolveUniqueCodeList').returns(TEST_CODE_LIST);
            sinon.stub(CodeBuilder.prototype, '_decidePackageBuilder');
            sinon.stub(CodeBuilder.prototype, 'execute').callsArgWith(0, 'error');
            // call
            skillCodeController.buildCode((err) => {
                // verify
                expect(err).equal('error');
                done();
            });
        });

        it('| skillCodeController resolve unique code settings and code builder execute pass, expect no error called back', (done) => {
            // setup
            sinon.stub(SkillCodeController.prototype, '_resolveUniqueCodeList').returns(TEST_CODE_LIST);
            sinon.stub(CodeBuilder.prototype, '_decidePackageBuilder');
            sinon.stub(CodeBuilder.prototype, 'execute').callsArgWith(0);
            // call
            skillCodeController.buildCode((err) => {
                // verify
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test class method: _resolveUniqueCodeList', () => {
        let skillCodeController;

        beforeEach(() => {
            skillCodeController = new SkillCodeController(TEST_CONFIGURATION);
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| codeResources does not exist, expect error throws', () => {
            // setup
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, null);
            // call
            try {
                skillCodeController._resolveUniqueCodeList();
            } catch (e) {
                // verify
                expect(e).equal('Invalid skill code settings. Please make sure to provide the "code" field correctly in ask-resources file.');
            }
        });

        it('| codeResources src is blank string, expect error throws', () => {
            // setup
            const TEST_CODE_MAP = {
                region1: {}
            };
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, TEST_CODE_MAP);
            // call
            try {
                skillCodeController._resolveUniqueCodeList();
            } catch (e) {
                // verify
                expect(e).equal('Invalid code setting in region region1. "src" must be set if you want to deploy skill code with skill package.');
            }
        });

        it('| codeResources src does not exist, expect error throws', () => {
            // setup
            const TEST_CODE_MAP = {
                region1: {
                    src: TEST_CODE_SRC
                }
            };
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, TEST_CODE_MAP);
            sinon.stub(fs, 'existsSync').withArgs(TEST_CODE_SRC).returns(false);
            // call
            try {
                skillCodeController._resolveUniqueCodeList();
            } catch (e) {
                // verify
                expect(e).equal(`Invalid code setting in region region1. File doesn't exist for code src: ${TEST_CODE_SRC}.`);
            }
        });

        it('| codeResources has same src code in different regions, expect the list is unique result', () => {
            // setup
            const TEST_CODE_MAPS = {
                region1: {
                    src: TEST_CODE_SRC
                },
                region2: {
                    src: TEST_CODE_SRC
                },
                region3: {
                    src: TEST_CODE_BUILD
                }
            };
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, TEST_CODE_MAPS);
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(fs, 'statSync').returns({
                isDirectory: () => true
            });
            // call
            let codeLists;
            try {
                codeLists = skillCodeController._resolveUniqueCodeList(TEST_CODE_MAPS);
            } catch (e) {
                // verify
                expect(e).equal(undefined);
            }
            expect(codeLists).deep.equal([
                {
                    src: TEST_CODE_SRC,
                    build: {
                        folder: `${path.resolve(TEST_CODE_SRC)}${path.sep}build`,
                        file: `${path.resolve(TEST_CODE_SRC)}${path.sep}build${path.sep}upload.zip`
                    },
                    regionsList: ['region1', 'region2']
                },
                {
                    src: TEST_CODE_BUILD,
                    build: {
                        folder: `${path.resolve(TEST_CODE_BUILD)}${path.sep}build`,
                        file: `${path.resolve(TEST_CODE_BUILD)}${path.sep}build${path.sep}upload.zip`
                    },
                    regionsList: ['region3']
                }
            ]);
        });
    });
});
