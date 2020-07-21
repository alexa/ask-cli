const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs-extra');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const CliError = require('@src/exceptions/cli-error');
const CliWarn = require('@src/exceptions/cli-warn');
const Manifest = require('@src/model/manifest');
const ResourcesConfig = require('@src/model/resources-config');
const CONSTANTS = require('@src/utils/constants');
const hashUtils = require('@src/utils/hash-utils');
const zipUtils = require('@src/utils/zip-utils');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');

describe('Controller test - skill metadata controller test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj', 'ask-resources.json');
    const FIXTURE_MANIFEST_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'manifest.json');

    const TEST_PROFILE = 'default'; // test file contains 'default' profile
    const TEST_ROOT_PATH = 'root';
    const TEST_VENDOR_ID = 'vendorId';
    const TEST_IGNORE_HASH = false;
    const TEST_SKILL_ID = 'skillId';
    const TEST_STAGE = 'stage';
    const TEST_PATH = 'path';
    const TEST_PACKAGE_URL = 'packageUrl';
    const TEST_CURRENT_HASH = 'currentHash';
    const TEST_UPLOAD_URL = 'uploadUrl';
    const TEST_EXPIRES_AT = 'expiresAt';
    const TEST_LOCATION_URL = 'locationUrl';
    const TEST_IMPORT_ID = 'importId';
    const TEST_EXPORT_ID = 'exportId';
    const TEST_FILE_CONTENT = 'fileContent';
    const TEST_CONFIGURATION = {
        profile: TEST_PROFILE,
        doDebug: false
    };

    describe('# inspect correctness for constructor', () => {
        it('| initiate as a SkillMetadataController class', () => {
            const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);
            expect(skillMetaController).to.be.instanceOf(SkillMetadataController);
        });
    });

    describe('# test class method: deploySkillPackage', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| skill package src is empty in ask-resources.json', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, null);
            // call
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('Skill package src is not found in ask-resources.json.');
                done();
            });
        });

        it('| skill package src is not a valid file path', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(fs, 'existsSync').withArgs(TEST_PATH).returns(false);
            // call
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(`File ${TEST_PATH} does not exist.`);
                done();
            });
        });

        it('| getHash fails with error', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(fs, 'existsSync').withArgs(TEST_PATH).returns(true);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, 'hashError', null);
            // call
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('hashError');
                done();
            });
        });

        it('| getHash result same as lastDeployHash, expect quit with warn message', (done) => {
            // setup
            const LAST_DEPLOY = 'lastDeploy';
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(fs, 'existsSync').withArgs(TEST_PATH).returns(true);
            ResourcesConfig.getInstance().setSkillMetaLastDeployHash(TEST_PROFILE, LAST_DEPLOY);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, LAST_DEPLOY);
            // call
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
                // verify
                expect(err).equal('The hash of current skill package folder does not change compared to the '
                + 'last deploy hash result, CLI will skip the deploy of skill package.');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| hash did not change and ignore hash flag passed, expect resourcesConfig updated correctly', (done) => {
            // setup
            const LAST_DEPLOY = 'lastDeploy';
            const IGNORE_HASH = true;
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(fs, 'existsSync').withArgs(TEST_PATH).returns(true);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, LAST_DEPLOY);
            ResourcesConfig.getInstance().setSkillMetaLastDeployHash(TEST_PROFILE, LAST_DEPLOY);
            sinon.stub(SkillMetadataController.prototype, 'putSkillPackage').callsArgWith(2, null, TEST_SKILL_ID);
            ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, TEST_SKILL_ID);
            // call
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, IGNORE_HASH, (err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| hash does change, skillId exists and putSkillPackage passes, expect resourcesConfig updated correctly', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(fs, 'existsSync').withArgs(TEST_PATH).returns(true);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_CURRENT_HASH);
            sinon.stub(SkillMetadataController.prototype, 'putSkillPackage').callsArgWith(2, null, TEST_SKILL_ID);
            ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, TEST_SKILL_ID);
            // call
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
                // verify
                expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal(TEST_CURRENT_HASH);
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| hash does change, skillId not exists and putSkillPackage passes, expect resourcesConfig updated correctly', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(fs, 'existsSync').withArgs(TEST_PATH).returns(true);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_CURRENT_HASH);
            sinon.stub(SkillMetadataController.prototype, 'putSkillPackage').callsArgWith(2, null, TEST_SKILL_ID);
            ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, '');
            // call
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
                // verify
                expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal(TEST_CURRENT_HASH);
                expect(ResourcesConfig.getInstance().getSkillId(TEST_PROFILE)).equal(TEST_SKILL_ID);
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| putSkillPackage fails, expect callback put error message', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(fs, 'existsSync').withArgs(TEST_PATH).returns(true);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_CURRENT_HASH);
            sinon.stub(SkillMetadataController.prototype, 'putSkillPackage').callsArgWith(2, 'putErr');
            ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, TEST_SKILL_ID);
            // call
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, TEST_IGNORE_HASH, (err, res) => {
                // verify
                expect(err).equal('putErr');
                expect(res).equal(undefined);
                done();
            });
        });
    });

    describe('# test class method enableSkill', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            new Manifest(FIXTURE_MANIFEST_FILE_PATH);
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            Manifest.dispose();
            sinon.restore();
        });

        it('| callback error when skillId is not provided', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillId(TEST_PROFILE, '');
            // call
            skillMetaController.enableSkill((err, res) => {
                // verify
                expect(err).equal(`[Fatal]: Failed to find the skillId for profile [${TEST_PROFILE}],
 please make sure the skill metadata deployment has succeeded with result of a valid skillId.`);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| return error when dominInfo is not provided', () => {
            // setup
            Manifest.getInstance().setApis({});
            const expectedErrMessage = 'Skill information is not valid. Please make sure "apis" field in the skill.json is not empty.';
            // call
            expect(() => skillMetaController.validateDomain()).to.throw(CliError, expectedErrMessage);
        });

        it('| return error when dominInfo contains more than one domain', () => {
            // setup
            Manifest.getInstance().setApis({
                custom: {},
                smartHome: {}
            });
            const expectedErrMessage = 'Skill with multiple api domains cannot be enabled. Skip the enable process.';
            // call
            expect(() => skillMetaController.validateDomain()).to.throw(CliWarn, expectedErrMessage);
        });

        it('| return error when domain cannot be enabled', () => {
            // setup
            Manifest.getInstance().setApis({
                smartHome: {}
            });
            const expectedErrMessage = 'Skill api domain "smartHome" cannot be enabled. Skip the enable process.';
            // call
            expect(() => skillMetaController.validateDomain()).to.throw(CliWarn, expectedErrMessage);
        });

        it('| callback error when getSkillEnablement return error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, 'getSkillEnablementError'); // stub smapi request
            skillMetaController.enableSkill((err, res) => {
                // verify
                expect(err).equal('getSkillEnablementError');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| callback error when getSkillEnablement return error', (done) => {
            // setup
            const responseBody = {
                Message: 'somehow fails'
            };
            const response = {
                statusCode: 300,
                body: responseBody
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, response); // stub smapi request
            skillMetaController.enableSkill((err, res) => {
                // verify
                expect(err).equal(jsonView.toString(responseBody));
                expect(res).equal(undefined);
                done();
            });
        });

        it('| when skill already enabled, can callback skip enablement message', (done) => {
            // setup
            const response = {
                statusCode: 200,
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, response); // stub smapi request
            sinon.stub(Messenger.getInstance(), 'info');
            skillMetaController.enableSkill((err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                expect(Messenger.getInstance().info.args[0][0]).equal('Skill is already enabled, skip the enable process.');
                done();
            });
        });

        it('| when skill is not enabled, can callback error when enalbe skill fail', (done) => {
            // setup
            const getEnablementResponse = {
                statusCode: 404,
                body: {}
            };
            sinon.stub(httpClient, 'request')
                .withArgs(sinon.match.any, 'get-skill-enablement')
                .callsArgWith(3, null, getEnablementResponse); // stub smapi request

            httpClient.request
                .withArgs(sinon.match.any, 'enable-skill')
                .callsArgWith(3, 'enableSkillError'); // stub smapi request

            skillMetaController.enableSkill((err, res) => {
                // verify
                expect(err).equal('enableSkillError');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| when skill is not enabled, can callback error when statusCode >= 300', (done) => {
            // setup
            const getEnablementResponse = {
                statusCode: 404,
                body: {}
            };
            const enableSkillResponseBody = {
                Message: 'somehow fail'
            };
            const enableSkillResponse = {
                statusCode: 300,
                body: enableSkillResponseBody
            };
            sinon.stub(httpClient, 'request')
                .withArgs(sinon.match.any, 'get-skill-enablement')
                .callsArgWith(3, null, getEnablementResponse); // stub smapi request

            httpClient.request
                .withArgs(sinon.match.any, 'enable-skill')
                .callsArgWith(3, null, enableSkillResponse); // stub smapi request

            skillMetaController.enableSkill((err, res) => {
                // verify
                expect(err).equal(jsonView.toString(enableSkillResponseBody));
                expect(res).equal(undefined);
                done();
            });
        });

        it('| when skill is not enabled, can callback success enable skill message', (done) => {
            // setup
            const getEnablementResponse = {
                statusCode: 404,
                body: {}
            };
            const enableSkillResponse = {
                statusCode: 200,
            };
            sinon.stub(Messenger.getInstance(), 'info');
            sinon.stub(httpClient, 'request')
                .withArgs(sinon.match.any, 'get-skill-enablement')
                .callsArgWith(3, null, getEnablementResponse); // stub smapi request

            httpClient.request
                .withArgs(sinon.match.any, 'enable-skill')
                .callsArgWith(3, null, enableSkillResponse); // stub smapi request

            skillMetaController.enableSkill((err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                expect(Messenger.getInstance().info.args[0][0]).equal('Skill is enabled successfully.');
                done();
            });
        });
    });

    describe('# test class method: putSkillPackage', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| upload of skill package fails, expect callback with error', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(SkillMetadataController.prototype, 'uploadSkillPackage').callsArgWith(1, 'uploadErr');
            // call
            skillMetaController.putSkillPackage(TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype.uploadSkillPackage.args[0][0]).equal(TEST_PATH);
                expect(res).equal(undefined);
                expect(err).equal('uploadErr');
                done();
            });
        });

        it('| import skill pacakge faild, expect callback with error', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(SkillMetadataController.prototype, 'uploadSkillPackage').callsArgWith(1, null, {
                uploadUrl: TEST_UPLOAD_URL
            });
            sinon.stub(SkillMetadataController.prototype, '_importPackage').callsArgWith(3, 'importErr');
            // call
            skillMetaController.putSkillPackage(TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype._importPackage.args[0][0]).equal(TEST_SKILL_ID);
                expect(SkillMetadataController.prototype._importPackage.args[0][1]).equal(TEST_VENDOR_ID);
                expect(SkillMetadataController.prototype._importPackage.args[0][2]).equal(TEST_UPLOAD_URL);
                expect(res).equal(undefined);
                expect(err).equal('importErr');
                done();
            });
        });

        it('| poll skill pacakge faild, expect callback with error', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(SkillMetadataController.prototype, 'uploadSkillPackage').callsArgWith(1, null, {
                uploadUrl: TEST_UPLOAD_URL
            });
            sinon.stub(SkillMetadataController.prototype, '_importPackage').callsArgWith(3, null, {
                headers: { location: TEST_LOCATION_URL }
            });
            sinon.stub(SkillMetadataController.prototype, '_pollImportStatus').callsArgWith(1, 'pollErr');
            // call
            skillMetaController.putSkillPackage(TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype._pollImportStatus.args[0][0]).equal(TEST_LOCATION_URL);
                expect(res).equal(undefined);
                expect(err).equal('pollErr');
                done();
            });
        });

        it('| poll skill pacakge replies with non succeed result, expect callback with error response', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(SkillMetadataController.prototype, 'uploadSkillPackage').callsArgWith(1, null, {
                uploadUrl: TEST_UPLOAD_URL
            });
            sinon.stub(SkillMetadataController.prototype, '_importPackage').callsArgWith(3, null, {
                headers: { location: TEST_LOCATION_URL }
            });
            sinon.stub(SkillMetadataController.prototype, '_pollImportStatus').callsArgWith(1, null, {
                body: { status: CONSTANTS.SKILL.PACKAGE_STATUS.FAILED }
            });
            // call
            skillMetaController.putSkillPackage(TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype._pollImportStatus.args[0][0]).equal(TEST_LOCATION_URL);
                expect(res).equal(undefined);
                expect(err).equal(jsonView.toString({ status: CONSTANTS.SKILL.PACKAGE_STATUS.FAILED }));
                done();
            });
        });

        it('| poll skill pacakge finished, expect callback skillId', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaSrc(TEST_PROFILE, TEST_PATH);
            sinon.stub(SkillMetadataController.prototype, 'uploadSkillPackage').callsArgWith(1, null, {
                uploadUrl: TEST_UPLOAD_URL
            });
            sinon.stub(SkillMetadataController.prototype, '_importPackage').callsArgWith(3, null, {
                headers: { location: TEST_LOCATION_URL }
            });
            sinon.stub(SkillMetadataController.prototype, '_pollImportStatus').callsArgWith(1, null, {
                body: {
                    status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED,
                    skill: { skillId: TEST_SKILL_ID }
                }
            });
            // call
            skillMetaController.putSkillPackage(TEST_SKILL_ID, TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype._pollImportStatus.args[0][0]).equal(TEST_LOCATION_URL);
                expect(err).equal(null);
                expect(res).equal(TEST_SKILL_ID);
                done();
            });
        });
    });

    describe('# test class method: getSkillPackage', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| export package request fails, expect callback with error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, '_exportPackage').callsArgWith(2, 'exportErr');
            // call
            skillMetaController.getSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_STAGE, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype._exportPackage.args[0][0]).equal(TEST_SKILL_ID);
                expect(SkillMetadataController.prototype._exportPackage.args[0][1]).equal(TEST_STAGE);
                expect(res).equal(undefined);
                expect(err).equal('exportErr');
                done();
            });
        });

        it('| export package returns exportId but poll status fails, expect callback with error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, '_exportPackage').callsArgWith(2, null, {
                statusCode: 202,
                headers: {
                    location: `${TEST_EXPORT_ID}`
                }
            });
            sinon.stub(SkillMetadataController.prototype, '_pollExportStatus').callsArgWith(1, 'polling error');
            // call
            skillMetaController.getSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_STAGE, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype._pollExportStatus.args[0][0]).equal(TEST_EXPORT_ID);
                expect(res).equal(undefined);
                expect(err).equal('polling error');
                done();
            });
        });

        it('| package exported successfully but unzip fails, expect callback zip error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, '_exportPackage').callsArgWith(2, null, {
                statusCode: 202,
                headers: {
                    location: `${TEST_EXPORT_ID}`
                }
            });
            sinon.stub(SkillMetadataController.prototype, '_pollExportStatus').callsArgWith(1, null, {
                statusCode: 200,
                body: {
                    skill: {
                        location: TEST_PACKAGE_URL
                    }
                }
            });
            sinon.stub(zipUtils, 'unzipRemoteZipFile').callsArgWith(3, 'unzip error');
            // call
            skillMetaController.getSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_STAGE, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype._pollExportStatus.args[0][0]).equal(TEST_EXPORT_ID);
                expect(res).equal(undefined);
                expect(err).equal('unzip error');
                done();
            });
        });

        it('| package exported successfully and unzip works, expect no error returned', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, '_exportPackage').callsArgWith(2, null, {
                statusCode: 202,
                headers: {
                    location: `${TEST_EXPORT_ID}`
                }
            });
            sinon.stub(SkillMetadataController.prototype, '_pollExportStatus').callsArgWith(1, null, {
                statusCode: 200,
                body: {
                    skill: {
                        location: TEST_PACKAGE_URL
                    }
                }
            });
            sinon.stub(zipUtils, 'unzipRemoteZipFile').callsArgWith(3, null);
            // call
            skillMetaController.getSkillPackage(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_STAGE, (err, res) => {
                // verify
                expect(SkillMetadataController.prototype._pollExportStatus.args[0][0]).equal(TEST_EXPORT_ID);
                expect(res).equal(undefined);
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test class method: uploadSkillPackage', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| create upload url fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, '_createUploadUrl').callsArgWith(0, 'createUploadErr');
            // call
            skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('createUploadErr');
                done();
            });
        });

        it('| create zip fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, '_createUploadUrl').callsArgWith(0, null, {
                uploadUrl: TEST_UPLOAD_URL
            });
            sinon.stub(zipUtils, 'createTempZip').callsArgWith(1, 'zipErr');
            // call
            skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
                // verify
                expect(zipUtils.createTempZip.args[0][0]).equal(TEST_PATH);
                expect(res).equal(undefined);
                expect(err).equal('zipErr');
                done();
            });
        });

        it('| upload zip file fails, expect callback error', (done) => {
            // setup
            sinon.stub(fs, 'readFileSync').withArgs(TEST_PATH).returns(TEST_FILE_CONTENT);
            sinon.stub(SkillMetadataController.prototype, '_createUploadUrl').callsArgWith(0, null, {
                uploadUrl: TEST_UPLOAD_URL
            });
            sinon.stub(zipUtils, 'createTempZip').callsArgWith(1, null, TEST_PATH);
            sinon.stub(fs, 'removeSync');
            sinon.stub(httpClient, 'putByUrl').callsArgWith(4, 'uploadErr');
            // call
            skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
                // verify
                expect(httpClient.putByUrl.args[0][0]).equal(TEST_UPLOAD_URL);
                expect(httpClient.putByUrl.args[0][1]).equal(TEST_FILE_CONTENT);
                expect(httpClient.putByUrl.args[0][2]).equal('upload-skill-package');
                expect(httpClient.putByUrl.args[0][3]).equal(false);
                expect(res).equal(undefined);
                expect(err).equal('uploadErr');
                done();
            });
        });

        it('| upload zip file meets error, expect callback error', (done) => {
            // setup
            sinon.stub(zipUtils, 'createTempZip').callsArgWith(1, null, TEST_PATH);
            sinon.stub(fs, 'readFileSync').withArgs(TEST_PATH).returns(TEST_FILE_CONTENT);
            sinon.stub(SkillMetadataController.prototype, '_createUploadUrl').callsArgWith(0, null, {
                uploadUrl: TEST_UPLOAD_URL
            });
            sinon.stub(fs, 'removeSync');
            sinon.stub(httpClient, 'putByUrl').callsArgWith(4, null, {
                statusCode: 401
            });
            // call
            skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
                // verify
                expect(httpClient.putByUrl.args[0][0]).equal(TEST_UPLOAD_URL);
                expect(httpClient.putByUrl.args[0][1]).equal(TEST_FILE_CONTENT);
                expect(httpClient.putByUrl.args[0][2]).equal('upload-skill-package');
                expect(httpClient.putByUrl.args[0][3]).equal(false);
                expect(res).equal(undefined);
                expect(err).equal('[Error]: Upload of skill package failed. Please try again with --debug to see more details.');
                done();
            });
        });

        it('| upload skill package succeeds, expect callback upload result', (done) => {
            // setup
            sinon.stub(zipUtils, 'createTempZip').callsArgWith(1, null, TEST_PATH);
            sinon.stub(fs, 'readFileSync').withArgs(TEST_PATH).returns(TEST_FILE_CONTENT);
            sinon.stub(SkillMetadataController.prototype, '_createUploadUrl').callsArgWith(0, null, {
                uploadUrl: TEST_UPLOAD_URL
            });
            sinon.stub(fs, 'removeSync');
            sinon.stub(httpClient, 'putByUrl').callsArgWith(4, null, { statusCode: 202 });
            // call
            skillMetaController.uploadSkillPackage(TEST_PATH, (err, res) => {
                // verify
                expect(httpClient.putByUrl.args[0][0]).equal(TEST_UPLOAD_URL);
                expect(httpClient.putByUrl.args[0][1]).equal(TEST_FILE_CONTENT);
                expect(httpClient.putByUrl.args[0][2]).equal('upload-skill-package');
                expect(httpClient.putByUrl.args[0][3]).equal(false);
                expect(err).equal(null);
                expect(res).deep.equal({
                    uploadUrl: TEST_UPLOAD_URL
                });
                done();
            });
        });
    });

    describe('# test class method: _createUploadUrl', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| skillPackageSrc create upload fails, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, 'createUploadErr'); // stub smapi request
            // call
            skillMetaController._createUploadUrl((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('createUploadErr');
                done();
            });
        });

        it('| skillPackageSrc create upload returns error response, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 403,
                body: {
                    error: 'message'
                }
            }); // stub smapi request
            // call
            skillMetaController._createUploadUrl((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(jsonView.toString({ error: 'message' }));
                done();
            });
        });

        it('| skillPackageSrc create upload succeeds, expect callback with createUpload response', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 200,
                headers: {},
                body: {
                    uploadUrl: TEST_UPLOAD_URL,
                    expiresAt: TEST_EXPIRES_AT
                }
            }); // stub smapi request
            // call
            skillMetaController._createUploadUrl((err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).deep.equal({
                    uploadUrl: TEST_UPLOAD_URL,
                    expiresAt: TEST_EXPIRES_AT
                });
                done();
            });
        });
    });

    describe('# test class method: _importPackage', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| import package fails, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, 'importErr'); // stub smapi request
            // call
            skillMetaController._importPackage(TEST_SKILL_ID, TEST_VENDOR_ID, TEST_LOCATION_URL, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('importErr');
                done();
            });
        });

        it('| import package returns error response, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 403,
                body: {
                    error: 'message'
                }
            }); // stub smapi request
            // call
            skillMetaController._importPackage(TEST_SKILL_ID, TEST_VENDOR_ID, TEST_LOCATION_URL, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(jsonView.toString({ error: 'message' }));
                done();
            });
        });

        it('| import package succeeds, expect callback with createUpload response', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 200,
                headers: {},
                body: {
                    response: 'response'
                }
            }); // stub smapi request
            // call
            skillMetaController._importPackage(TEST_SKILL_ID, TEST_VENDOR_ID, TEST_LOCATION_URL, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).deep.equal({
                    statusCode: 200,
                    headers: {},
                    body: {
                        response: 'response'
                    }
                });
                done();
            });
        });
    });

    describe('# test class method: _exportPackage', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| export package fails, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, 'exportErr'); // stub smapi request
            // call
            skillMetaController._exportPackage(TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('exportErr');
                done();
            });
        });

        it('| export package returns error response, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 403,
                body: {
                    error: 'message'
                }
            }); // stub smapi request
            // call
            skillMetaController._exportPackage(TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(jsonView.toString({ error: 'message' }));
                done();
            });
        });

        it('| export package succeeds, expect callback with export response', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 200,
                headers: {},
                body: {
                    response: 'response'
                }
            }); // stub smapi request
            // call
            skillMetaController._exportPackage(TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).deep.equal({
                    statusCode: 200,
                    headers: {},
                    body: {
                        response: 'response'
                    }
                });
                done();
            });
        });
    });

    describe('# test class method: _pollImportStatus', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| poll status with getImportStatus fails, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, 'pollErr'); // stub smapi request
            // call
            skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
                // verify
                expect(res).equal(null);
                expect(err).equal('pollErr');
                done();
            });
        }).timeout(20000);

        it('| poll status with getImportStatus return error response, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 403,
                body: {
                    error: 'message'
                }
            }); // stub smapi request
            // call
            skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
                // verify
                expect(res).equal(null);
                expect(err).equal(jsonView.toString({ error: 'message' }));
                done();
            });
        }).timeout(20000);

        it('| poll status with getImportStatus return success, expect callback with getImportStatus response', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 200,
                body: {
                    status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED
                },
                headers: {}
            }); // stub smapi request
            // call
            skillMetaController._pollImportStatus(TEST_IMPORT_ID, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).deep.equal({
                    statusCode: 200,
                    body: {
                        status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED
                    },
                    headers: {}
                });
                done();
            });
        }).timeout(20000);
    });

    describe('# test class method: _pollExportStatus', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| poll status with getExportStatus fails, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, 'pollErr'); // stub smapi request
            // call
            skillMetaController._pollExportStatus(TEST_EXPORT_ID, (err, res) => {
                // verify
                expect(res).equal(null);
                expect(err).equal('pollErr');
                done();
            });
        });

        it('| poll status with getExportStatus return error response, expect callback error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 403,
                body: {
                    error: 'message'
                }
            }); // stub smapi request
            // call
            skillMetaController._pollExportStatus(TEST_EXPORT_ID, (err, res) => {
                // verify
                expect(res).equal(null);
                expect(err).equal(jsonView.toString({ error: 'message' }));
                done();
            });
        });

        it('| poll status with getExportStatus return success, expect callback with getExportStatus response', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, {
                statusCode: 200,
                body: {
                    status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED
                },
                headers: {}
            }); // stub smapi request
            // call
            skillMetaController._pollExportStatus(TEST_EXPORT_ID, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).deep.equal({
                    statusCode: 200,
                    body: {
                        status: CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED
                    },
                    headers: {}
                });
                done();
            });
        });
    });
});
