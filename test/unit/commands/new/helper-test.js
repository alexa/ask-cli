const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

const GitClient = require('@src/clients/git-client');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const helper = require('@src/commands/new/helper');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');

describe('Commands new test - helper test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj', 'ask-resources.json');
    const FIXTURE_MANIFEST_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'manifest.json');

    const TEST_PROFILE = 'default';
    const TEST_DO_DEBUG = false;
    const TEST_INFRA_PATH = 'infraPath';
    const TEST_DEPLOYMENT_TYPE = 'deployer';
    const TEST_TEMPLATE_URL = 'value';
    const TEST_SKILL_FOLDER_NAME = 'skillFolderName';
    const TEST_SKILL_NAME = 'skillName';
    const TEST_USER_INPUT = {
        skillName: 'testName',
        projectFolderName: 'projectName',
        templateInfo: {
            templateUrl: TEST_TEMPLATE_URL
        }
    };

    describe('# test helper method - initializeDeployDelegate', () => {
        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| ui select deploy delegate pass and selection is opt-out, expect quit process', (done) => {
            // setup
            // call
            helper.initializeDeployDelegate(null, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                done();
            });
        });

        it('| deployer is set in the template and same as what user wants, expect skip bootstrap', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillInfraType(TEST_PROFILE, TEST_DEPLOYMENT_TYPE);
            // call
            helper.initializeDeployDelegate(TEST_DEPLOYMENT_TYPE, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(res).equal(TEST_DEPLOYMENT_TYPE);
                expect(err).equal(null);
                done();
            });
        });

        it('| bootstrap fails, expect throw error', (done) => {
            // setup
            const TEST_SELECTED_TYPE = '@ask-cli/test!!!@ ';
            ResourcesConfig.getInstance().setSkillInfraType(TEST_PROFILE, '');
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(SkillInfrastructureController.prototype, 'bootstrapInfrastructures').callsArgWith(1, 'error');
            // call
            helper.initializeDeployDelegate(TEST_SELECTED_TYPE, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(fs.ensureDirSync.args[0][0]).equal(path.join(TEST_INFRA_PATH, 'infrastructure/test'));
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| bootstrap pass, expect return deployType', (done) => {
            // setup
            const TEST_SELECTED_TYPE = '  !!!test^^^  ';
            ResourcesConfig.getInstance().setSkillInfraType(TEST_PROFILE, '');
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(SkillInfrastructureController.prototype, 'bootstrapInfrastructures').callsArgWith(1);
            // call
            helper.initializeDeployDelegate(TEST_SELECTED_TYPE, TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(fs.ensureDirSync.args[0][0]).equal(path.join(TEST_INFRA_PATH, 'infrastructure/test'));
                expect(res).equal(TEST_SELECTED_TYPE);
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test helper method - downloadTemplateFromGit', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| git clone pass, expect return folder path', (done) => {
            // setup
            const TEST_FOLDER_PATH = 'TEST_FOLDER_PATH';
            sinon.stub(path, 'join').returns(TEST_FOLDER_PATH);
            sinon.stub(GitClient.prototype, 'clone');
            // call
            helper.downloadTemplateFromGit(TEST_USER_INPUT, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(GitClient.prototype.clone.args[0][0]).equal(TEST_TEMPLATE_URL);
                expect(res).equal(TEST_FOLDER_PATH);
                expect(err).equal(null);
                done();
            });
        });
        it('| git clone with custom branch, expect return folder path', (done) => {
            // setup
            const TEST_FOLDER_PATH = 'TEST_FOLDER_PATH';
            const TEST_TEMPLATE_BRANCH = 'test-branch';
            TEST_USER_INPUT.templateInfo.templateBranch = TEST_TEMPLATE_BRANCH;
            sinon.stub(path, 'join').returns(TEST_FOLDER_PATH);
            sinon.stub(GitClient.prototype, 'clone');
            // call
            helper.downloadTemplateFromGit(TEST_USER_INPUT, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(GitClient.prototype.clone.args[0][0]).equal(TEST_TEMPLATE_URL);
                expect(GitClient.prototype.clone.args[0][1]).equal(TEST_TEMPLATE_BRANCH);
                expect(res).equal(TEST_FOLDER_PATH);
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test helper method - loadSkillProjectModel', () => {
        const TEST_SKILLMETA_SRC = './skillPackage';

        beforeEach(() => {
            sinon.stub(path, 'join').withArgs(
                TEST_SKILL_FOLDER_NAME, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG
            ).returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            path.join.withArgs(TEST_SKILL_FOLDER_NAME, TEST_SKILLMETA_SRC).returns(TEST_SKILLMETA_SRC);
            path.join.withArgs(TEST_SKILLMETA_SRC, 'skill.json').returns(FIXTURE_MANIFEST_FILE_PATH);
            path.join.callThrough();
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| new resources config fails, expect throw error', () => {
            // setup
            sinon.stub(fs, 'existsSync').withArgs(FIXTURE_RESOURCES_CONFIG_FILE_PATH).returns(false);
            fs.existsSync.callThrough();
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal(`File ${FIXTURE_RESOURCES_CONFIG_FILE_PATH} not exists.`);
            }
        });

        it('| skill metadata src does not exist, expect throw error', () => {
            // setup
            sinon.stub(stringUtils, 'isNonBlankString').returns(false);
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal('[Error]: Invalid skill project structure. Please set the "src" field in skillMetada resource.');
            }
        });

        it('| skill meta src is absolue & skill package src does not exist, expect throw error', () => {
            // setup
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(true);
            sinon.stub(fs, 'existsSync').withArgs(TEST_SKILLMETA_SRC).returns(false);
            fs.existsSync.callThrough();
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal(`[Error]: Invalid skill package src. Attempt to get the skill package but doesn't exist: \
${ResourcesConfig.getInstance().getSkillMetaSrc(TEST_PROFILE)}.`);
            }
        });

        it('| skill meta src is not absolue & skill package src does not exist, expect throw error', () => {
            // setup
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(false);
            sinon.stub(fs, 'existsSync').withArgs(TEST_SKILLMETA_SRC).returns(false);
            fs.existsSync.callThrough();
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal(`[Error]: Invalid skill package src. Attempt to get the skill package but doesn't exist: \
${TEST_SKILLMETA_SRC}.`);
            }
        });

        it('| skill package manifest file does not exist, expect throw error', () => {
            // setup
            sinon.stub(fs, 'existsSync');
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(true);
            fs.existsSync.withArgs(TEST_SKILLMETA_SRC).returns(true);
            fs.existsSync.withArgs(FIXTURE_MANIFEST_FILE_PATH).returns(false);
            fs.existsSync.callThrough();
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify FIXTURE_MANIFEST_FILE_PATH
                expect(e.message).equal(`[Error]: Invalid skill project structure. Please make sure skill.json exists in ${TEST_SKILLMETA_SRC}.`);
            }
        });

        it('| new manifest file fails, expect throw error', () => {
            // setup
            sinon.stub(fs, 'existsSync');
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(true);
            path.join.withArgs(TEST_SKILLMETA_SRC, 'skill.json').returns('invalidPath');
            fs.existsSync.withArgs(TEST_SKILLMETA_SRC).returns(true);
            fs.existsSync.withArgs('invalidPath').returns(true);
            fs.existsSync.callThrough();
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal('No access to read/write file invalidPath.');
            }
        });

        it('| skill package structure passes the validation, expect no error', () => {
            // setup
            sinon.stub(fs, 'existsSync');
            path.join.withArgs(TEST_SKILL_FOLDER_NAME, 'ask-resources.json').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(true);
            fs.existsSync.withArgs(TEST_SKILLMETA_SRC).returns(true);
            fs.existsSync.withArgs(FIXTURE_MANIFEST_FILE_PATH).returns(true);
            fs.existsSync.callThrough();
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e).equal(undefined);
            }
        });
    });

    describe('# test helper method - updateSkillProjectWithUserSettings', () => {
        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            new Manifest(FIXTURE_MANIFEST_FILE_PATH);
        });

        afterEach(() => {
            Manifest.dispose();
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| expect refresh skill project to update skill name and remove .git folder', () => {
            // setup
            sinon.stub(fs, 'removeSync');
            // call
            helper.updateSkillProjectWithUserSettings(TEST_SKILL_NAME, TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            // verify
            expect(Manifest.getInstance().getSkillName()).equal(TEST_SKILL_NAME);
            expect(ResourcesConfig.getInstance().getProfile(TEST_PROFILE)).not.equal(null);
            expect(fs.removeSync.args[0][0]).equal(path.join(TEST_SKILL_FOLDER_NAME, '.git'));
        });
    });
});
