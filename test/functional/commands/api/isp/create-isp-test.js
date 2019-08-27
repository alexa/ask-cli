const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api create-isp', () => {
    const operation = 'create-isp';
    const TEST_COMMAND_PREFIX = 'ask api';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_VALID_PROFILE = ApiCommandBasicTest.testDataProvider.VALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_VALID_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.VALID_PROFILE_TOKEN;
    const TEST_ENV_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.ENV_PROFILE_TOKEN;
    const TEST_DEFAULT_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.DEFAULT_VENDOR_ID;
    const TEST_ENV_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.ENV_VENDOR_ID;
    const TEST_VALID_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.VALID_VENDOR_ID;
    const TEST_FILE_PATH = path.join(process.cwd(), 'test', 'functional', 'fixture', 'manifest.json');
    const TEST_FILE_CONTENT = JSON.parse(fs.readFileSync(TEST_FILE_PATH, 'utf-8'));
    const TEST_HTTP_RESPONSE_BODY = { productId: '123' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';

    const createIspRequestOptions = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/`,
        method: CONSTANTS.HTTP_REQUEST.VERB.POST,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: {
            vendorId: TEST_DEFAULT_VENDOR_ID,
            inSkillProductDefinition: TEST_FILE_CONTENT
        },
        json: true
    };
    const createIspRequestOptionsForEnvVar = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/`,
        method: CONSTANTS.HTTP_REQUEST.VERB.POST,
        headers: { authorization: TEST_ENV_PROFILE_TOKEN },
        body: {
            vendorId: TEST_ENV_VENDOR_ID,
            inSkillProductDefinition: TEST_FILE_CONTENT
        },
        json: true
    };
    const createIspRequestOptionsForValidProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/`,
        method: CONSTANTS.HTTP_REQUEST.VERB.POST,
        headers: { authorization: TEST_VALID_PROFILE_TOKEN },
        body: {
            vendorId: TEST_VALID_VENDOR_ID,
            inSkillProductDefinition: TEST_FILE_CONTENT
        },
        json: true
    };

    it('| print error when file is not provided', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: file. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -f ${TEST_FILE_PATH} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when file does not exist', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -f invalid.path`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: file. File does not exist with the given path.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set to default ', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createIspRequestOptions, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set by env variable', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -f ${TEST_FILE_PATH}`;
        const envVar = {
            AWS_ACCESS_KEY_ID: 1,
            AWS_SECRET_ACCESS_KEY: 2,
            ASK_REFRESH_TOKEN: 3,
            ASK_VENDOR_ID: TEST_ENV_VENDOR_ID
        };
        const httpMockConfig = [{
            input: [createIspRequestOptionsForEnvVar, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set by valid input', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -f ${TEST_FILE_PATH} -p ${TEST_VALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createIspRequestOptionsForValidProfile, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', (done) => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createIspRequestOptions, operation],
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
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createIspRequestOptions, operation],
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
