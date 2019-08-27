const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api rest-isp-entitlement', () => {
    const operation = 'reset-isp-entitlement';
    const TEST_COMMAND_PREFIX = 'ask api';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_HTTP_RESPONSE_BODY = { content: 'TEST' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_ISP_ID = '456';

    const updateIspRequestOptions = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${TEST_ISP_ID}/stages/development/entitlement`,
        method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const updateIspRequestOptionsWithLiveStage = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${TEST_ISP_ID}/stages/live/entitlement`,
        method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };

    it('| print error when isp-id is not provided', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: isp-id. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set to default ', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptions, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(`Succeeded to reset the entitlement of in-skill product ${TEST_ISP_ID}`);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when stage is not valid', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g test`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error with live stage option ', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g live`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptionsWithLiveStage, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('Only supported value for stage option is development.');
            expect(msgCatcher.info).equal('');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptions, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with status code >= 300', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptions, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
