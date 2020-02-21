const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-certification', () => {
    const operation = 'get-certification';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_CERTIFICATION_ID = 'TEST_CERTIFICATION_ID';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'TEST_RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'TEST_ERROR_MESSAGE';
    const TEST_ACCEPT_LANGUAGE = 'en-US';

    function createGetCertificationRequestOptions(profileToken, acceptLanguage) {
        const options = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/certifications/${TEST_CERTIFICATION_ID}`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: profileToken },
            json: false,
            body: null
        };
        if (acceptLanguage) {
            options.headers['Accept-Language'] = acceptLanguage;
        }
        return options;
    }

    it('| print error when skill-id is not provided', async () => {
        const cmd = 'ask api get-certification';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when certification-id is not provided', async () => {
        const cmd = `ask api get-certification -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: certification-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when invalid accept-language is not provided', async () => {
        const cmd = `ask api get-certification -s ${TEST_SKILL_ID} -c ${TEST_CERTIFICATION_ID} --accept-language invalid-language`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: accept-language. Value must be in (en-US, ja-JP).');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `ask api get-certification -s ${TEST_SKILL_ID} -c ${TEST_CERTIFICATION_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };
        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response with acceptLanguage option', async () => {
        const cmd = `ask api get-certification -s ${TEST_SKILL_ID} -c ${TEST_CERTIFICATION_ID} --accept-language ${TEST_ACCEPT_LANGUAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createGetCertificationRequestOptions(TEST_DEFAULT_PROFILE_TOKEN, TEST_ACCEPT_LANGUAGE), operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response without acceptLanguage option', async () => {
        const cmd = `ask api get-certification -s ${TEST_SKILL_ID} -c ${TEST_CERTIFICATION_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createGetCertificationRequestOptions(TEST_DEFAULT_PROFILE_TOKEN, null), operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', async () => {
        const cmd = `ask api get-certification -s ${TEST_SKILL_ID} -c ${TEST_CERTIFICATION_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createGetCertificationRequestOptions(TEST_DEFAULT_PROFILE_TOKEN, null), operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with status code >= 300', async () => {
        const cmd = `ask api get-certification -s ${TEST_SKILL_ID} -c ${TEST_CERTIFICATION_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createGetCertificationRequestOptions(TEST_DEFAULT_PROFILE_TOKEN, null), operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
