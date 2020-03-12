const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs-extra');

const helper = require('@src/commands/v2new/helper');
const ui = require('@src/commands/v2new/ui');
const gitClient = require('@src/clients/git-client');
const httpClient = require('@src/clients/http-client');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const urlUtils = require('@src/utils/url-utils');
const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');

describe('Commands new test - helper test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'resources-config.json');
    const FIXTURE_MANIFEST_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'manifest.json');

    const TEST_PROFILE = 'default';
    const TEST_DO_DEBUG = false;
    const TEST_INFRA_PATH = 'infraPath';
    const TEST_URL = 'url';
    const TEST_LANGUAGE = 'NodeJS'; // language value in the static language mappings
    const TEST_TEMPLATE_NAME = 'key';
    const TEST_TEMPLATE_URL = 'value';
    const TEST_SKILL_FOLDER_NAME = 'skillFolderName';
    const TEST_SKILL_NAME = 'skillName';
    const TEST_VALID_HTTP_RESPONSE = {
        statusCode: 200,
        body: `{"${TEST_TEMPLATE_NAME}":{"url":"${TEST_TEMPLATE_URL}"}}`
    };
    const TEST_VALID_HTTP_RESPONSE_JSON = {
        statusCode: 200,
        body: JSON.parse(`{"${TEST_TEMPLATE_NAME}":{"url":"${TEST_TEMPLATE_URL}"}}`)
    };
    const TEST_USER_INPUT = {
        skillName: 'testName',
        projectFolderPath: 'projectPath'
    };

    describe('# test helper method - loadSkillProjectModel', () => {
        beforeEach(() => {
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| new resources config fails, expect throw error', () => {
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal(`File ${TEST_SKILL_FOLDER_NAME}${path.sep}ask-resources.json not exists.`);
            }
        });

        it('| skill metadata src does not exist, expect throw error', () => {
            // setup
            sinon.stub(path, 'join').withArgs(TEST_SKILL_FOLDER_NAME, 'ask-resources.json').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
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
            sinon.stub(path, 'join').withArgs(TEST_SKILL_FOLDER_NAME, 'ask-resources.json').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(true);
            sinon.stub(fs, 'existsSync').returns(false);
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
            sinon.stub(path, 'join').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(false);
            sinon.stub(fs, 'existsSync').returns(false);
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal(`[Error]: Invalid skill package src. Attempt to get the skill package but doesn't exist: \
${FIXTURE_RESOURCES_CONFIG_FILE_PATH}.`);
            }
        });

        it('| skill package manifest file does not exist, expect throw error', () => {
            // setup
            sinon.stub(path, 'join');
            sinon.stub(fs, 'existsSync');
            path.join.withArgs(TEST_SKILL_FOLDER_NAME, 'ask-resources.json').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(true);
            fs.existsSync.withArgs('./skillPackage').returns(true);
            path.join.withArgs('./skillPackage', 'skill.json').returns(FIXTURE_MANIFEST_FILE_PATH);
            fs.existsSync.withArgs(FIXTURE_MANIFEST_FILE_PATH).returns(false);
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify FIXTURE_MANIFEST_FILE_PATH
                expect(e.message).equal('[Error]: Invalid skill project structure. Please make sure skill.json exists in ./skillPackage.');
            }
        });

        it('| new manifest file fails, expect throw error', () => {
            // setup
            sinon.stub(path, 'join');
            sinon.stub(fs, 'existsSync');
            path.join.withArgs(TEST_SKILL_FOLDER_NAME, 'ask-resources.json').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(true);
            fs.existsSync.withArgs('./skillPackage').returns(true);
            path.join.withArgs('./skillPackage', 'skill.json').returns('invalidPath');
            fs.existsSync.withArgs('invalidPath').returns(true);
            // call
            try {
                helper.loadSkillProjectModel(TEST_SKILL_FOLDER_NAME, TEST_PROFILE);
            } catch (e) {
                // verify
                expect(e.message).equal('File invalidPath not exists.');
            }
        });

        it('| skill package structure passes the validation, expect no error', () => {
            // setup
            sinon.stub(path, 'join');
            sinon.stub(fs, 'existsSync');
            path.join.withArgs(TEST_SKILL_FOLDER_NAME, 'ask-resources.json').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(stringUtils, 'isNonBlankString').returns(true);
            sinon.stub(path, 'isAbsolute').returns(true);
            fs.existsSync.withArgs('./skillPackage').returns(true);
            path.join.withArgs('./skillPackage', 'skill.json').returns(FIXTURE_MANIFEST_FILE_PATH);
            fs.existsSync.withArgs(FIXTURE_MANIFEST_FILE_PATH).returns(true);
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
            new Manifest(FIXTURE_MANIFEST_FILE_PATH);
        });

        afterEach(() => {
            Manifest.dispose();
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

    describe('# test helper method - bootstrapProject', () => {
        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| ui select deploy delegate fail, expect throw error', (done) => {
            // setup
            sinon.stub(ui, 'getDeployDelegateType').callsArgWith(1, 'error');
            // call
            helper.bootstrapProject(TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| ui select deploy delegate pass and selection is opt-out, expect quit process', (done) => {
            // setup
            sinon.stub(ui, 'getDeployDelegateType').callsArgWith(1, null, ui.SKIP_DEPLOY_DELEGATE_SELECTION);
            // call
            helper.bootstrapProject(TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                done();
            });
        });

        it('| ui select deploy delegate pass & deploy delegate is builtin type & bootstrap fails, expect throw error', (done) => {
            // setup
            const TEST_SELECTED_TYPE = '@ask-cli/test!!!@ ';
            sinon.stub(ui, 'getDeployDelegateType').callsArgWith(1, null, TEST_SELECTED_TYPE);
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(SkillInfrastructureController.prototype, 'bootstrapInfrastructures').callsArgWith(1, 'error');
            // call
            helper.bootstrapProject(TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(fs.ensureDirSync.args[0][0]).equal(path.join(TEST_INFRA_PATH, 'test'));
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| ui select deploy delegate pass & deploy delegate is non-builtin type & bootstrap pass, expect throw error', (done) => {
            // setup
            const TEST_SELECTED_TYPE = '  !!!test^^^  ';
            sinon.stub(ui, 'getDeployDelegateType').callsArgWith(1, null, TEST_SELECTED_TYPE);
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(SkillInfrastructureController.prototype, 'bootstrapInfrastructures').callsArgWith(1);
            // call
            helper.bootstrapProject(TEST_INFRA_PATH, TEST_PROFILE, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(fs.ensureDirSync.args[0][0]).equal(path.join(TEST_INFRA_PATH, 'test'));
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                done();
            });
        });
    });

    describe('# test helper method - newWithOfficialTemplate', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| ui get code language fail, expect throw error', (done) => {
            // setup
            sinon.stub(ui, 'selectSkillCodeLanguage').callsArgWith(0, 'error');
            // call
            helper.newWithOfficialTemplate(TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| ui get language pass but get template map fail, expect throw error', (done) => {
            // setup
            sinon.stub(ui, 'selectSkillCodeLanguage').callsArgWith(0, null, TEST_LANGUAGE);
            sinon.stub(httpClient, 'request').callsArgWith(3, 'error');
            // call
            helper.newWithOfficialTemplate(TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('[Error]: Failed to retrieve the template list. Please run again with --debug to check more details.');
                done();
            });
        });

        it('| ui get language and get template map pass but ui get template fail, expect throw error', (done) => {
            // setup
            sinon.stub(ui, 'selectSkillCodeLanguage').callsArgWith(0, null, TEST_LANGUAGE);
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_VALID_HTTP_RESPONSE);
            sinon.stub(ui, 'getTargetTemplateName').callsArgWith(1, 'error');
            // call
            helper.newWithOfficialTemplate(TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| ui get language & get template map & ui get template pass but download fail, expect throw error', (done) => {
            // setup
            sinon.stub(ui, 'selectSkillCodeLanguage').callsArgWith(0, null, TEST_LANGUAGE);
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_VALID_HTTP_RESPONSE);
            sinon.stub(ui, 'getTargetTemplateName').callsArgWith(1, null, TEST_TEMPLATE_NAME);
            sinon.stub(helper, 'downloadTemplateFromGit').callsArgWith(2, 'error');
            // call
            helper.newWithOfficialTemplate(TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(helper.downloadTemplateFromGit.args[0][0]).equal(TEST_TEMPLATE_NAME);
                expect(helper.downloadTemplateFromGit.args[0][1]).equal(TEST_TEMPLATE_URL);
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| ui get language & get template map & ui get template pass & download succeed, expect respond with user input', (done) => {
            // setup
            sinon.stub(ui, 'selectSkillCodeLanguage').callsArgWith(0, null, TEST_LANGUAGE);
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_VALID_HTTP_RESPONSE_JSON);
            sinon.stub(ui, 'getTargetTemplateName').callsArgWith(1, null, TEST_TEMPLATE_NAME);
            sinon.stub(helper, 'downloadTemplateFromGit').callsArgWith(2, null, TEST_USER_INPUT);
            // call
            helper.newWithOfficialTemplate(TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(helper.downloadTemplateFromGit.args[0][0]).equal(TEST_TEMPLATE_NAME);
                expect(helper.downloadTemplateFromGit.args[0][1]).equal(TEST_TEMPLATE_URL);
                expect(res).deep.equal(TEST_USER_INPUT);
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test helper method - newWithCustomTemplate', () => {
        let warnStub;

        beforeEach(() => {
            warnStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                warn: warnStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| template url is not git url, expect throw error', (done) => {
            // call
            helper.newWithCustomTemplate(TEST_URL, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(err).equal(`[Error]: The provided template url ${TEST_URL} is not a supported type. \
We currently only support ".git" url for user's custom template.`);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| git url & not official url & confirm throws error, expect throw error', (done) => {
            // setup
            sinon.stub(urlUtils, 'isUrlWithGitExtension').returns(true);
            sinon.stub(urlUtils, 'isUrlOfficialTemplate').returns(false);
            sinon.stub(ui, 'confirmUsingUnofficialTemplate').callsArgWith(0, 'error');
            // call
            helper.newWithCustomTemplate(TEST_URL, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(warnStub.args[0][0]).equal(`CLI is about to download the skill template from unofficial template ${TEST_URL}. \
Please make sure you understand the source code to best protect yourself from malicious usage.`);
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });
        it('| git url & not official url & confirm with no response, expect quit process', (done) => {
            // setup
            sinon.stub(urlUtils, 'isUrlWithGitExtension').returns(true);
            sinon.stub(urlUtils, 'isUrlOfficialTemplate').returns(false);
            sinon.stub(ui, 'confirmUsingUnofficialTemplate').callsArgWith(0, null, false);
            // call
            helper.newWithCustomTemplate(TEST_URL, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(warnStub.args[0][0]).equal(`CLI is about to download the skill template from unofficial template ${TEST_URL}. \
Please make sure you understand the source code to best protect yourself from malicious usage.`);
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                done();
            });
        });
        it('| git url & official url & confirm with yes response & download template fail, expect throw error', (done) => {
            // setup
            sinon.stub(urlUtils, 'isUrlWithGitExtension').returns(true);
            sinon.stub(urlUtils, 'isUrlOfficialTemplate').returns(false);
            sinon.stub(ui, 'confirmUsingUnofficialTemplate').callsArgWith(0, null, true);
            sinon.stub(helper, 'downloadTemplateFromGit').callsArgWith(2, 'error');
            // call
            helper.newWithCustomTemplate(TEST_URL, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(warnStub.args[0][0]).equal(`CLI is about to download the skill template from unofficial template ${TEST_URL}. \
Please make sure you understand the source code to best protect yourself from malicious usage.`);
                expect(helper.downloadTemplateFromGit.args[0][0]).equal(null);
                expect(helper.downloadTemplateFromGit.args[0][1]).equal(TEST_URL);
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });
        it('| git url & official url & confirm with yes response & download template succeed, expect respond with user input', (done) => {
            // setup
            sinon.stub(urlUtils, 'isUrlWithGitExtension').returns(true);
            sinon.stub(urlUtils, 'isUrlOfficialTemplate').returns(true);
            sinon.stub(helper, 'downloadTemplateFromGit').callsArgWith(2, null, TEST_USER_INPUT);
            // call
            helper.newWithCustomTemplate(TEST_URL, TEST_DO_DEBUG, (err, res) => {
                // verify
                expect(warnStub.callCount).equal(0);
                expect(helper.downloadTemplateFromGit.args[0][0]).equal(null);
                expect(helper.downloadTemplateFromGit.args[0][1]).equal(TEST_URL);
                expect(res).deep.equal(TEST_USER_INPUT);
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test helper method - downloadTemplateFromGit', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| ui get skill name fail, expect throws error', (done) => {
            // setup
            sinon.stub(ui, 'getSkillName').callsArgWith(1, 'error');
            // call
            helper.downloadTemplateFromGit(TEST_TEMPLATE_NAME, TEST_TEMPLATE_URL, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| ui get skill name pass but ui get project name fail, expect throws error', (done) => {
            // setup
            sinon.stub(ui, 'getSkillName').callsArgWith(1, null, TEST_SKILL_NAME);
            sinon.stub(ui, 'getProjectFolderName').callsArgWith(1, 'error');
            // call
            helper.downloadTemplateFromGit(TEST_TEMPLATE_NAME, TEST_TEMPLATE_URL, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| ui get skill name and get project name pass but git glient fail, expect throws error', (done) => {
            // setup
            sinon.stub(path, 'join').returns(TEST_URL);
            sinon.stub(ui, 'getSkillName').callsArgWith(1, null, TEST_SKILL_NAME);
            sinon.stub(ui, 'getProjectFolderName').callsArgWith(1, null, TEST_SKILL_FOLDER_NAME);
            sinon.stub(gitClient, 'clone').callsArgWith(3, 'error');
            // call
            helper.downloadTemplateFromGit(TEST_TEMPLATE_NAME, TEST_TEMPLATE_URL, (err, res) => {
                // verify
                expect(gitClient.clone.args[0][0]).equal(TEST_TEMPLATE_URL);
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| ui get skill name & get project name & git clone pass, expect return user input', (done) => {
            // setup
            sinon.stub(path, 'join').returns(TEST_URL);
            sinon.stub(ui, 'getSkillName').callsArgWith(1, null, TEST_SKILL_NAME);
            sinon.stub(ui, 'getProjectFolderName').callsArgWith(1, null, TEST_SKILL_FOLDER_NAME);
            sinon.stub(gitClient, 'clone').callsArgWith(3, null);
            // call
            helper.downloadTemplateFromGit(TEST_TEMPLATE_NAME, TEST_TEMPLATE_URL, (err, res) => {
                // verify
                expect(gitClient.clone.args[0][0]).equal(TEST_TEMPLATE_URL);
                expect(res).deep.equal({ skillName: TEST_SKILL_NAME, projectFolderPath: TEST_URL });
                expect(err).equal(null);
                done();
            });
        });

        it('| without template name & ui get skill name & get project name & git clone pass, expect return user input', (done) => {
            // setup
            sinon.stub(path, 'join').returns(TEST_URL);
            sinon.stub(ui, 'getSkillName').callsArgWith(1, null, TEST_SKILL_NAME);
            sinon.stub(ui, 'getProjectFolderName').callsArgWith(1, null, TEST_SKILL_FOLDER_NAME);
            sinon.stub(gitClient, 'clone').callsArgWith(3, null);
            // call
            helper.downloadTemplateFromGit(null, TEST_TEMPLATE_URL, (err, res) => {
                // verify
                expect(gitClient.clone.args[0][0]).equal(TEST_TEMPLATE_URL);
                expect(res).deep.equal({ skillName: TEST_SKILL_NAME, projectFolderPath: TEST_URL });
                expect(err).equal(null);
                done();
            });
        });
    });
});
