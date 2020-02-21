const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-catalog', () => {
    const operation = 'get-catalog';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_CATALOG_ID = 'CATALOG_ID';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';

    const requestOptionsWithDefaultProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs/${TEST_CATALOG_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };

    it('| print error when catalog-id is not provided', async () => {
        const cmd = 'ask api get-catalog';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: catalog-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `ask api get-catalog --catalog-id ${TEST_CATALOG_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };
        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set to default ', async () => {
        const cmd = `ask api get-catalog --catalog-id ${TEST_CATALOG_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).include(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle http request error', async () => {
        const cmd = `ask api get-catalog --catalog-id ${TEST_CATALOG_ID}`;
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
        const cmd = `ask api get-catalog --catalog-id ${TEST_CATALOG_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).include(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle SMAPI response with status code >= 300', async () => {
        const cmd = `ask api get-catalog --catalog-id ${TEST_CATALOG_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).include(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
