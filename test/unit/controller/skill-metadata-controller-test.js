const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs-extra');
const jsonView = require('@src/view/json-view');
const ResourcesConfig = require('@src/model/resources-config');
const httpClient = require('@src/clients/http-client');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const oauthWrapper = require('@src/utils/oauth-wrapper');
const zipUtils = require('@src/utils/zip-utils');
const hashUtils = require('@src/utils/hash-utils');
const CONSTANTS = require('@src/utils/constants');

describe('Controller test - skill metadata controller test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'resources-config.json');

    const TEST_PROFILE = 'default'; // test file contains 'default' profile
    const TEST_VENDOR_ID = 'vendorId';
    const TEST_SKILL_ID = 'skillId';
    const TEST_PATH = 'path';
    const TEST_CURRENT_HASH = 'currentHash';
    const TEST_UPLOAD_URL = 'uploadUrl';
    const TEST_EXPIRES_AT = 'expiresAt';
    const TEST_LOCATION_URL = 'locationUrl';
    const TEST_IMPORT_ID = 'importId';
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
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, (err, res) => {
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
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, (err, res) => {
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
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, (err, res) => {
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
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(err).equal('The hash of current skill package folder does not change compared to the '
                + 'last deploy hash result, CLI will skip the deploy of skill package.');
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
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, (err, res) => {
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
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, (err, res) => {
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
            skillMetaController.deploySkillPackage(TEST_VENDOR_ID, (err, res) => {
                // verify
                expect(err).equal('putErr');
                expect(res).equal(undefined);
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
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead').callsArgWith(2);
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
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead').callsArgWith(2);
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

    describe('# test class method: _pollImportStatus', () => {
        const skillMetaController = new SkillMetadataController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead').callsArgWith(2);
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
});
