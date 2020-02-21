const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api update-isp', () => {
    const operation = 'update-isp';
    const TEST_COMMAND_PREFIX = 'ask api';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_FILE_PATH = path.join(process.cwd(), 'test', 'functional', 'fixture', 'manifest.json');
    const TEST_FILE_CONTENT = JSON.parse(fs.readFileSync(TEST_FILE_PATH, 'utf-8'));
    const TEST_HTTP_RESPONSE_BODY = { content: 'TEST' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_ISP_ID = '456';
    const TEST_ETAG = 'etag';

    const updateIspRequestOptions = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${TEST_ISP_ID}/stages/development`,
        method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: {
            inSkillProductDefinition: TEST_FILE_CONTENT
        },
        json: true
    };
    const updateIspRequestOptionsWithEtag = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${TEST_ISP_ID}/stages/development`,
        method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
        headers: {
            authorization: TEST_DEFAULT_PROFILE_TOKEN,
            'If-Match': TEST_ETAG
        },
        body: {
            inSkillProductDefinition: TEST_FILE_CONTENT
        },
        json: true
    };
    const updateIspRequestOptionsWithLiveStage = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${TEST_ISP_ID}/stages/live`,
        method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: {
            inSkillProductDefinition: TEST_FILE_CONTENT
        },
        json: true
    };

    it('| print error when file is not provided', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: file. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when isp-id is not provided', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: isp-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -f ${TEST_FILE_PATH} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set to default ', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptions, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal('Succeeded to update in-skill product 456');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response with etag option ', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -f ${TEST_FILE_PATH} --etag ${TEST_ETAG}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptionsWithEtag, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal('Succeeded to update in-skill product 456');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when stage is not valid', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -f ${TEST_FILE_PATH} -g test`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error with live stage option ', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -f ${TEST_FILE_PATH} -g live`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptionsWithLiveStage, operation],
            output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('Only supported value for stage option is development.');
            expect(msgCatcher.info).equal('');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptions, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with status code >= 300', async () => {
        const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [updateIspRequestOptions, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
