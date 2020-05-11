const { expect } = require('chai');
const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');
const sinon = require('sinon');

const CONSTANTS = require('@src/utils/constants');
const Messenger = require('@src/view/messenger');
const JsonView = require('@src/view/json-view');

const ui = require('@src/commands/init/ui');

function validateInquirerConfig(stub, expectedConfig) {
    const { message, type, defaultValue, choices } = expectedConfig;
    expect(stub.message).equal(message);
    expect(stub.type).equal(type);
    if (defaultValue) {
        expect(stub.default).equal(defaultValue);
    }
    if (choices) {
        expect(stub.choices).deep.equal(choices);
    }
}

describe('Commands init - UI test', () => {
    const TEST_PROFILE = 'profile';
    const TEST_ERROR = 'init error';

    new Messenger({});
    let infoStub;

    describe('# validate ui.showInitInstruction', () => {
        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| showInitInstruction display by messenger info', () => {
            // call
            ui.showInitInstruction(TEST_PROFILE);
            // verify
            expect(infoStub.args[0][0].includes(TEST_PROFILE)).equal(true);
        });
    });

    describe('# validate ui.confirmOverwrite', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| confirm overwrite from user but error happens', (done) => {
            // setup
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.confirmOverwrite((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: `${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG} already exists in current directory. Do you want to overwrite it? `,
                    type: 'confirm',
                    default: true,
                });
                expect(err.name).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| confirm overwrite from user inputs', (done) => {
            // setup
            inquirer.prompt.resolves({ isOverwriteConfirmed: true });
            // call
            ui.confirmOverwrite((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).equal(true);
                done();
            });
        });
    });

    describe('# validate ui.getSkillId', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| get skillId but error happens', (done) => {
            // setup
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.getSkillId((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Skill Id (leave empty to create one): ',
                    type: 'input',
                    name: 'skillId'
                });
                expect(err.name).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| get skillId with user input succeeds', (done) => {
            // setup
            inquirer.prompt.resolves({ skillId: '  skill  ' });
            // call
            ui.getSkillId((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).equal('skill');
                done();
            });
        });
    });

    describe('# validate ui.getSkillMetaSrc', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| get skillMeta src but error happens', (done) => {
            // setup
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.getSkillMetaSrc((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Skill package path: ',
                    type: 'input',
                    default: './skill-package',
                });
                expect(err.name).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| get skillMeta src with user input succeeds', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
            inquirer.prompt.resolves({ skillMetaSrc: 'src' });
            // call
            ui.getSkillMetaSrc((err, response) => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('src')).equal(true);
                expect(err).equal(null);
                expect(response).equal('src');
                done();
            });
        });

        it('| check the validate logic from inquirer and path is empty', (done) => {
            // setup
            inquirer.prompt.resolves({ skillMetaSrc: 'src' });
            // call
            ui.getSkillMetaSrc(() => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('    '))
                    .equal('Path for skill package cannot be empty.');
                done();
            });
        });

        it('| check the validate logic from inquirer and file does not exist', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(false);
            inquirer.prompt.resolves({ skillMetaSrc: 'src' });
            // call
            ui.getSkillMetaSrc(() => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('path'))
                    .equal('File path does not exist.');
                done();
            });
        });
    });

    describe('# validate ui.getCodeSrcForRegion', () => {
        const TEST_REGION = 'region';

        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| ask for code source but error happens', (done) => {
            // setup
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.getCodeSrcForRegion(TEST_REGION, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: `Lambda code path for ${TEST_REGION} region (leave empty to not deploy Lambda): `,
                    type: 'input',
                    default: './lambda',
                });
                expect(err.name).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| ask for code source and succeeds', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
            inquirer.prompt.resolves({ skillCodeSrc: 'src' });
            // call
            ui.getCodeSrcForRegion(TEST_REGION, (err, response) => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('src')).equal(true);
                expect(err).equal(null);
                expect(response).equal('src');
                done();
            });
        });

        it('| ask for code source and file path not exists', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(false);
            inquirer.prompt.resolves({ skillCodeSrc: 'src' });
            // call
            ui.getCodeSrcForRegion(TEST_REGION, () => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('path'))
                    .equal('File path does not exist.');
                done();
            });
        });
    });

    describe('# validate ui.getSkillInfra', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| get skillInfra but error happens', (done) => {
            // setup
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.getSkillInfra((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Use AWS CloudFormation to deploy Lambda? ',
                    type: 'confirm',
                    default: true,
                });
                validateInquirerConfig(inquirer.prompt.args[0][0][1], {
                    message: 'Lambda runtime: ',
                    type: 'input',
                    default: 'nodejs10.x',
                });
                validateInquirerConfig(inquirer.prompt.args[0][0][2], {
                    message: 'Lambda handler: ',
                    type: 'input',
                    default: 'index.handler',
                });
                expect(err.name).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| get skillInfra with user input succeeds', (done) => {
            // setup
            const TEST_ANSWER = {
                isUsingCfn: true,
                runtime: 'runtime',
                handler: 'handler'
            };
            inquirer.prompt.resolves(TEST_ANSWER);
            // call
            ui.getSkillInfra((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).deep.equal(TEST_ANSWER);
                done();
            });
        });
    });

    describe('# validate ui.showPreviewAndConfirm', () => {
        const TEST_ROOT_PATH = 'root';
        const TEST_ASK_RESOURCES_JSON = 'resources json';
        const TEST_ASK_STATES_JSON = 'states json';
        const TEST_ASK_RESOURCES = 'resources';
        const TEST_ASK_STATES = 'states';
        const TEST_RESOURCES_COFNIG = {
            askResources: TEST_ASK_RESOURCES,
            askStates: TEST_ASK_STATES
        };

        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            sinon.stub(inquirer, 'prompt');
            sinon.stub(JsonView, 'toString');
            JsonView.toString.withArgs(TEST_ASK_RESOURCES).returns(TEST_ASK_RESOURCES_JSON);
            JsonView.toString.withArgs(TEST_ASK_STATES).returns(TEST_ASK_STATES_JSON);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| show preview and ask for confirm but error happens', (done) => {
            // setup
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.showPreviewAndConfirm(TEST_ROOT_PATH, TEST_RESOURCES_COFNIG, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Does this look correct? ',
                    type: 'confirm',
                    default: true,
                });
                expect(infoStub.args[0][0]).equal(`
Writing to ${path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG)}:
${TEST_ASK_RESOURCES_JSON}

Writing to ${path.join(TEST_ROOT_PATH, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, CONSTANTS.FILE_PATH.ASK_STATES_JSON_CONFIG)}:
${TEST_ASK_STATES_JSON}
`);
                expect(err.name).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| show preview and ask for confirm with user input succeeds', (done) => {
            // setup
            inquirer.prompt.resolves({ confirmPreview: true });
            // call
            ui.showPreviewAndConfirm(TEST_ROOT_PATH, TEST_RESOURCES_COFNIG, (err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).equal(true);
                done();
            });
        });
    });

    describe('# validate ui.getProjectFolderName', () => {
        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(inquirer, 'prompt');
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| confirm project folder name from user fails, expect error thrown', (done) => {
            // setup
            const TEST_DEFAULT_NAME = 'TEST_DEFAULT_NAME';
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.getProjectFolderName(TEST_DEFAULT_NAME, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please type in your folder name for the skill project (alphanumeric): ',
                    type: 'input',
                    default: TEST_DEFAULT_NAME,
                });
                expect(err.name).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| confirm project folder name from user', (done) => {
            // setup
            const TEST_DEFAULT_NAME = 'HOSTED-SKILL_NAME@';
            const TEST_FILTERED_NAME = 'HOSTEDSKILLNAME';
            inquirer.prompt.resolves({ projectFolderName: TEST_FILTERED_NAME });
            // call
            ui.getProjectFolderName(TEST_DEFAULT_NAME, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please type in your folder name for the skill project (alphanumeric): ',
                    type: 'input',
                    default: TEST_DEFAULT_NAME,
                    name: 'projectFolderName',
                });
                expect(err).equal(null);
                expect(response).equal(TEST_FILTERED_NAME);
                done();
            });
        });

        it('| project folder name from user with NonAlphanumeric filter is empty, expect error thrown', (done) => {
            // setup
            const TEST_DEFAULT_NAME = 'HOSTED-SKILL_NAME@';
            inquirer.prompt.resolves({ projectFolderName: TEST_DEFAULT_NAME });
            // call
            ui.getProjectFolderName(TEST_DEFAULT_NAME, () => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate(TEST_DEFAULT_NAME)).equal(true);
                done();
            });
        });

        it('| project folder name from user with NonAlphanumeric filter is valid, expect return true', (done) => {
            // setup
            const TEST_DEFAULT_NAME = '@_@';
            const TEST_EMPTY_ERROR = 'Project folder name should consist of alphanumeric character(s) plus "-" only.';
            inquirer.prompt.resolves({ projectFolderName: TEST_DEFAULT_NAME });
            // call
            ui.getProjectFolderName(TEST_DEFAULT_NAME, () => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate(TEST_DEFAULT_NAME))
                    .equal(TEST_EMPTY_ERROR);
                done();
            });
        });
    });
});
