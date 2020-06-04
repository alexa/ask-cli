const { expect } = require('chai');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const path = require('path');
const sinon = require('sinon');

const GitClient = require('@src/clients/git-client');
const Messenger = require('@src/view/messenger');
const AuthorizationController = require('@src/controllers/authorization-controller');
const ResourcesConfig = require('@src/model/resources-config');

const cloneFlow = require('@src/controllers/hosted-skill-controller/clone-flow');
const CONSTANTS = require('@src/utils/constants');

describe('Controller test - CloneFlow test', () => {
    let TEST_DO_DEBUG = false;
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'hosted-proj', 'ask-resources.json');
    const TEST_PROFILE = 'default';
    const TEST_PROJECT_PATH = 'TEST_PROJECT_PATH';
    const TEST_SKILL_ID = 'amzn1.ask.skill.5555555-4444-3333-2222-1111111111';
    const TEST_SKILL_NAME = 'TEST_SKILL_NAME';
    const TEST_DEPLOYER_TYPE = '@ask-cli/hosted-skill-deployer';
    const TEST_REPO_URL = 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/5555555-4444-3333-2222-1111111111';
    const TEST_METADATA = {
        repository: {
            type: 'GIT',
            url: TEST_REPO_URL
        },
    };

    describe('# test CloneFlow method - generateProject', () => {
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

        it('| generate Project and ask-resources.json, expect correctly generated', () => {
            // setup
            sinon.stub(fs, 'mkdirSync');
            sinon.stub(jsonfile, 'writeFileSync');
            sinon.stub(path, 'join').withArgs(TEST_PROJECT_PATH, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG).returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            path.join.callThrough();
            // call
            cloneFlow.generateProject(TEST_PROJECT_PATH, TEST_SKILL_ID, TEST_SKILL_NAME, TEST_METADATA, TEST_PROFILE);
            // verify
            expect(ResourcesConfig.getInstance().getSkillId(TEST_PROFILE)).equal(TEST_SKILL_ID);
            expect(ResourcesConfig.getInstance().getSkillInfraType(TEST_PROFILE)).equal(TEST_DEPLOYER_TYPE);
            expect(Messenger.getInstance().info.args[0][0]).equal(`\nProject directory for ${TEST_SKILL_NAME} created at\n\t${TEST_PROJECT_PATH}`);
        });
    });

    describe('# test CloneFlow method - cloneProjectFromGit', () => {
        let infoStub;
        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
            });
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            sinon.restore();
            ResourcesConfig.dispose();
        });

        it('| clone project from Git without debug mode, expect correct workflow', () => {
            // setup
            sinon.stub(GitClient.prototype, 'init');
            sinon.stub(GitClient.prototype, 'configureCredentialHelper');
            sinon.stub(GitClient.prototype, 'addOrigin');
            sinon.stub(GitClient.prototype, 'fetchAll');
            sinon.stub(GitClient.prototype, 'checkoutBranch');
            sinon.stub(GitClient.prototype, 'setupGitIgnore');
            sinon.stub(GitClient.prototype, 'add');
            // call
            cloneFlow.cloneProjectFromGit(TEST_PROJECT_PATH, TEST_SKILL_NAME, TEST_PROFILE, TEST_DO_DEBUG);
            // verify
            expect(Messenger.getInstance().info.args[0][0]).equal(`\nLambda code for ${TEST_SKILL_NAME} created at\n\t./lambda`);
        });

        it('| clone project from Git with debug mode, expect correct workflow', () => {
            // setup
            TEST_DO_DEBUG = true;
            sinon.stub(GitClient.prototype, 'init');
            sinon.stub(GitClient.prototype, 'configureCredentialHelper');
            sinon.stub(GitClient.prototype, 'addOrigin');
            sinon.stub(GitClient.prototype, 'fetchAll');
            sinon.stub(GitClient.prototype, 'checkoutBranch');
            sinon.stub(GitClient.prototype, 'setupGitIgnore');
            sinon.stub(GitClient.prototype, 'add');
            // call
            cloneFlow.cloneProjectFromGit(TEST_PROJECT_PATH, TEST_SKILL_NAME, TEST_PROFILE, TEST_REPO_URL, TEST_DO_DEBUG);
            // verify
            expect(Messenger.getInstance().info.args[0][0]).equal('- Setting up git repo...');
            expect(Messenger.getInstance().info.args[1][0]).equal('- Fetching git repo...');
            expect(Messenger.getInstance().info.args[2][0]).equal('- Checking out master branch...');
            expect(Messenger.getInstance().info.args[3][0]).equal('- Setting up .gitignore...');
            expect(Messenger.getInstance().info.args[4][0]).equal('- Git repo successfully setup');
            expect(Messenger.getInstance().info.args[5][0]).equal(`\nLambda code for ${TEST_SKILL_NAME} created at\n\t./lambda`);
        });
    });

    describe('# test CloneFlow method - doSkillPackageExist', () => {
        let infoStub;

        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
            });
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            sinon.restore();
            ResourcesConfig.dispose();
        });

        it('| Skill-Package exists, expect return directly', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
            // call
            cloneFlow.doSkillPackageExist(TEST_SKILL_NAME, TEST_PROJECT_PATH, TEST_SKILL_ID, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(true);
                done();
            });
        });

        it('| Skill-Package NOT exists but models and skill-json exist, expect skill-package generated', (done) => {
            // setup
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(fs, 'mkdirSync');
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'models')).returns(true);
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'skill.json')).returns(true);
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'isps')).returns(true);
            sinon.stub(fs, 'moveSync');
            // call
            cloneFlow.doSkillPackageExist(TEST_SKILL_NAME, TEST_PROJECT_PATH, TEST_SKILL_ID, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(true);
                done();
            });
        });

        it('| models NOT exists but Skill-Package and skill-json exist, expect skill-package generated', (done) => {
            // setup
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(fs, 'mkdirSync');
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'models')).returns(false);
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'skill.json')).returns(true);
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'isps')).returns(true);
            sinon.stub(fs, 'moveSync');
            // call
            cloneFlow.doSkillPackageExist(TEST_SKILL_NAME, TEST_PROJECT_PATH, TEST_SKILL_ID, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(true);
                done();
            });
        });

        it('| Skill-Package NOT exists but models and skill-json exist, expect skill-package generated', (done) => {
            // setup
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(fs, 'mkdirSync');
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'models')).returns(true);
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'skill.json')).returns(false);
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'isps')).returns(false);
            sinon.stub(fs, 'moveSync');
            // call
            cloneFlow.doSkillPackageExist(TEST_SKILL_NAME, TEST_PROJECT_PATH, TEST_SKILL_ID, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(true);
                done();
            });
        });

        it('| models and skill-json NOT exist, expect return false', (done) => {
            // setup
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(TEST_PROJECT_PATH).returns(false);
            sinon.stub(fs, 'mkdirSync');
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'models')).returns(false);
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'skill.json')).returns(false);
            fs.existsSync.withArgs(path.join(TEST_PROJECT_PATH, 'isps')).returns(false);
            // call
            cloneFlow.doSkillPackageExist(TEST_SKILL_NAME, TEST_PROJECT_PATH, TEST_SKILL_ID, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).equal(false);
                done();
            });
        });
    });
});
