const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const R = require('ramda');
const sinon = require('sinon');

const awsUtil = require('@src/clients/aws-client/aws-util');
const hostedSkillHelper = require('@src/commands/util/upgrade-project/hosted-skill-helper');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const ResourcesConfig = require('@src/model/resources-config');
const CONSTANTS = require('@src/utils/constants');

describe('Commands upgrade-project test - hosted skill helper test', () => {
    const TEST_ERROR = 'testError';
    const TEST_PROFILE = 'default';
    const TEST_AWS_REGION = 'us-west-2';
    const TEST_DO_DEBUG = false;
    const TEST_SKILL_ID = 'skillId';
    const TEST_SKILL_STAGE = 'development';
    const TEST_ROOT_PATH = 'rootPath';
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'hosted-skill-resources-config.json');

    describe('# test helper method - createV2ProjectSkeleton', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| crate v2 project skeleton, expect write JSON file correctly', () => {
            // setup
            const ensureDirStub = sinon.stub(fs, 'ensureDirSync');
            const writeStub = sinon.stub(fs, 'writeJSONSync');
            sinon.stub(R, 'clone').returns({ profiles: {} });
            // call
            hostedSkillHelper.createV2ProjectSkeleton(TEST_ROOT_PATH, TEST_SKILL_ID, TEST_PROFILE);
            expect(ensureDirStub.args[0][0]).eq(`${TEST_ROOT_PATH}/${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE}`);
            expect(ensureDirStub.args[1][0]).eq(`${TEST_ROOT_PATH}/${CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA}`);
            expect(writeStub.args[0][0]).eq(`${TEST_ROOT_PATH}/${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`);
            expect(writeStub.args[0][1]).deep.equal({
                profiles: {
                    [TEST_PROFILE]: {
                        skillId: TEST_SKILL_ID
                    }
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
            sinon.stub(awsUtil, 'getAWSProfile');
            sinon.stub(awsUtil, 'getCLICompatibleDefaultRegion').returns(TEST_AWS_REGION);
            const copyStub = sinon.stub(fs, 'copySync');
            // call
            hostedSkillHelper.handleExistingLambdaCode(TEST_ROOT_PATH, TEST_PROFILE);
            // verify
            // expect(ResourcesConfig.getInstance().getSkillInfraType(TEST_PROFILE)).deep.equal(CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME);
            expect(copyStub.args[0][0]).equal(`${TEST_ROOT_PATH}/${CONSTANTS.FILE_PATH.LEGACY_PATH}/${CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA}`);
            expect(copyStub.args[0][1]).equal(`${TEST_ROOT_PATH}/${CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA}`);
        });
    });
});
