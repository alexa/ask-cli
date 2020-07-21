const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const DeployCommand = require('@src/commands/deploy');
const helper = require('@src/commands/deploy/helper');
const optionModel = require('@src/commands/option-model');
const CliWarn = require('@src/exceptions/cli-warn');
const ResourcesConfig = require('@src/model/resources-config');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');

describe('Commands deploy test - command class test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj', 'ask-resources.json');
    const FIXTURE_MANIFEST_FILE = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'manifest.json');
    const TEST_PROFILE = 'default';
    const TEST_DEBUG = false;
    const TEST_IGNORE_HASH = false;

    let infoStub;
    let errorStub;
    let warnStub;

    beforeEach(() => {
        infoStub = sinon.stub();
        errorStub = sinon.stub();
        warnStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({
            info: infoStub,
            error: errorStub,
            warn: warnStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('| validate command information is set correctly', () => {
        const instance = new DeployCommand(optionModel);
        expect(instance.name()).equal('deploy');
        expect(instance.description()).equal('deploy the skill project');
        expect(instance.requiredOptions()).deep.equal([]);
        expect(instance.optionalOptions()).deep.equal(['ignore-hash', 'target', 'profile', 'debug']);
    });

    describe('validate command handle', () => {
        const TEST_CMD = {
            profile: TEST_PROFILE,
            debug: TEST_DEBUG,
            ignoreHash: TEST_IGNORE_HASH
        };
        const TEST_SKILL_METADATA_SRC = './skillPackage';
        let instance;
        let pathStub;

        beforeEach(() => {
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            pathStub = sinon.stub(path, 'join');
            pathStub.withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG).returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            pathStub.withArgs(TEST_SKILL_METADATA_SRC, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST).returns(FIXTURE_MANIFEST_FILE);
            pathStub.callThrough();
            instance = new DeployCommand(optionModel);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('command handle - before deploy resources', () => {
            it('| when profile is not correct, expect throw error', (done) => {
                // setup
                profileHelper.runtimeProfile.throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('error');
                    expect(errorStub.args[0][0].message).equal('error');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when ResourcesConfig initiation fails, expect throw error', (done) => {
                // setup
                pathStub.withArgs(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG).returns('invalidPath');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('File invalidPath not exists.');
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(1);
                    done();
                });
            });

            it('| when deployer is alexa-hosted-deployer, expect throw warning', (done) => {
                // setup
                sinon.stub(ResourcesConfig.prototype, 'getSkillInfraType').returns(CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).instanceOf(CliWarn);
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(1);
                    done();
                });
            });

            it('| when skillPackage src is not set, expect throw error', (done) => {
                // setup
                sinon.stub(stringUtils, 'isNonBlankString').returns(false);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('Skill package src is not found in ask-resources.json.');
                    expect(errorStub.args[0][0].message).equal('Skill package src is not found in ask-resources.json.');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when skillPackage src does not exist, expect throw error', (done) => {
                // setup
                sinon.stub(fse, 'existsSync').withArgs('./skillPackage').returns(false);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('The skillMetadata src file ./skillPackage does not exist.');
                    expect(errorStub.args[0][0].message).equal('The skillMetadata src file ./skillPackage does not exist.');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when Manifest initiation fails, expect throw error', (done) => {
                // setup
                sinon.stub(fse, 'existsSync').withArgs('./skillPackage').returns(true);
                fse.existsSync.withArgs('invalidPath').returns(false);
                sinon.stub(stringUtils, 'isNonBlankString').returns(true);
                path.join.withArgs('./skillPackage', CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST).returns('invalidPath');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('File invalidPath not exists.');
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(1);
                    done();
                });
            });
        });

        describe('command handle - deploy skill metadata', () => {
            beforeEach(() => {
                sinon.stub(fse, 'existsSync').returns(true);
            });

            it('| helper deploy skill metadata fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1, 'error');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal('error');
                    expect(errorStub.args[0][0]).equal('error');
                    expect(infoStub.args[0][0]).equal('==================== Deploy Skill Metadata ====================');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| helper deploy skill metadata with same hash skip result, expect display the message and continue', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1,
                    'The hash of current skill package folder does not change compared to the last deploy hash result, '
                    + 'CLI will skip the deploy of skill package.');
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, 'error');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal('error');
                    expect(errorStub.args[0][0]).equal('error');
                    expect(infoStub.args[0][0]).equal('==================== Deploy Skill Metadata ====================');
                    expect(infoStub.args[1][0].startsWith('Skill ID:')).equal(true);
                    expect(warnStub.callCount).equal(1);
                    done();
                });
            });

            it('| helper deploy skill metadata and no skillCode portion of work, expect quit with no error', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1,
                    'The hash of current skill package folder does not change compared to the last deploy hash result, '
                    + 'CLI will skip the deploy of skill package.');
                sinon.stub(ResourcesConfig.prototype, 'getCodeRegions').returns([]);
                sinon.stub(helper, 'enableSkill').callsArgWith(2);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('==================== Deploy Skill Metadata ====================');
                    expect(infoStub.args[1][0].startsWith('Skill ID:')).equal(true);
                    expect(errorStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(1);
                    done();
                });
            });

            it('| helper deploy skill with skill metadata target, expect skip deploy metadata and skip build and infra deploy', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1);
                sinon.stub(helper, 'enableSkill').callsArgWith(2);
                const cmd = { ...TEST_CMD, target: CONSTANTS.DEPLOY_TARGET.SKILL_METADATA };

                // call
                instance.handle(cmd, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.callCount).equal(3);
                    expect(infoStub.args[0][0]).equal('==================== Deploy Skill Metadata ====================');
                    expect(infoStub.args[1][0]).equal('Skill package deployed successfully.');
                    expect(infoStub.args[2][0].startsWith('Skill ID:')).equal(true);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| helper deploy skill, expect error if non supported value provided for the target flag', (done) => {
                // setup
                const target = 'some-non-supported-target';
                const cmd = { ...TEST_CMD, target };

                // call
                instance.handle(cmd, (err) => {
                    // verify
                    expect(err.message).equal(`Target ${target} is not supported. Supported targets: ${Object.values(CONSTANTS.DEPLOY_TARGET)}.`);
                    done();
                });
            });
        });

        describe('command handle - build skill code', () => {
            beforeEach(() => {
                sinon.stub(fse, 'existsSync').returns(true);
            });

            it('| helper build skill code fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, 'error');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal('error');
                    expect(errorStub.args[0][0]).equal('error');
                    expect(infoStub.args[0][0]).equal('==================== Deploy Skill Metadata ====================');
                    expect(infoStub.args[1][0]).equal('Skill package deployed successfully.');
                    expect(infoStub.args[2][0].startsWith('Skill ID:')).equal(true);
                    expect(infoStub.args[3][0]).equal('\n==================== Build Skill Code ====================');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - deploy skill infrastructure', () => {
            const TEST_CODE_BUILD_RESULT = [{
                src: 'codeSrc',
                build: {
                    file: 'buildFile',
                    folder: 'buildFolder'
                },
                buildFlow: 'build-flow',
                regionsList: ['default', 'NA']
            }];
            const TEST_CODE_SRC_BASENAME = 'base';

            beforeEach(() => {
                sinon.stub(fse, 'existsSync').returns(true);
            });

            it('| helper deploy skill infra without infraType, expect skip the flow by calling back', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(2, 'error');
                sinon.stub(helper, 'enableSkill').callsArgWith(2);
                sinon.stub(stringUtils, 'isNonBlankString').returns(true);
                stringUtils.isNonBlankString.withArgs('@ask-cli/cfn-deployer').returns(false);
                sinon.stub(path, 'resolve').returns(TEST_CODE_SRC_BASENAME);
                sinon.stub(fs, 'statSync').returns({
                    isDirectory: () => true
                });
                path.join.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.callCount).equal(6);
                    expect(infoStub.args[0][0]).equal('==================== Deploy Skill Metadata ====================');
                    expect(infoStub.args[1][0]).equal('Skill package deployed successfully.');
                    expect(infoStub.args[2][0].startsWith('Skill ID:')).equal(true);
                    expect(infoStub.args[3][0]).equal('\n==================== Build Skill Code ====================');
                    expect(infoStub.args[4][0]).equal('Skill code built successfully.');
                    expect(infoStub.args[5][0]).equal(`Code for region default+NA built to ${TEST_CODE_BUILD_RESULT[0].build.file} successfully \
with build flow ${TEST_CODE_BUILD_RESULT[0].buildFlow}.`);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| helper deploy skill with infrastructure target, expect skip skill metadata; build code and deploy infrastructure', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1);
                sinon.stub(helper, 'enableSkill').callsArgWith(2);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(3);
                sinon.stub(path, 'resolve').returns(TEST_CODE_SRC_BASENAME);
                sinon.stub(fs, 'statSync').returns({
                    isDirectory: () => true
                });
                path.join.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
                const cmd = { ...TEST_CMD, target: CONSTANTS.DEPLOY_TARGET.SKILL_INFRASTRUCTURE };

                // call
                instance.handle(cmd, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.callCount).equal(5);
                    expect(infoStub.args[0][0]).equal('\n==================== Build Skill Code ====================');
                    expect(infoStub.args[1][0]).equal('Skill code built successfully.');
                    expect(infoStub.args[2][0]).equal(`Code for region default+NA built to ${TEST_CODE_BUILD_RESULT[0].build.file} successfully \
with build flow ${TEST_CODE_BUILD_RESULT[0].buildFlow}.`);
                    expect(infoStub.args[3][0]).equal('\n==================== Deploy Skill Infrastructure ====================');
                    expect(infoStub.args[4][0]).equal('Skill infrastructures deployed successfully through @ask-cli/cfn-deployer.');
                    expect(warnStub.callCount).equal(0);
                    expect(helper.enableSkill.calledOnce).equal(false);
                    done();
                });
            });

            it('| helper deploy skill with infrastructure target, expect throw error when skill id does not exist', (done) => {
                // setup
                sinon.stub(ResourcesConfig.prototype, 'getSkillId').returns(undefined);
                const cmd = { ...TEST_CMD, target: CONSTANTS.DEPLOY_TARGET.SKILL_INFRASTRUCTURE };

                // call
                instance.handle(cmd, (err) => {
                    // verify
                    expect(err.message).include('the skillId has not been created yet. Please deploy your skillMetadata first');
                    done();
                });
            });

            it('| helper deploy skill infra fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(3, 'error');
                sinon.stub(helper, 'enableSkill').callsArgWith(2);
                sinon.stub(path, 'resolve').returns(TEST_CODE_SRC_BASENAME);
                sinon.stub(fs, 'statSync').returns({
                    isDirectory: () => true
                });
                path.join.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal('error');
                    expect(errorStub.args[0][0]).equal('error');
                    expect(infoStub.args[0][0]).equal('==================== Deploy Skill Metadata ====================');
                    expect(infoStub.args[1][0]).equal('Skill package deployed successfully.');
                    expect(infoStub.args[2][0].startsWith('Skill ID:')).equal(true);
                    expect(infoStub.args[3][0]).equal('\n==================== Build Skill Code ====================');
                    expect(infoStub.args[4][0]).equal('Skill code built successfully.');
                    expect(infoStub.args[5][0]).equal(`Code for region default+NA built to ${TEST_CODE_BUILD_RESULT[0].build.file} successfully \
with build flow ${TEST_CODE_BUILD_RESULT[0].buildFlow}.`);
                    expect(infoStub.args[6][0]).equal('\n==================== Deploy Skill Infrastructure ====================');
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| deploy skill all pass, expect deploy succeeds and enableSkill get called', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(3);
                sinon.stub(helper, 'enableSkill').callsArgWith(2);
                sinon.stub(path, 'resolve').returns(TEST_CODE_SRC_BASENAME);
                sinon.stub(fs, 'statSync').returns({
                    isDirectory: () => true
                });
                path.join.withArgs(TEST_CODE_SRC_BASENAME).returns(TEST_CODE_SRC_BASENAME);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.callCount).equal(8);
                    expect(infoStub.args[0][0]).equal('==================== Deploy Skill Metadata ====================');
                    expect(infoStub.args[1][0]).equal('Skill package deployed successfully.');
                    expect(infoStub.args[2][0].startsWith('Skill ID:')).equal(true);
                    expect(infoStub.args[3][0]).equal('\n==================== Build Skill Code ====================');
                    expect(infoStub.args[4][0]).equal('Skill code built successfully.');
                    expect(infoStub.args[5][0]).equal(`Code for region default+NA built to ${TEST_CODE_BUILD_RESULT[0].build.file} successfully \
with build flow ${TEST_CODE_BUILD_RESULT[0].buildFlow}.`);
                    expect(infoStub.args[6][0]).equal('\n==================== Deploy Skill Infrastructure ====================');
                    expect(infoStub.args[7][0]).equal('Skill infrastructures deployed successfully through @ask-cli/cfn-deployer.');
                    expect(warnStub.callCount).equal(0);
                    expect(helper.enableSkill.calledOnce).equal(true);
                    done();
                });
            });
        });

        describe('command handle - enable skill', () => {
            const TEST_CODE_BUILD_RESULT = [{
                src: 'codeSrc',
                build: {
                    file: 'buildFile',
                    folder: 'buildFolder'
                },
                buildFlow: 'build-flow',
                regionsList: ['default', 'NA']
            }];

            beforeEach(() => {
                sinon.stub(fse, 'existsSync').returns(true);
            });

            it('| can callbcak warn when enable fails with CliWarn class', (done) => {
                // setup
                const TEST_WARN = new CliWarn('warn');
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(3);
                sinon.stub(helper, 'enableSkill').callsArgWith(2, TEST_WARN);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(warnStub.args[0][0]).equal(TEST_WARN);
                    expect(err).equal(undefined);
                    done();
                });
            });

            it('| can callbcak error when enable fails', (done) => {
                // setup
                const TEST_ERROR = 'error';
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(1);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(3);
                sinon.stub(helper, 'enableSkill').callsArgWith(2, 'error');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(err).equal(TEST_ERROR);
                    done();
                });
            });
        });
    });
});
