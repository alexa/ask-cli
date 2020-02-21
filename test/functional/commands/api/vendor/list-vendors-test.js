const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-vendors', () => {
    const operation = 'list-vendors';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_VALID_PROFILE = ApiCommandBasicTest.testDataProvider.VALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_VALID_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.VALID_PROFILE_TOKEN;
    const TEST_ENV_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.ENV_PROFILE_TOKEN;
    const TEST_ENV_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.ENV_VENDOR_ID;
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'TEST_RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'TEST_ERROR_MESSAGE';

    const defaultRequestOption = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/vendors`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const requestOptionWithValidProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/vendors`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_VALID_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const requestOptionWithEnvVarProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/vendors`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_ENV_PROFILE_TOKEN },
        body: null,
        json: false
    };

    it('| Can get correct http response when profile is set to default ', async () => {
        const cmd = 'ask api list-vendors';
        const envVar = {};
        const httpMockConfig = [{
            input: [defaultRequestOption, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| Can get correct response when profile is set by valid user input', async () => {
        const cmd = `ask api list-vendors -p ${TEST_VALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionWithValidProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| Can get correct response when when profile is set by env variable', async () => {
        const cmd = 'ask api list-vendors';
        const envVar = {
            AWS_ACCESS_KEY_ID: 1,
            AWS_SECRET_ACCESS_KEY: 2,
            ASK_REFRESH_TOKEN: 3,
            ASK_VENDOR_ID: TEST_ENV_VENDOR_ID
        };
        const httpMockConfig = [{
            input: [requestOptionWithEnvVarProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| httpClient can print error when user input invalid profile', async () => {
        const cmd = `ask api list-vendors -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| Can get correct response when profile is set to default', async () => {
        const cmd = 'ask api list-vendors';
        const envVar = {};
        const httpMockConfig = [{
            input: [defaultRequestOption, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| Can print error message when httpClient return error', async () => {
        const cmd = 'ask api list-vendors';
        const envVar = {};
        const httpMockConfig = [{
            input: [defaultRequestOption, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| Can print correct error message when httpClient response has status code >= 300', async () => {
        const cmd = 'ask api list-vendors';
        const envVar = {};
        const httpMockConfig = [{
            input: [defaultRequestOption, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
