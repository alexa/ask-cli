const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-account-linking', () => {
    const operation = 'get-account-linking';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_VALID_PROFILE = ApiCommandBasicTest.testDataProvider.VALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_VALID_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.VALID_PROFILE_TOKEN;
    const TEST_ENV_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.ENV_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'SKILL_ID';
    const TEST_DEVELOPMENT_STAGE = CONSTANTS.SKILL.STAGE.DEVELOPMENT;
    const TEST_INVALID_STAGE = 'INVALID_STAGE';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';

    const requestOptionsWithDefaultProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/accountLinkingClient`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const requestOptionsWithEnvVarProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/accountLinkingClient`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_ENV_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const requestOptionsWithValidProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/accountLinkingClient`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_VALID_PROFILE_TOKEN },
        body: null,
        json: false
    };

    it('| print error when skill-id is not provided', async () => {
        const cmd = 'ask api get-account-linking';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).includes('Please provide valid input for option: skill-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `ask api get-account-linking -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input stage is invalid', async () => {
        const cmd = `ask api get-account-linking -s ${TEST_SKILL_ID} -g ${TEST_INVALID_STAGE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).include('Please provide valid input for option: stage. Value must be in (development, live, certification).');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set to default ', async () => {
        const cmd = `ask api get-account-linking -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set by env variable', async () => {
        const cmd = `ask api get-account-linking -s ${TEST_SKILL_ID}`;
        const envVar = {
            AWS_ACCESS_KEY_ID: 1,
            AWS_SECRET_ACCESS_KEY: 2,
            ASK_REFRESH_TOKEN: 3,
            ASK_VENDOR_ID: 4
        };
        const httpMockConfig = [{
            input: [requestOptionsWithEnvVarProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set by valid input', async () => {
        const cmd = `ask api get-account-linking -s ${TEST_SKILL_ID} -p ${TEST_VALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithValidProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle http request error', async () => {
        const cmd = `ask api get-account-linking -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle SMAPI response with status code < 300', async () => {
        const cmd = `ask api get-account-linking -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle SMAPI response with status code >= 300', async () => {
        const cmd = `ask api get-account-linking -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
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
