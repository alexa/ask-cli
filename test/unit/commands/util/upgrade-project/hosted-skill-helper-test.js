const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

const awsUtil = require('@src/clients/aws-client/aws-util');
const GitClient = require('@src/clients/git-client');
const hostedSkillHelper = require('@src/commands/util/upgrade-project/hosted-skill-helper');
const HostedSkillController = require('@src/controllers/hosted-skill-controller');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const CliError = require('@src/exceptions/cli-error');
const ResourcesConfig = require('@src/model/resources-config');
const AskResources = require('@src/model/resources-config/ask-resources');
const AskStates = require('@src/model/resources-config/ask-states');
const CONSTANTS = require('@src/utils/constants');

describe('Commands upgrade-project test - hosted skill helper test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'hosted-proj', 'ask-resources.json');
    const FIXTURE_STATES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj', '.ask', 'ask-states.json');
    const TEST_ERROR = 'testError';
    const TEST_PROFILE = 'default';
    const TEST_AWS_REGION = 'us-west-2';
    const TEST_DO_DEBUG = false;
    const TEST_SKILL_ID = 'skillId';
    const TEST_SKILL_STAGE = 'development';
    const TEST_ROOT_PATH = 'rootPath';
    const TEST_PROJECT_PATH = 'TEST_PROJECT_PATH';
    const TEST_VERBOSITY_OPTIONS = {
        showOutput: false,
        showCommand: false,
        showStdErr: false,
        workingDir: TEST_PROJECT_PATH
    };

    describe('# test helper method - checkIfDevBranchClean', () => {
        let gitClient;
        let commitDiffStub;
        beforeEach(() => {
            gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            commitDiffStub = sinon.stub(gitClient, 'countCommitDifference');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| dev branch short status is not clean, expect error thrown', () => {
            // setup
            const TEST_OUTPUT = 'M models/en-US.json';
            sinon.stub(gitClient, 'checkoutBranch');
            sinon.stub(gitClient, 'shortStatus').returns(TEST_OUTPUT);
            // call & verify
            expect(() => hostedSkillHelper.checkIfDevBranchClean(gitClient))
                .throw(CliError, `Commit the following files in the dev branch before upgrading project:\n${TEST_OUTPUT}`);
        });

        it('| origin branch commits difference is not zero , expect error thrown', () => {
            // setup
            sinon.stub(gitClient, 'checkoutBranch');
            sinon.stub(gitClient, 'shortStatus').returns('');
            commitDiffStub.onCall(0).returns('1');
            commitDiffStub.onCall(1).returns('1');
            // call & verify
            expect(() => hostedSkillHelper.checkIfDevBranchClean(gitClient))
                .throw('Upgrade project failed. Your branch is ahead of origin/dev by 1 commit(s), '
                + 'Please follow the project upgrade instruction from '
                + 'https://github.com/alexa/ask-cli/blob/develop/docs/Upgrade-Project-From-V1.md#upgrade-steps '
                + 'to clean your working branch before upgrading project.');
        });

        it('| master branch commits difference is not zero , expect error thrown', () => {
            // setup
            sinon.stub(gitClient, 'checkoutBranch');
            sinon.stub(gitClient, 'shortStatus').returns('');
            commitDiffStub.onCall(0).returns('0');
            commitDiffStub.onCall(1).returns('1');
            // call & verify
            expect(() => hostedSkillHelper.checkIfDevBranchClean(gitClient))
                .throw('Upgrade project failed. Your branch is ahead of master by 1 commit(s), '
                + 'Please follow the project upgrade instruction from '
                + 'https://github.com/alexa/ask-cli/blob/develop/docs/Upgrade-Project-From-V1.md#upgrade-steps '
                + 'to clean your working branch before upgrading project.');
        });

        it('| origin and master branch commits difference is zero , expect noe error thrown', () => {
            // setup
            sinon.stub(gitClient, 'checkoutBranch');
            sinon.stub(gitClient, 'shortStatus').returns('');
            commitDiffStub.onCall(0).returns('0');
            commitDiffStub.onCall(1).returns('0');
            // call
            hostedSkillHelper.checkIfDevBranchClean(gitClient);
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
            hostedSkillHelper.createV2ProjectSkeletonAndLoadModel(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_PROFILE);
            expect(ensureDirStub.args[0][0]).eq(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE));
            expect(ensureDirStub.args[1][0]).eq(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA));
            expect(AskResources.withContent.args[0][0]).eq(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            expect(AskResources.withContent.args[0][1].profiles).deep.equal({
                [TEST_PROFILE]: {}
            });
            expect(AskStates.withContent.args[0][0]).eq(FIXTURE_STATES_CONFIG_FILE_PATH);
            expect(AskStates.withContent.args[0][1].profiles).deep.equal({
                [TEST_PROFILE]: {
                    skillId: TEST_SKILL_ID
                }
            });
        });
    });

    describe('# test helper method - downloadSkillPackage', () => {
        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            sinon.restore();
            ResourcesConfig.dispose();
        });

        it('| skillMetaController getSkillPackage fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'getSkillPackage').callsArgWith(3, TEST_ERROR);
            // call
            hostedSkillHelper.downloadSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| skillMetaController getSkillPackage passes, hashUtils fails, expect no error return', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'getSkillPackage').callsArgWith(3, null);
            // call
            hostedSkillHelper.downloadSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                // verify
                expect(err).equal(undefined);
                done();
            });
        });
    });

    describe('# test helper method - handleExistingLambdaCode', () => {
        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            sinon.restore();
            ResourcesConfig.dispose();
        });

        it('| handle lambdaCode and update resources JSON file, expect update correctly', () => {
            // setup
            const TEST_REPO_URL = 'repo_url';
            sinon.stub(awsUtil, 'getAWSProfile');
            sinon.stub(awsUtil, 'getCLICompatibleDefaultRegion').returns(TEST_AWS_REGION);
            const copyStub = sinon.stub(fs, 'copySync');
            // call
            hostedSkillHelper.handleExistingLambdaCode(TEST_ROOT_PATH, TEST_REPO_URL, TEST_PROFILE);
            // verify
            expect(ResourcesConfig.getInstance().getSkillInfraType(TEST_PROFILE)).equal(CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME);
            expect(copyStub.args[0][0]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.LEGACY_PATH, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA));
            expect(copyStub.args[0][1]).equal(path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA));
        });
    });

    describe('# test helper method - postUpgradeGitSetup', () => {
        let gitClient;
        beforeEach(() => {
            gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| set Git Credential Helper fails, expect error thrown', (done) => {
            // setup
            sinon.stub(gitClient, 'updateCredentialHelper').throws(new CliError(TEST_ERROR));
            // call
            hostedSkillHelper.postUpgradeGitSetup(TEST_PROFILE, TEST_DO_DEBUG, gitClient, (err) => {
                // verify
                expect(err.message).equal(TEST_ERROR);
                done();
            });
        });

        it('| set Master As Default fails, expect error thrown', (done) => {
            // setup
            sinon.stub(gitClient, 'updateCredentialHelper');
            sinon.stub(gitClient, 'checkoutBranch');
            sinon.stub(gitClient, 'merge');
            sinon.stub(gitClient, 'deleteBranch').throws(new CliError(TEST_ERROR));
            // call
            hostedSkillHelper.postUpgradeGitSetup(TEST_PROFILE, TEST_DO_DEBUG, gitClient, (err) => {
                // verify
                expect(err.message).equal(TEST_ERROR);
                done();
            });
        });

        it('| update git ignore file, expect error thrown', (done) => {
            // setup
            sinon.stub(gitClient, 'updateCredentialHelper');
            sinon.stub(gitClient, 'checkoutBranch');
            sinon.stub(gitClient, 'merge');
            sinon.stub(gitClient, 'deleteBranch');
            sinon.stub(gitClient, 'setupGitIgnore').throws(new CliError(TEST_ERROR));
            // call
            hostedSkillHelper.postUpgradeGitSetup(TEST_PROFILE, TEST_DO_DEBUG, gitClient, (err) => {
                // verify
                expect(gitClient.setupGitIgnore.args[0][0]).deep.equal(['ask-resources.json', '.ask/']);
                expect(err.message).equal(TEST_ERROR);
                done();
            });
        });

        it('| set Pre PushHook Template fails, expect error thrown', (done) => {
            // setup
            sinon.stub(gitClient, 'updateCredentialHelper');
            sinon.stub(gitClient, 'checkoutBranch');
            sinon.stub(gitClient, 'merge');
            sinon.stub(gitClient, 'deleteBranch');
            sinon.stub(gitClient, 'setupGitIgnore');
            sinon.stub(HostedSkillController.prototype, 'downloadGitHooksTemplate').callsArgWith(2, TEST_ERROR);
            // call
            hostedSkillHelper.postUpgradeGitSetup(TEST_PROFILE, TEST_DO_DEBUG, gitClient, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| post Upgrade Git Setup succeeds, expect no error thrown', (done) => {
            // setup
            sinon.stub(gitClient, 'updateCredentialHelper');
            sinon.stub(gitClient, 'checkoutBranch');
            sinon.stub(gitClient, 'merge');
            sinon.stub(gitClient, 'deleteBranch');
            sinon.stub(gitClient, 'setupGitIgnore');
            sinon.stub(HostedSkillController.prototype, 'downloadGitHooksTemplate').callsArgWith(2, null);
            // call
            hostedSkillHelper.postUpgradeGitSetup(TEST_PROFILE, TEST_DO_DEBUG, gitClient, (err) => {
                // verify
                expect(err).equal(null);
                done();
            });
        });
    });
});
