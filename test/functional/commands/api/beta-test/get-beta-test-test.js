const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-beta-test', () => {
    const operation = 'get-beta-test';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_SKILL_ID = 'skillId';
    const GET_BETA_TEST_COMMAND = `ask api ${operation}`;
    const EMPTY_BODY = {};
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const headers = {
        authorization: TEST_DEFAULT_PROFILE_TOKEN
    };

    function getGetBetaTestRequestOptions() {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/betaTest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers,
            body: EMPTY_BODY,
            json: true
        };
    }

    it('| print error if skill-id is not provided', async () => {
        const cmd = GET_BETA_TEST_COMMAND;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input is an invalid profile', async () => {
        const cmd = `${GET_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, when valid skill Id is provided', async () => {
        const inputOptions = getGetBetaTestRequestOptions();
        const cmd = `${GET_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 200, body: EMPTY_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString(EMPTY_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', async () => {
        const inputOptions = getGetBetaTestRequestOptions();
        const cmd = `${GET_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with status code >= 300', async () => {
        const inputOptions = getGetBetaTestRequestOptions();
        const cmd = `${GET_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
