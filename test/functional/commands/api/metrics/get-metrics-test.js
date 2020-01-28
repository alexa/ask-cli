const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-metrics', () => {
    const operation = 'get-metrics';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_VALID_PROFILE = ApiCommandBasicTest.testDataProvider.VALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_VALID_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.VALID_PROFILE_TOKEN;
    const TEST_ENV_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.ENV_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_START_TIME = 'TEST_START_TIME';
    const TEST_END_TIME = 'TEST_END_TIME';
    const TEST_PERIOD = 'SINGLE';
    const TEST_METRIC = 'uniqueCustomers';
    const TEST_DEVELOPMENT_STAGE = CONSTANTS.SKILL.STAGE.DEVELOPMENT;
    const TEST_SKILL_TYPE = 'custom';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'TEST_RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'TEST_ERROR_MESSAGE';

    const requestOptionsWithDefaultProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}`
        + `&endTime=${TEST_END_TIME}&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_DEVELOPMENT_STAGE}&skillType=${TEST_SKILL_TYPE}`
        + `&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const requestOptionsWithEnvVarProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}`
        + `&endTime=${TEST_END_TIME}&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_DEVELOPMENT_STAGE}&skillType=${TEST_SKILL_TYPE}`
        + `&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_ENV_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const requestOptionsWithValidProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}`
        + `&endTime=${TEST_END_TIME}&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_DEVELOPMENT_STAGE}&skillType=${TEST_SKILL_TYPE}`
        + `&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_VALID_PROFILE_TOKEN },
        body: null,
        json: false
    };

    it('| print error when skill-id is not provided', (done) => {
        const cmd = 'ask api get-metrics';
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

    it('| print error when start-time is not provided', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: start-time. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when end-time is not provided', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: end-time. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when period is not provided', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: period. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when metric is not provided', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: metric. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when stage is not provided', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when skill-type is not provided', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC} --stage ${TEST_DEVELOPMENT_STAGE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-type. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC} --stage ${TEST_DEVELOPMENT_STAGE} --skill-type ${TEST_SKILL_TYPE}`
        + ` -p ${TEST_INVALID_PROFILE}`;
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

    it('| can get correct http response when profile is set to default ', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC} --stage ${TEST_DEVELOPMENT_STAGE} --skill-type ${TEST_SKILL_TYPE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set by env variable', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC} --stage ${TEST_DEVELOPMENT_STAGE} --skill-type ${TEST_SKILL_TYPE}`;
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
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set by valid input', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC} --stage ${TEST_DEVELOPMENT_STAGE} --skill-type ${TEST_SKILL_TYPE}`
        + ` -p ${TEST_VALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithValidProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle http request error', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC} --stage ${TEST_DEVELOPMENT_STAGE} --skill-type ${TEST_SKILL_TYPE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle SMAPI response with status code < 300', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC} --stage ${TEST_DEVELOPMENT_STAGE} --skill-type ${TEST_SKILL_TYPE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle SMAPI response with status code >= 300', (done) => {
        const cmd = `ask api get-metrics --skill-id ${TEST_SKILL_ID} --start-time ${TEST_START_TIME} --end-time ${TEST_END_TIME}`
        + ` --period ${TEST_PERIOD} --metric ${TEST_METRIC} --stage ${TEST_DEVELOPMENT_STAGE} --skill-type ${TEST_SKILL_TYPE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
