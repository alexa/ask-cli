const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-isp', () => {
    const operation = 'get-isp';
    const TEST_COMMAND_PREFIX = 'ask api';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFINITION_RESPONSE = 'definition';
    const TEST_SUMMARY_RESPONSE = 'summary';
    const TEST_HTTP_RESPONSE_BODY = { inSkillProductDefinition: TEST_DEFINITION_RESPONSE };
    const TEST_HTTP_RESPONSE_BODY_WITH_SUMMARY = { inSkillProductSummary: TEST_SUMMARY_RESPONSE };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_ISP_ID = '456';
    const TEST_ETAG = 'etag';

    const getIspRequestOptions = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${TEST_ISP_ID}/stages/development`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };

    const getIspSummaryRequestOptions = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${TEST_ISP_ID}/stages/development/summary`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };

    const getIspRequestOptionsWithLiveStage = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${TEST_ISP_ID}/stages/live`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };

    it('| print error when isp-id is not provided', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -g development`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: isp-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when stage is not provided', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when stage is not valid', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g test`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set to default and without summary option', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getIspRequestOptions, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY, headers: { etag: TEST_ETAG } }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.warn).equal(`Etag: ${TEST_ETAG}`);
            expect(msgCatcher.info).equal(jsonView.toString(TEST_DEFINITION_RESPONSE));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response with live stage option and without summary option', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g live`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getIspRequestOptionsWithLiveStage, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY, headers: { etag: TEST_ETAG } }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.warn).equal(`Etag: ${TEST_ETAG}`);
            expect(msgCatcher.info).equal(jsonView.toString(TEST_DEFINITION_RESPONSE));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error without summary option', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getIspRequestOptions, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with status code >= 300 without summary option', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getIspRequestOptions, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set to default and with summary option', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development --summary`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getIspSummaryRequestOptions, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY_WITH_SUMMARY, headers: { etag: TEST_ETAG } }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.warn).equal(`Etag: ${TEST_ETAG}`);
            expect(msgCatcher.info).equal(jsonView.toString(TEST_SUMMARY_RESPONSE));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error with summary option', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development --summary`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getIspSummaryRequestOptions, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with status code >= 300 with summary option', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development --summary`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getIspSummaryRequestOptions, operation],
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
