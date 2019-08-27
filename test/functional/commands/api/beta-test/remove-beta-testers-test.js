const { expect } = require('chai');
const path = require('path');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api remove-beta-testers', () => {
    const operation = 'remove-beta-testers';
    const TEST_CLI_CMD = `ask api ${operation}`;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_INVALID_FILE_EXTENSION = path.join(process.cwd(), 'test', 'functional', 'fixture', 'interaction-model.json');
    const TEST_FILE_PATH = path.join(process.cwd(), 'test', 'functional', 'fixture', 'beta-testers.csv');
    const TESTERS = [{ emailId: 'test@amazon.com' }];
    const REMOVE_BETA_TESTERS_SUCCESS_MESSAGE = 'Beta testers removed successfully.';
    const VALID_FILE_EXTENSION_TYPE = '.csv';
    const EMPTY_BODY = {};

    // request options test object for traverse mode
    function createRemoveBetaTestersRequestOptions() {
        const url = `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest/testers/remove`;

        return {
            url,
            method: CONSTANTS.HTTP_REQUEST.VERB.POST,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: { testers: TESTERS },
            json: true
        };
    }

    describe('# remove-beta-testers with any option will make direct api request', () => {

        it('| print error when --skill-id is not provided', (done) => {
            const cmd = TEST_CLI_CMD;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when --file is not provided', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: file. Field is required and must be set.');
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when file type is invalid', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} -f ${TEST_INVALID_FILE_EXTENSION}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal(`Please provide valid input for option: file. File extension is not of type ${VALID_FILE_EXTENSION_TYPE}.`);
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when profile is invalid', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} -p ${TEST_INVALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| can get correct http response, when valid skill Id and file path are provided', (done) => {
            const inputOptions = createRemoveBetaTestersRequestOptions();
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [inputOptions, operation],
                output: [null, { statusCode: 200, body: EMPTY_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.info).equal(REMOVE_BETA_TESTERS_SUCCESS_MESSAGE);
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| can handle http response with status code >= 300', (done) => {
            const inputOptions = createRemoveBetaTestersRequestOptions();
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [inputOptions, operation],
                output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
