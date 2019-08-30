const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');

const DeployCommand = require('@src/commands/deploy');
const helper = require('@src/commands/deploy/helper');
const optionModel = require('@src/commands/option-model');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');

describe('Commands deploy test - command class test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'resources-config.json');

    const TEST_PROFILE = 'default';
    const TEST_DEBUG = false;

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
        expect(instance.optionalOptions()).deep.equal(['profile', 'debug']);
    });

    describe('validate command handle', () => {
        const TEST_CMD = {
            profile: TEST_PROFILE,
            debug: TEST_DEBUG
        };
        let instance;
        beforeEach(() => {
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(path, 'join').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
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
                path.join.returns('invalidPath');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('File invalidPath not exists.');
                    expect(errorStub.args[0][0].message).equal('File invalidPath not exists.');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
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

            it('| when Manifest initiation fails, expect throw error', (done) => {
                // setup
                sinon.stub(stringUtils, 'isNonBlankString').returns(true);
                path.join.withArgs('./skillPackage', CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST).returns('invalidPath');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('File invalidPath not exists.');
                    expect(errorStub.args[0][0].message).equal('File invalidPath not exists.');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - deploy skill metadata', () => {
            it('| helper deploy skill metadata fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(2, 'error');
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
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(2,
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
        });

        describe('command handle - build skill code', () => {
            it('| helper build skill code fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(2);
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

            it('| helper deploy skill infra without infraType, expect skip the flow by calling back', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(2);
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

            it('| helper deploy skill infra fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(2);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(2, 'error');
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

            it('| deploy skill all pass, expect deploy succeeds and enbalSkill get called', (done) => {
                // setup
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(2);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(2);
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

            it('| can callbcak error when enable fails', (done) => {
                // setup
                const TEST_ERROR = 'error';
                sinon.stub(helper, 'deploySkillMetadata').callsArgWith(2);
                sinon.stub(helper, 'buildSkillCode').callsArgWith(2, null, TEST_CODE_BUILD_RESULT);
                sinon.stub(helper, 'deploySkillInfrastructure').callsArgWith(2);
                sinon.stub(helper, 'enableSkill').callsArgWith(2, 'error');
                instance.handle(TEST_CMD, (err) => {
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(err).equal(TEST_ERROR);
                    done();
                });
            });
        });
    });
});
