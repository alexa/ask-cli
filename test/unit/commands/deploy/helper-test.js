const { expect } = require('chai');
const sinon = require('sinon');
const Messenger = require('@src/view/messenger');

const helper = require('@src/commands/deploy/helper');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const SkillCodeController = require('@src/controllers/skill-code-controller');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const profileHelper = require('@src/utils/profile-helper');

describe('Commands deploy test - helper test', () => {
    const TEST_PROFILE = 'default';
    const TEST_IGNORE_HASH = false;
    const TEST_VENDOR_ID = 'vendor';
    const TEST_DO_DEBUG = false;
    const TEST_OPTIONS = { profile: TEST_PROFILE, doDebug: TEST_DO_DEBUG, ignoreHash: TEST_IGNORE_HASH };

    describe('# test helper method - deploySkillMetadata', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| profile resolve vendorId fails, expect callback error', (done) => {
            // setup
            sinon.stub(profileHelper, 'resolveVendorId').throws(new Error('error'));
            // call
            helper.deploySkillMetadata(TEST_OPTIONS, (err, res) => {
                // verify
                expect(err.message).equal('error');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| skillMetaController deploySkillPackage fails, expect callback error', (done) => {
            // setup
            sinon.stub(profileHelper, 'resolveVendorId').returns(TEST_VENDOR_ID);
            sinon.stub(SkillMetadataController.prototype, 'deploySkillPackage').callsArgWith(2, 'error');
            // call
            helper.deploySkillMetadata(TEST_OPTIONS, (err, res) => {
                // verify
                expect(err).equal('error');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| skillMetaController deploySkillPackage passes, expect no error callback', (done) => {
            // setup
            sinon.stub(profileHelper, 'resolveVendorId').returns(TEST_VENDOR_ID);
            sinon.stub(SkillMetadataController.prototype, 'deploySkillPackage').callsArgWith(2);
            // call
            helper.deploySkillMetadata(TEST_OPTIONS, (err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                done();
            });
        });
    });

    describe('# test helper method - buildSkillCode', () => {
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

    describe('# test helper method - deploySkillInfrastructure', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| skillInfraController deploySkillInfrastructure fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillInfrastructureController.prototype, 'deployInfrastructure').callsArgWith(0, 'error');
            // call
            helper.deploySkillInfrastructure(TEST_PROFILE, TEST_DO_DEBUG, TEST_IGNORE_HASH, (err, res) => {
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
            helper.deploySkillInfrastructure(TEST_PROFILE, TEST_DO_DEBUG, TEST_IGNORE_HASH, (err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                done();
            });
        });
    });

    describe('# test helper method - enableSkill', () => {
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

        it('| skillMetaController validateDomain fails, expect callback error', (done) => {
            // setup
            sinon.stub(SkillMetadataController.prototype, 'validateDomain').throws('test-error');
            // call
            helper.enableSkill(TEST_PROFILE, TEST_DO_DEBUG, (err) => {
                expect(err.name).equal('test-error');
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
