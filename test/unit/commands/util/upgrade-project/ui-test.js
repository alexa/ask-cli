const { expect } = require('chai');
const inquirer = require('inquirer');
const path = require('path');
const sinon = require('sinon');

const Messenger = require('@src/view/messenger');
const CONSTANTS = require('@src/utils/constants');

const ui = require('@src/commands/util/upgrade-project/ui');

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

describe('Commands upgrade-project test - UI test', () => {
    const TEST_ERROR = 'upgrade-project error';
    const TEST_REGION = 'default';
    const TEST_REGION_NA = 'NA';
    const TEST_CODE_URI = 'codeUri';
    const TEST_V2_CODE_URI = `${CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA}/${TEST_CODE_URI}`;
    const TEST_RUNTIME = 'runtime';
    const TEST_HANDLER = 'handler';
    const TEST_REVISION_ID = 'revisionId';
    const TEST_ARN = 'arn:aws:lambda:us-west-2:123456789012:function:ask-custom-skill-sample-nodejs-fact-default';

    new Messenger({});
    let infoStub;

    describe('# validate ui.displayPreview', () => {
        const TEST_SKILL_ID = 'skillId';
        const TEST_UPDATE_PREVIEW_PART_1 = `Preview of the upgrade result from v1 to v2:
- The original v1 skill project will be entirely moved to .${path.sep}${CONSTANTS.FILE_PATH.LEGACY_PATH}${path.sep}
- JSON files for Skill ID ${TEST_SKILL_ID} (such as skill.json) will be moved to .${path.sep}${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE}${path.sep}
`;

        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| Preview hosted skill project display', () => {
            // setup
            const TEST_USER_INPUT = {
                skillId: TEST_SKILL_ID,
                isHosted: true
            };
            const TEST_PART_2 = `- Existing Lambda codebase will be moved into "${CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA}" folder`;
            // call
            ui.displayPreview(TEST_USER_INPUT);
            // verify
            expect(infoStub.args[0][0]).equal(TEST_UPDATE_PREVIEW_PART_1 + TEST_PART_2);
        });

        it('| Preview no lambda project display', () => {
            // setup
            const TEST_USER_INPUT = {
                skillId: TEST_SKILL_ID,
                isHosted: false
            };
            const TEST_PART_2 = '- No existing Lambda in the v1 "lambda" resource thus no action for Lambda codebase.';
            // call
            ui.displayPreview(TEST_USER_INPUT);
            // verify
            expect(infoStub.args[0][0]).equal(TEST_UPDATE_PREVIEW_PART_1 + TEST_PART_2);
        });

        it('| Preview multiple regions project display', () => {
            // setup
            const TEST_USER_INPUT = {
                skillId: TEST_SKILL_ID,
                isHosted: false,
                lambdaResources: {
                    [TEST_REGION]: {
                        arn: TEST_ARN,
                        codeUri: TEST_CODE_URI,
                        runtime: TEST_RUNTIME,
                        handler: TEST_HANDLER,
                        v2CodeUri: `.${path.sep}${TEST_V2_CODE_URI}`,
                        revisionId: TEST_REVISION_ID
                    },
                    [TEST_REGION_NA]: {
                        codeUri: TEST_CODE_URI,
                        runtime: TEST_RUNTIME,
                        handler: TEST_HANDLER,
                        v2CodeUri: `.${path.sep}${TEST_V2_CODE_URI}`,
                        revisionId: TEST_REVISION_ID
                    }
                }
            };
            const TEST_PART_2 = `- Existing Lambda codebase will be moved into "${CONSTANTS.FILE_PATH.SKILL_CODE.LAMBDA}" folder`;
            const TEST_PART_2_1 = `\n  - Region ${TEST_REGION}: v1 "${TEST_CODE_URI}"\
 -> v2 ".${path.sep}${TEST_V2_CODE_URI}" for existing Lambda ARN ${TEST_ARN}`;
            const TEST_PART_2_2 = `\n  - Region ${TEST_REGION_NA}: v1 "${TEST_CODE_URI}"\
 -> v2 ".${path.sep}${TEST_V2_CODE_URI}" and will create new Lambda`;
            // call
            ui.displayPreview(TEST_USER_INPUT);
            // verify
            expect(infoStub.args[0][0]).equal(TEST_UPDATE_PREVIEW_PART_1 + TEST_PART_2 + TEST_PART_2_1 + TEST_PART_2_2);
        });
    });

    describe('# validate ui.displayPreview', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| confirm preview from user but error happens', (done) => {
            // setup
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.confirmPreview((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0], {
                    message: 'Do you want to execute the upgrade based on the preview above? ',
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
            inquirer.prompt.resolves({ confirmPreview: true });
            // call
            ui.confirmPreview((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0], {
                    message: 'Do you want to execute the upgrade based on the preview above? ',
                    type: 'confirm',
                    default: true,
                });
                expect(err).equal(null);
                expect(response).equal(true);
                done();
            });
        });
    });
});
