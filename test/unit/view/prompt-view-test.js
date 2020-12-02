const { expect } = require('chai');
const fs = require('fs');
const inquirer = require('inquirer');
const sinon = require('sinon');

const Messenger = require('@src/view/messenger');
const ui = require('@src/view/prompt-view');

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
describe('View test - prompt view test', () => {
    const TEST_ERROR = 'init error';
    let infoStub;
    let accessSyncStub;

    describe('# validate ui.getProjectFolderName', () => {
        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(inquirer, 'prompt');
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            accessSyncStub = sinon.stub(fs, 'accessSync');
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
        it('| user does not have read/write to project folder, expect return error message string', (done) => {
            // setup
            const TEST_DEFAULT_NAME = 'some-folder';
            inquirer.prompt.resolves({ projectFolderName: TEST_DEFAULT_NAME });
            accessSyncStub.throws('Some error');
            // call
            ui.getProjectFolderName(TEST_DEFAULT_NAME, () => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate(TEST_DEFAULT_NAME))
                    .include('No write access inside of the folder');
                done();
            });
        });
    });
});
