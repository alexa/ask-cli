const { expect } = require('chai');
const R = require('ramda');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');

const awsUtil = require('@src/clients/aws-client/aws-util');
const helper = require('@src/commands/util/upgrade-project/helper');
const ui = require('@src/commands/util/upgrade-project/ui');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const CLiError = require('@src/exceptions/cli-error');
const ResourcesConfig = require('@src/model/resources-config');
const AskResources = require('@src/model/resources-config/ask-resources');
const AskStates = require('@src/model/resources-config/ask-states');
const Messenger = require('@src/view/messenger');
const CONSTANTS = require('@src/utils/constants');
const hashUtils = require('@src/utils/hash-utils');

describe('Commands upgrade-project test - helper test', () => {
    const TEST_ERROR = 'testError';
    const TEST_PROFILE = 'default';
    const TEST_REGION = 'default';
    const TEST_REGION_NA = 'NA';
    const TEST_AWS_REGION = 'us-west-2';
    const TEST_DO_DEBUG = false;
    const TEST_SKILL_ID = 'skillId';
    const TEST_SKILL_STAGE = 'development';
    const TEST_CODE_URI = 'codeUri';
    const TEST_V2_CODE_URI = path.join(CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA, TEST_CODE_URI);
    const TEST_RUNTIME = 'runtime';
    const TEST_HANDLER = 'handler';
    const TEST_REVISION_ID = 'revisionId';
    const TEST_ROOT_PATH = 'rootPath';
    const TSET_SRC_DIR = 'sourceDir';
    const TEST_HIDDEN_NHS_CONFIG = {
        deploy_settings: {
            [TEST_PROFILE]: {
                skill_id: TEST_SKILL_ID,
                resources: {
                    lambda: []
                }
            }
        }
    };
    const TEST_ARN = 'arn:aws:lambda:us-west-2:123456789012:function:ask-custom-skill-sample-nodejs-fact-default';
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj', 'ask-resources.json');
    const FIXTURE_STATES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj', '.ask', 'ask-states.json');
    const TEST_LAMBDAS = [
        {
            alexaUsage: ['custom/default'],
            codeUri: TEST_CODE_URI,
            runtime: TEST_RUNTIME,
            handler: TEST_HANDLER,
            revisionId: TEST_REVISION_ID
        }
    ];
    const TEST_RESOURCE_MAP = {
        [TEST_REGION]: {
            arn: TEST_ARN,
            codeUri: TEST_CODE_URI,
            runtime: TEST_RUNTIME,
            handler: TEST_HANDLER,
            v2CodeUri: `.${path.sep}${TEST_V2_CODE_URI}`,
            revisionId: TEST_REVISION_ID
        },
        [TEST_REGION_NA]: {
            arn: undefined,
            codeUri: TEST_CODE_URI,
            runtime: undefined,
            handler: undefined,
            v2CodeUri: `.${path.sep}${TEST_V2_CODE_URI}`,
            revisionId: undefined
        }
    };
    const TEST_PROTOCOL = 'https';
    const TEST_HOST = 'git-codecommit.us-west-2.amazonaws.com';
    const TEST_PATH = 'v1/repos/11111111-2222-3333-4444-555555555555';
    const formV1Config = (skillId, isHosted, lambdaResources) => {
        const result = { deploy_settings: {}, alexaHosted: {} };
        result.deploy_settings[TEST_PROFILE] = {
            skill_id: skillId,
            resources: {
                lambda: lambdaResources
            }
        };
        result.alexaHosted = {
            isAlexaHostedSkill: isHosted,
            gitCredentialsCache: {
                protocol: TEST_PROTOCOL,
                host: TEST_HOST,
                path: TEST_PATH
            }
        };
        return result;
    };
    const formSkillJson = (topField, apiCustom) => {
        const result = { [topField]: {} };
        result[topField].apis = {
            custom: apiCustom
        };
        return result;
    };

    describe('# test helper method - loadV1ProjConfig', () => {
        beforeEach(() => {
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(fs, 'readJSONSync').returns(TEST_HIDDEN_NHS_CONFIG);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| file does not exist, expect throw error', () => {
            // setup
            fs.existsSync.returns(false);
            // call & verify
            expect(() => helper.loadV1ProjConfig(TEST_ROOT_PATH, TEST_PROFILE)).throw(CLiError,
                'Failed to find ask-cli v1 project. Please make sure this command is called at the root of the skill project.');
        });

        it('| profile does not match, expect throw error', () => {
            // setup
            const TEST_DIFFERENT_PROFILE = 'different';
            // call & verify
            expect(() => helper.loadV1ProjConfig(TEST_ROOT_PATH, TEST_DIFFERENT_PROFILE)).throw(CLiError,
                `Profile [${TEST_DIFFERENT_PROFILE}] is not configured in the v1 ask-cli's project. \
Please check ".ask/config" file and run again with the existing profile.`);
        });

        it('| expect idDeployed=false and v1Config get returned successfully', () => {
            // call
            fs.readJSONSync.returns(formV1Config(' ', false, []));
            const res = helper.loadV1ProjConfig(TEST_ROOT_PATH, TEST_PROFILE);
            // verify
            expect(res).deep.equal({
                isDeployed: false,
                v1Config: formV1Config(' ', false, [])
            });
        });

        it('| expect idDeployed=true and v1Config get returned successfully', () => {
            // call
            const res = helper.loadV1ProjConfig(TEST_ROOT_PATH, TEST_PROFILE);
            // verify
            expect(res).deep.equal({
                isDeployed: true,
                v1Config: TEST_HIDDEN_NHS_CONFIG
            });
        });
    });

    describe('# test helper method - extractUpgradeInformation', () => {
        beforeEach(() => {
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(fs, 'readJsonSync').returns({});
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| skill ID does not exist, expect throw error message', () => {
            // setup
            const TEST_CONFIG_OBJ = formV1Config('  ', false, {});
            // call & verify
            expect(() => helper.extractUpgradeInformation(TEST_CONFIG_OBJ, TEST_PROFILE)).throw(CLiError,
                `Failed to find skill_id for profile [${TEST_PROFILE}]. \
If the skill has never been deployed in v1 ask-cli, please start from v2 structure.`);
        });

        it('| skill project is alexa hosted skill, expect result correctly', () => {
            // setup
            const TEST_CONFIG_OBJ = formV1Config(TEST_SKILL_ID, true, null);
            // call
            const info = helper.extractUpgradeInformation(TEST_CONFIG_OBJ, TEST_PROFILE);
            // verify
            expect(info).deep.equal({
                skillId: TEST_SKILL_ID,
                isHosted: true,
                gitRepoUrl: `${TEST_PROTOCOL}://${TEST_HOST}/${TEST_PATH}`
            });
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
                    const TEST_CONFIG_OBJ = formV1Config(TEST_SKILL_ID, false, lambdas);
                    // call & verify
                    expect(() => helper.extractUpgradeInformation(TEST_CONFIG_OBJ, TEST_PROFILE)).throw(CLiError, expectError);
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
                const TEST_CONFIG_OBJ = formV1Config(TEST_SKILL_ID, false, TEST_LAMBDAS);
                // call
                const info = helper.extractUpgradeInformation(TEST_CONFIG_OBJ, TEST_PROFILE);
                // verify
                expect(warnStub.args[0][0]).equal('Skip Lambda resource with alexaUsage "custom/default" since this Lambda is not deployed.');
                expect(info).deep.equal({
                    skillId: TEST_SKILL_ID,
                    lambdaResources: {}
                });
            });

            it('| Lambda ARN exists, multiple codebase for a single region, expect result return', () => {
                // setup
                const TEST_LAMBDAS_MULTIPLE_CODEBASE = [
                    {
                        alexaUsage: ['custom/default', 'custom/NA'],
                        arn: TEST_ARN,
                        codeUri: TEST_CODE_URI,
                        runtime: TEST_RUNTIME,
                        handler: TEST_HANDLER,
                        revisionId: TEST_REVISION_ID
                    },
                    {
                        alexaUsage: ['custom/default'],
                        arn: TEST_ARN,
                        codeUri: TEST_CODE_URI,
                        runtime: TEST_RUNTIME,
                        handler: TEST_HANDLER,
                        revisionId: TEST_REVISION_ID
                    },
                    {
                        alexaUsage: ['custom/default'],
                        arn: TEST_ARN,
                        codeUri: 'codeUri1',
                        runtime: TEST_RUNTIME,
                        handler: TEST_HANDLER,
                        revisionId: TEST_REVISION_ID
                    }
                ];
                const TEST_CONFIG_OBJ = formV1Config(TEST_SKILL_ID, false, TEST_LAMBDAS_MULTIPLE_CODEBASE);
                // call
                const info = helper.extractUpgradeInformation(TEST_CONFIG_OBJ, TEST_PROFILE);
                // verify
                expect(warnStub.args[0][0]).equal(`Currently ask-cli requires one Lambda codebase per region. \
You have multiple Lambda codebases for region ${TEST_REGION}, we will use "${TEST_CODE_URI}" as the codebase for this region.`);
                expect(info).deep.equal({
                    skillId: TEST_SKILL_ID,
                    lambdaResources: TEST_RESOURCE_MAP
                });
            });
        });
    });

    describe('# test helper method - previewUpgrade', () => {
        const TEST_UPGRADE_INFO = {};
        afterEach(() => {
            sinon.restore();
        });

        it('| user not confirm upgrade, expect result return', (done) => {
            // setup
            sinon.stub(ui, 'displayPreview');
            sinon.stub(ui, 'confirmPreview').callsArgWith(0, TEST_ERROR);
            // call
            helper.previewUpgrade(TEST_UPGRADE_INFO, (err, res) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(res).equal(null);
                done();
            });
        });

        it('| user confirm upgrade, expect result return', (done) => {
            // setup
            sinon.stub(ui, 'displayPreview');
            sinon.stub(ui, 'confirmPreview').callsArgWith(0, null, true);
            // call
            helper.previewUpgrade(TEST_UPGRADE_INFO, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(true);
                done();
            });
        });
    });

    describe('# test helper method - moveOldProjectToLegacyFolder', () => {
        const TEST_FILE = 'file';
        const TEST_GIT_FILE = '.git';
        const TEST_OLD_FILES = [TEST_FILE, TEST_GIT_FILE];

        afterEach(() => {
            sinon.restore();
        });

        it('| move old project to legacy folder, expect files\' path correctly', () => {
            // setup
            sinon.stub(fs, 'readdirSync').returns(TEST_OLD_FILES);
            sinon.stub(fs, 'ensureDirSync');
            const moveStub = sinon.stub(fs, 'moveSync');
            // call
            helper.moveOldProjectToLegacyFolder(TEST_ROOT_PATH);
            // verify
            expect(moveStub.args[0][0]).eq(TEST_FILE);
            expect(moveStub.args[0][1]).eq(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.LEGACY_PATH, TEST_FILE));
        });
    });

    describe('# test helper method - createV2ProjectSkeletonAndLoadModel', () => {
        beforeEach(() => {
            sinon.stub(path, 'join');
            path.join.withArgs(
                TEST_ROOT_PATH, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG
            ).returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            path.join.withArgs(
                TEST_ROOT_PATH, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, CONSTANTS.FILE_PATH.ASK_STATES_JSON_CONFIG
            ).returns(FIXTURE_STATES_CONFIG_FILE_PATH);
            path.join.callThrough();
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| crate v2 project skeleton, expect write JSON file correctly', () => {
            // setup
            const ensureDirStub = sinon.stub(fs, 'ensureDirSync');
            sinon.stub(AskResources, 'withContent');
            sinon.stub(AskStates, 'withContent');
            // call
            helper.createV2ProjectSkeletonAndLoadModel(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_PROFILE);
            expect(ensureDirStub.args[0][0]).eq(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE));
            expect(ensureDirStub.args[1][0]).eq(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA));

            expect(AskResources.withContent.args[0][0]).eq(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            expect(AskResources.withContent.args[0][1].profiles).deep.equal({
                [TEST_PROFILE]: {
                    skillMetadata: {},
                    code: {}
                }
            });
            expect(AskStates.withContent.args[0][0]).eq(FIXTURE_STATES_CONFIG_FILE_PATH);
            expect(AskStates.withContent.args[0][1].profiles).deep.equal({
                [TEST_PROFILE]: {
                    skillId: TEST_SKILL_ID,
                    skillMetadata: {},
                    code: {}
                }
            });
        });
    });

    describe('# test helper method - downloadSkillPackage', () => {
        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(ResourcesConfig.prototype, 'write');
        });

        afterEach(() => {
            sinon.restore();
            ResourcesConfig.dispose();
        });

        it('| skillMetaController getSkillPackage fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'getSkillPackage').callsArgWith(3, TEST_ERROR);
            // call
            helper.downloadSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                expect(err.includes(TEST_ERROR)).equal(true);
                done();
            });
        });

        it('| skillMetaController getSkillPackage passes, hashUtils fails, expect error return', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'getSkillPackage').callsArgWith(3, null);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, TEST_ERROR);
            // call
            helper.downloadSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| hashUtils passes, expect no error return', (done) => {
            // setup
            const TEST_HASH = 'hash';
            sinon.stub(SkillMetadataController.prototype, 'getSkillPackage').callsArgWith(3, null);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            // call
            helper.downloadSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                // verify
                expect(err).eq(undefined);
                expect(ResourcesConfig.getInstance().getSkillMetaSrc(TEST_PROFILE)).equal('./skill-package');
                expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal(TEST_HASH);
                expect(ResourcesConfig.prototype.write.callCount).to.equal(1);
                done();
            });
        });
    });

    describe('# test helper method - handleExistingLambdaCode', () => {
        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(ResourcesConfig.prototype, 'write');
        });

        afterEach(() => {
            sinon.restore();
            ResourcesConfig.dispose();
        });

        it('| handle lambdaCode and update resources JSON file, expect update correctly', () => {
            // setup
            const TEST_CONFIG = {
                runtime: TEST_RUNTIME,
                handler: TEST_HANDLER,
                awsRegion: TEST_AWS_REGION,
                regionalOverrides: {
                    NA: {
                        runtime: undefined,
                        handler: undefined
                    }
                }
            };
            sinon.stub(awsUtil, 'getAWSProfile');
            sinon.stub(awsUtil, 'getCLICompatibleDefaultRegion').returns(TEST_AWS_REGION);
            const copyStub = sinon.stub(fs, 'copySync');
            // call
            helper.handleExistingLambdaCode(TEST_ROOT_PATH, TEST_RESOURCE_MAP, TEST_PROFILE);
            // verify
            expect(ResourcesConfig.getInstance().getSkillInfraType(TEST_PROFILE)).deep.equal(CONSTANTS.DEPLOYER_TYPE.LAMBDA.NAME);
            expect(ResourcesConfig.getInstance().getSkillInfraUserConfig(TEST_PROFILE)).deep.equal(TEST_CONFIG);
            expect(copyStub.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.LEGACY_PATH, TEST_CODE_URI));
            expect(copyStub.args[0][1]).equal(path.join(TEST_ROOT_PATH, TEST_V2_CODE_URI));
            expect(ResourcesConfig.getInstance().getSkillInfraDeployState(TEST_PROFILE)[TEST_PROFILE].lambda.arn).deep.equal(TEST_ARN);
            expect(ResourcesConfig.prototype.write.callCount).to.equal(1);
        });

        it('| handle lambdaCode and update resources JSON file with overwrite, expect, expect update correctly', () => {
            // setup
            const TEST_RESOURCE_MAP_MULTIPLE_REGION = {
                [TEST_REGION]: {
                    arn: TEST_ARN,
                    codeUri: TEST_CODE_URI,
                    runtime: TEST_RUNTIME,
                    handler: TEST_HANDLER,
                    v2CodeUri: TEST_V2_CODE_URI,
                    revisionId: TEST_REVISION_ID
                },
                [TEST_REGION_NA]: {
                    arn: TEST_ARN,
                    codeUri: TEST_CODE_URI,
                    runtime: TEST_RUNTIME,
                    handler: TEST_HANDLER,
                    v2CodeUri: TEST_V2_CODE_URI,
                    revisionId: TEST_REVISION_ID
                },
                FE: {
                    arn: TEST_ARN,
                    codeUri: TEST_CODE_URI,
                    runtime: 'JAVA',
                    handler: 'index.js',
                    v2CodeUri: TEST_V2_CODE_URI,
                    revisionId: TEST_REVISION_ID
                },
                IN: {
                    arn: TEST_ARN,
                    codeUri: TEST_CODE_URI,
                    runtime: 'JAVA',
                    handler: 'index.js',
                    v2CodeUri: TEST_V2_CODE_URI,
                    revisionId: TEST_REVISION_ID
                }
            };
            // setup
            const TEST_CONFIG = {
                runtime: TEST_RUNTIME,
                handler: TEST_HANDLER,
                awsRegion: TEST_AWS_REGION,
                regionalOverrides: {
                    FE: {
                        handler: 'index.js',
                        runtime: 'JAVA'
                    },
                    IN: {
                        handler: 'index.js',
                        runtime: 'JAVA'
                    }
                }
            };
            sinon.stub(awsUtil, 'getAWSProfile');
            sinon.stub(awsUtil, 'getCLICompatibleDefaultRegion').returns(TEST_AWS_REGION);
            const copyStub = sinon.stub(fs, 'copySync');
            // call
            helper.handleExistingLambdaCode(TEST_ROOT_PATH, TEST_RESOURCE_MAP_MULTIPLE_REGION, TEST_PROFILE);
            // verify
            expect(ResourcesConfig.getInstance().getSkillInfraType(TEST_PROFILE)).deep.equal(CONSTANTS.DEPLOYER_TYPE.LAMBDA.NAME);
            expect(copyStub.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.LEGACY_PATH, TEST_CODE_URI));
            expect(copyStub.args[0][1]).equal(path.join(TEST_ROOT_PATH, TEST_V2_CODE_URI));
            expect(ResourcesConfig.getInstance().getSkillInfraDeployState(TEST_PROFILE)[TEST_PROFILE].lambda.arn).deep.equal(TEST_ARN);
            expect(ResourcesConfig.getInstance().getSkillInfraUserConfig(TEST_PROFILE)).deep.equal(TEST_CONFIG);
            expect(ResourcesConfig.prototype.write.callCount).to.equal(1);
        });
    });

    describe('# test helper method - attemptUpgradeUndeployedProject', () => {
        beforeEach(() => {
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST)).returns(true);
            fs.existsSync.withArgs(path.join(TEST_ROOT_PATH, 'models')).returns(true);
            fs.existsSync.withArgs(path.join(TEST_ROOT_PATH, 'isps')).returns(true);
            fs.existsSync.callThrough();
            sinon.stub(fs, 'readJSONSync').returns(formSkillJson('manifest', { endpoint: TEST_ARN }));
            sinon.stub(fs, 'removeSync');
            sinon.stub(fs, 'writeJSONSync');
            sinon.stub(fs, 'mkdirpSync');
            sinon.stub(fs, 'moveSync');
            sinon.stub(awsUtil, 'getAWSProfile').returns('doesnt matter');
            sinon.stub(awsUtil, 'getCLICompatibleDefaultRegion').returns(TEST_AWS_REGION);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| skill.json file does not exist, expect throw error message', () => {
            // setup
            fs.existsSync.withArgs(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST)).returns(false);
            // call
            try {
                helper.attemptUpgradeUndeployedProject(TEST_ROOT_PATH, TEST_HIDDEN_NHS_CONFIG, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal('Unable to upgrade the project. skill.json file must exist.');
            }
        });

        it('| skill.json file does not exist, expect throw error message', () => {
            // setup
            fs.readJSONSync.returns(formSkillJson('skillManifest', {}));
            // call
            try {
                helper.attemptUpgradeUndeployedProject(TEST_ROOT_PATH, TEST_HIDDEN_NHS_CONFIG, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal('Invalid v1 project without "apis.custom.endpoint" field set in skill.json.');
            }
        });

        it('| v1Config does not have lambdaResources, models and isps folder do not exist, expect upgrade succeeds', () => {
            // setup
            fs.existsSync.withArgs(path.join(TEST_ROOT_PATH, 'models')).returns(false);
            fs.existsSync.withArgs(path.join(TEST_ROOT_PATH, 'isps')).returns(false);
            const NO_LAMBDA_V1CONFIG = formV1Config(TEST_SKILL_ID, false, null);
            // call
            helper.attemptUpgradeUndeployedProject(TEST_ROOT_PATH, NO_LAMBDA_V1CONFIG, TEST_PROFILE);
            // verify
            expect(fs.removeSync.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER));
            expect(fs.removeSync.args[1][0]).equal(path.join(TEST_ROOT_PATH, 'hooks'));
            expect(fs.removeSync.args[2][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST));
            expect(fs.writeJSONSync.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
            expect(fs.writeJSONSync.args[1][0]).equal(
                path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST)
            );
            expect(fs.moveSync.callCount).equal(0);
        });

        it('| v1Config has lambdaResources without custom/default, models and isps folder do not exist, expect upgrade succeeds', () => {
            // setup
            fs.existsSync.withArgs(path.join(TEST_ROOT_PATH, 'models')).returns(false);
            fs.existsSync.withArgs(path.join(TEST_ROOT_PATH, 'isps')).returns(false);
            const NO_LAMBDA_V1CONFIG = formV1Config(TEST_SKILL_ID, false, [{ alexaUsage: 'custom/NA' }]);
            // call
            helper.attemptUpgradeUndeployedProject(TEST_ROOT_PATH, NO_LAMBDA_V1CONFIG, TEST_PROFILE);
            // verify
            expect(fs.removeSync.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER));
            expect(fs.removeSync.args[1][0]).equal(path.join(TEST_ROOT_PATH, 'hooks'));
            expect(fs.removeSync.args[2][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST));
            expect(fs.writeJSONSync.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
            expect(fs.writeJSONSync.args[1][0]).equal(
                path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST)
            );
            expect(fs.moveSync.callCount).equal(0);
        });

        it('| v1Config has lambdaResources, models and isps folder exist, expect upgrade succeeds', () => {
            // setup
            fs.readJSONSync.returns(formSkillJson('skillManifest', {
                endpoint: {
                    sourceDir: TSET_SRC_DIR,
                    uri: TEST_ARN
                }
            }));
            const WITH_LAMBDA_V1CONFIG = formV1Config(TEST_SKILL_ID, false, TEST_LAMBDAS);
            // call
            helper.attemptUpgradeUndeployedProject(TEST_ROOT_PATH, WITH_LAMBDA_V1CONFIG, TEST_PROFILE);
            // verify
            expect(fs.removeSync.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER));
            expect(fs.removeSync.args[1][0]).equal(path.join(TEST_ROOT_PATH, 'hooks'));
            expect(fs.removeSync.args[2][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST));
            expect(fs.writeJSONSync.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
            expect(fs.writeJSONSync.args[0][1].profiles[TEST_PROFILE]).deep.equal({
                skillMetadata: {
                    src: `./${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE}`
                },
                code: {
                    default: {
                        src: TSET_SRC_DIR
                    }
                },
                skillInfrastructure: {
                    type: CONSTANTS.DEPLOYER_TYPE.LAMBDA.NAME,
                    userConfig: {
                        awsRegion: TEST_AWS_REGION,
                        runtime: TEST_RUNTIME,
                        handler: TEST_HANDLER
                    }
                }
            });
            expect(fs.writeJSONSync.args[1][0]).equal(
                path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST)
            );
            expect(fs.writeJSONSync.args[1][1]).deep.equal({
                manifest: {
                    apis: {
                        custom: {}
                    }
                }
            });
            expect(fs.moveSync.args[0][1]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE, 'interactionModels', 'custom'));
            expect(fs.moveSync.args[1][1]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE, 'isps'));
        });
    });
});
