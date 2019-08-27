const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api update-beta-test', () => {
    const operation = 'update-beta-test';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_INVALID_FEEDBACK_EMAIL = 'TEST_INVALID_FEEDBACK_EMAIL';
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_SKILL_ID = 'skillId';
    const UPDATE_BETA_TEST_COMMAND = `ask api ${operation}`;
    const FEEDBACK_EMAIL_REGEX = '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$';
    const VALID_EMAIL = 'random@amazon.com';
    const EMPTY_BODY = {};
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const headers = {
        authorization: TEST_DEFAULT_PROFILE_TOKEN
    };

    function getUpdateBetaTestRequestOptions(feedbackEmail) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/betaTest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
            headers,
            body: feedbackEmail,
            json: true
        };
    }

    it('| print error if skill-id is not provided', (done) => {
        const cmd = UPDATE_BETA_TEST_COMMAND;
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

    it('| print error when input is an invalid profile', (done) => {
        const cmd = `${UPDATE_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`;
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

    it('| print error when input is an invalid feedback email', (done) => {
        const cmd = `${UPDATE_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID} --feedback-email ${TEST_INVALID_FEEDBACK_EMAIL}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(`Please provide valid input for option: feedback-email. Input value (${TEST_INVALID_FEEDBACK_EMAIL}) doesn't match REGEX rule ${FEEDBACK_EMAIL_REGEX}.`);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, when valid skill Id and feedback email is provided', (done) => {
        const inputOptions = getUpdateBetaTestRequestOptions({ feedbackEmail: VALID_EMAIL });
        const cmd = `${UPDATE_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID} --feedback-email ${VALID_EMAIL}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 200, body: { feedbackEmail: VALID_EMAIL } }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(jsonView.toString({ feedbackEmail: VALID_EMAIL }));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', (done) => {
        const inputOptions = getUpdateBetaTestRequestOptions(EMPTY_BODY);
        const cmd = `${UPDATE_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
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

    it('| can handle http response with status code >= 300', (done) => {
        const inputOptions = getUpdateBetaTestRequestOptions(EMPTY_BODY);
        const cmd = `${UPDATE_BETA_TEST_COMMAND} -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
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
