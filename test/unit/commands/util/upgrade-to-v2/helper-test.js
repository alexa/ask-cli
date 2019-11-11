const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');

const helper = require('@src/commands/util/upgrade-to-v2/helper');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const Messenger = require('@src/view/messenger');

describe('Commands upgrade-to-v2 test - helper test', () => {
    const TEST_PROFILE = 'default';
    const TEST_DO_DEBUG = false;
    const TEST_SKILL_ID = 'skillId';
    const TEST_CODE_URI = 'codeUri';
    const TEST_RUNTIME = 'runtime';
    const TEST_HANDLER = 'handler';
    const TEST_ROOT_PATH = 'rootPath';

    describe('# test helper method - extractUpgradeInformation', () => {
        const TEST_V1_CONFIG_PATH = 'v1ConfigPath';
        const formV1Config = (skillId, isHosted, lambdaResources) => {
            const result = { deploy_settings: {} };
            result.deploy_settings[TEST_PROFILE] = {
                skill_id: skillId,
                alexaHosted: {
                    isAlexaHostedSkill: isHosted
                },
                resources: {
                    lambda: {
                        lambdaResources
                    }
                }
            };
            return result;
        };

        beforeEach(() => {
            sinon.stub(path, 'join').returns(TEST_V1_CONFIG_PATH);
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(fs, 'readJsonSync').returns({});
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| v1 project file does not exist, expect throw error', () => {
            // setup
            fs.existsSync.returns(false);
            // call
            try {
                helper.extractUpgradeInformation(TEST_ROOT_PATH, TEST_PROFILE);
            } catch (testError) {
                // verify
                expect(testError.message).equal('Failed to find ask-cli v1 project. '
                + 'Please make sure this command is called at the root of the skill project.');
            }
        });

        it('| skill ID does not exist, expect throw error message', () => {
            // setup
            fs.readJsonSync.returns(formV1Config('  ', false, {}));
            // call
            try {
                helper.extractUpgradeInformation(TEST_ROOT_PATH, TEST_PROFILE);
            } catch (testError) {
                // verify
                expect(testError.message).equal(`Failed to find skill_id for profile [${TEST_PROFILE}]. \
If the skill has never been deployed in v1 ask-cli, please start from v2 structure.`);
            }
        });

        it('| skill project is alexa hosted skill, expect quit with not support message', () => {
            // setup
            fs.readJsonSync.returns(formV1Config(TEST_SKILL_ID, true, {}));
            // call
            try {
                helper.extractUpgradeInformation(TEST_ROOT_PATH, TEST_PROFILE);
            } catch (testError) {
                // verify
                expect(testError.message).equal('Alexa Hosted Skill is currently not supported to upgrade.');
            }
        });

        describe('test helper method - extractUpgradeInformation : _validateLambdaResource', () => {
            [
                {
                    testCase: '| validate lambda resources fails at alexaUsage, expect throw error message',
                    lambdas: [
                        { alexaUsage: [] }
                    ],
                    expectError: 'Please make sure your alexaUsage is not empty.'
                },
                {
                    testCase: '| validate lambda resources fails at codeUri, expect throw error message',
                    lambdas: [
                        {
                            alexaUsage: ['custom/default'],
                            codeUri: '  '
                        }
                    ],
                    expectError: 'Please make sure your codeUri is set to the path of your Lambda code.'
                },
                {
                    testCase: '| validate lambda resources fails at runtime, expect throw error message',
                    lambdas: [
                        {
                            alexaUsage: ['custom/default'],
                            codeUri: TEST_CODE_URI,
                            runtime: '   '
                        }
                    ],
                    expectError: `Please make sure your runtime for codeUri ${TEST_CODE_URI} is set.`
                },
                {
                    testCase: '| validate lambda resources fails at handler, expect throw error message',
                    lambdas: [
                        {
                            alexaUsage: ['custom/default'],
                            codeUri: TEST_CODE_URI,
                            runtime: TEST_RUNTIME,
                            handler: ''
                        }
                    ],
                    expectError: `Please make sure your handler for codeUri ${TEST_CODE_URI} is set.`
                }
            ].forEach(({ testCase, lambdas, expectError }) => {
                it(testCase, () => {
                    // setup
                    fs.readJsonSync.returns(formV1Config(TEST_SKILL_ID, false, lambdas));
                    // call
                    try {
                        helper.extractUpgradeInformation(TEST_ROOT_PATH, TEST_PROFILE);
                    } catch (testError) {
                        // verify
                        expect(testError.message).equal(expectError);
                    }
                });
            });
        });

        describe('test helper method - extractUpgradeInformation : _collectLambdaMapFromResource', () => {
            let warnStub;

            beforeEach(() => {
                warnStub = sinon.stub();
                sinon.stub(Messenger, 'getInstance').returns({
                    warn: warnStub
                });
            });

            it('| when no Lambda ARN exists, skip the upgrade with a warning message', () => {
                // setup
                const TEST_LAMBDAS = [
                    {
                        alexaUsage: ['custom/default'],
                        codeUri: TEST_CODE_URI,
                        runtime: TEST_RUNTIME,
                        handler: TEST_HANDLER
                    }
                ];
                fs.readJsonSync.returns(formV1Config(TEST_SKILL_ID, false, TEST_LAMBDAS));
                // call
                try {
                    const info = helper.extractUpgradeInformation(TEST_ROOT_PATH, TEST_PROFILE);
                    // verify
                    expect(warnStub.args[0][0]).equal('Skip Lambda resource with alexaUsage "custom/default" since this Lambda is not deployed.');
                    expect(info).deep.equal({
                        skillId: TEST_SKILL_ID,
                        lambdaResources: {}
                    });
                } catch (testError) {
                    expect(testError).equal(undefined);
                }
            });

            it('| when no Lambda ARN exists, skip the upgrade with a warning message', () => {
                // setup
                const TEST_LAMBDAS = [
                    {
                        alexaUsage: ['custom/default'],
                        codeUri: TEST_CODE_URI,
                        runtime: TEST_RUNTIME,
                        handler: TEST_HANDLER
                    }
                ];
                fs.readJsonSync.returns(formV1Config(TEST_SKILL_ID, false, TEST_LAMBDAS));
                // call
                try {
                    const info = helper.extractUpgradeInformation(TEST_ROOT_PATH, TEST_PROFILE);
                    // verify
                    expect(warnStub.args[0][0]).equal('Skip Lambda resource with alexaUsage "custom/default" since this Lambda is not deployed.');
                    expect(info).deep.equal({
                        skillId: TEST_SKILL_ID,
                        lambdaResources: {}
                    });
                } catch (testError) {
                    expect(testError).equal(undefined);
                }
            });
        });
    });

    describe('# test helper method - previewUpgrade', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| skillCodeController buildSkillCode fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillCodeController.prototype, 'buildCode').callsArgWith(0, 'error');
            // call
            helper.buildSkillCode(TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(err).equal('error');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| skillCodeController buildSkillCode passes, expect no error callback', (done) => {
            // setup
            sinon.stub(SkillCodeController.prototype, 'buildCode').callsArgWith(0);
            // call
            helper.buildSkillCode(TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(undefined);
                done();
            });
        });
    });

    describe('# test helper method - moveOldProjectToLegacyFolder', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| skillInfraController deploySkillInfrastructure fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillInfrastructureController.prototype, 'deployInfrastructure').callsArgWith(0, 'error');
            // call
            helper.deploySkillInfrastructure(TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(err).equal('error');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| skillInfraController deploySkillInfrastructure passes, expect no error callback', (done) => {
            // setup
            sinon.stub(SkillInfrastructureController.prototype, 'deployInfrastructure').callsArgWith(0);
            // call
            helper.deploySkillInfrastructure(TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                done();
            });
        });
    });

    describe('# test helper method - createV2ProjectSkeleton', () => {
        let infoStub;
        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| skillMetaController enableSkill fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').callsArgWith(0, 'error');
            // call
            helper.enableSkill(TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                expect(err).equal('error');
                expect(infoStub.args[0][0]).equal('\n==================== Enable Skill ====================');
                done();
            });
        });

        it('| skillMetaController enableSkill passes, expect no error callback', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').callsArgWith(0);
            // call
            helper.enableSkill(TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                expect(infoStub.args[0][0]).equal('\n==================== Enable Skill ====================');
                done();
            });
        });
    });

    describe('# test helper method - downloadSkillPackage', () => {
        let infoStub;
        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| skillMetaController enableSkill fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').callsArgWith(0, 'error');
            // call
            helper.enableSkill(TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                expect(err).equal('error');
                expect(infoStub.args[0][0]).equal('\n==================== Enable Skill ====================');
                done();
            });
        });

        it('| skillMetaController enableSkill passes, expect no error callback', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').callsArgWith(0);
            // call
            helper.enableSkill(TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                expect(infoStub.args[0][0]).equal('\n==================== Enable Skill ====================');
                done();
            });
        });
    });

    describe('# test helper method - handleExistingLambdaCode', () => {
        let infoStub;
        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| skillMetaController enableSkill fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').callsArgWith(0, 'error');
            // call
            helper.enableSkill(TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                expect(err).equal('error');
                expect(infoStub.args[0][0]).equal('\n==================== Enable Skill ====================');
                done();
            });
        });

        it('| skillMetaController enableSkill passes, expect no error callback', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'enableSkill').callsArgWith(0);
            // call
            helper.enableSkill(TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                expect(infoStub.args[0][0]).equal('\n==================== Enable Skill ====================');
                done();
            });
        });
    });
});
