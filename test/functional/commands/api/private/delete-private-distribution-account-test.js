const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api delete-private-distribution-account', () => {
    const operation = 'delete-private-distribution-account';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_COMMAND_BASE = `ask api ${operation}`;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_ACCOUNT_ID = 'TEST_ACCOUNT_ID';
    const selectiveTestExecution = false;

    const DeletePrivateDistributionAccountRequestOptions = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/`
        + `stages/${CONSTANTS.SKILL.STAGE.LIVE}/privateDistributionAccounts/${TEST_ACCOUNT_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };

    [
        {
            testCase: 'no skill-id provided',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE}`,
            expectedResult: {
                error: 'Please provide valid input for option: skill-id. Field is required and must be set.',
                info: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill-id, no account-id provided',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID}`,
            expectedResult: {
                error: 'Please provide valid input for option: account-id. Field is required and must be set.',
                info: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill-id, valid account-id  and invalid stage value provided',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --account-id ${TEST_ACCOUNT_ID} --stage foobar`,
            expectedResult: {
                error: 'Please provide valid input for option: stage. Value must be in (development, live, certification).',
                info: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill-id, valid account-id  and stage value set to development',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --account-id ${TEST_ACCOUNT_ID} --stage ${CONSTANTS.SKILL.STAGE.DEVELOPMENT}`,
            expectedResult: {
                error: 'Error: Only supported value for stage option is live.',
                info: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid command with default profile',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --account-id ${TEST_ACCOUNT_ID}`,
            expectedResult: {
                error: '',
                info: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [DeletePrivateDistributionAccountRequestOptions, operation],
                output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: true
        },
        {
            testCase: 'valid command with invalid profile',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --account-id ${TEST_ACCOUNT_ID} -p ${TEST_INVALID_PROFILE}`,
            expectedResult: {
                error: `Cannot resolve profile [${TEST_INVALID_PROFILE}]`,
                info: ''
            },
            httpMockConfig: [],
            run: true
        },
        {
            testCase: 'handle http request error',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --account-id ${TEST_ACCOUNT_ID}`,
            expectedResult: {
                error: TEST_ERROR_MESSAGE,
                info: ''
            },
            httpMockConfig: [{
                input: [DeletePrivateDistributionAccountRequestOptions, operation],
                output: [TEST_ERROR_MESSAGE, null]
            }],
            run: true
        },
        {
            testCase: 'handle SMAPI response with status code < 300',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --account-id ${TEST_ACCOUNT_ID}`,
            expectedResult: {
                error: '',
                info: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [DeletePrivateDistributionAccountRequestOptions, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: true
        },
        {
            testCase: 'handle SMAPI response with status code >= 300',
            envVar: {},
            cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --account-id ${TEST_ACCOUNT_ID}`,
            expectedResult: {
                error: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                info: ''
            },
            httpMockConfig: [{
                input: [DeletePrivateDistributionAccountRequestOptions, operation],
                output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: true
        }
    ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig, run }) => {
        if (selectiveTestExecution) {
            if (!run) {
                return;
            }
        }
        if (!expectedResult.warn) {
            expectedResult.warn = '';
        }
        it(`| ${testCase}`, (done) => {
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(expectedResult.info);
                expect(msgCatcher.error).equal(expectedResult.error);
                expect(msgCatcher.warn).equal(expectedResult.warn);
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
