const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-validation', () => {
    const operation = 'get-validation';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_STAGE = 'live';
    const TEST_VALIDATION_ID = 'TEST_VALIDATION_ID';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'TEST_RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'TEST_ERROR_MESSAGE';

    function createGetValidationRequestOptions(stage, profileToken) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/`
            + `${TEST_SKILL_ID}/stages/${stage}/validations/${TEST_VALIDATION_ID}`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: profileToken },
            json: false,
            body: null
        };
    }

    it('| print error when skill-id is not provided', (done) => {
        const cmd = 'ask api get-validation';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when validation-id is not provided', (done) => {
        const cmd = `ask api get-validation -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: validation-id. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when invalid stage is provided', (done) => {
        const cmd = `ask api get-validation -s ${TEST_SKILL_ID} -i ${TEST_VALIDATION_ID} -g invalid_stage`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', (done) => {
        const cmd = `ask api get-validation -s ${TEST_SKILL_ID} -i ${TEST_VALIDATION_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            done();
        };
        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, when stage provided', (done) => {
        const cmd = `ask api get-validation -s ${TEST_SKILL_ID} -i ${TEST_VALIDATION_ID} -g ${TEST_STAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createGetValidationRequestOptions(TEST_STAGE, TEST_DEFAULT_PROFILE_TOKEN), operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response', (done) => {
        const cmd = `ask api get-validation -s ${TEST_SKILL_ID} -i ${TEST_VALIDATION_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createGetValidationRequestOptions(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN), operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', (done) => {
        const cmd = `ask api get-validation -s ${TEST_SKILL_ID} -i ${TEST_VALIDATION_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createGetValidationRequestOptions(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN), operation],
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
        const cmd = `ask api get-validation -s ${TEST_SKILL_ID} -i ${TEST_VALIDATION_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [createGetValidationRequestOptions(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN), operation],
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
