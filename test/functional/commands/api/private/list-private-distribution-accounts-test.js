const { expect } = require('chai');
const R = require('ramda');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

function testRunner(selectiveTestExecution, run, testCase, expectedResult, operation, cmd, envVar, httpMockConfig) {
    if (selectiveTestExecution) {
        if (!run) {
            return;
        }
    }
    if (!expectedResult.warn) {
        expectedResult.warn = '';
    }
    it(`| ${testCase}`, async () => {
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal(expectedResult.info);
            expect(msgCatcher.error).equal(expectedResult.error);
            expect(msgCatcher.warn).equal(expectedResult.warn);
        };
        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
}

describe('Functional test - ask api list-private-distribution-accounts', () => {
    const selectiveTestExecution = false;
    const operation = 'list-private-distribution-accounts';
    const TEST_COMMAND_BASE = `ask api ${operation}`;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_NEXT_TOKEN2 = 'NEXT_TOKEN_2';
    const TEST_MAX_RESULT = 30;
    const TEST_ACCOUNTS_LIST_RESPONSE = {
        id: 'foobar',
        acceptStatus: 'PENDING'
    };
    const TEST_HTTP_RESPONSE_BODY = {
        _links: 'foobar',
        accounts: [TEST_ACCOUNTS_LIST_RESPONSE]
    };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    const requestOptionGenerator = (queryParamJson) => {
        let requestUrl = `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/`
            + `stages/${CONSTANTS.SKILL.STAGE.LIVE}/privateDistributionAccounts`;
        if (queryParamJson) {
            requestUrl += '?';
            Object.keys(queryParamJson).forEach((key) => {
                if (queryParamJson[key]) {
                    requestUrl += `${key}=${queryParamJson[key]}&`;
                }
            });
        }
        requestUrl = requestUrl.slice(0, -1);
        return {
            url: requestUrl,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: null,
            json: false
        };
    };

    const responseGenerator = (nextTokenValue, accounts, links = 'foobar') => ({
        _links: links,
        nextToken: nextTokenValue,
        accounts: [accounts]
    });

    describe('# list-private-distribution-accounts with any option will make direct api request', () => {
        [
            {
                testCase: 'no skill-id provided',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE}`,
                expectedResult: {
                    error: 'Please provide valid input for option: skill-id. Field is required and must be set.',
                    info: ''
                },
                httpMockConfig: [],
                run: false
            },
            {
                testCase: 'invalid stage value',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --stage ${CONSTANTS.SKILL.STAGE.DEVELOPMENT}`,
                expectedResult: {
                    error: 'Error: Only supported value for stage option is live.',
                    info: ''
                },
                httpMockConfig: [],
                run: false
            },
            {
                testCase: 'invalid max-results value',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --max-results not_number`,
                expectedResult: {
                    error: 'Please provide valid input for option: max-results. Input should be a number.',
                    info: ''
                },
                httpMockConfig: [],
                run: false
            },
            {
                testCase: 'print error when profile is invalid',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --max-results 10 -p ${TEST_INVALID_PROFILE}`,
                expectedResult: {
                    error: `Cannot resolve profile [${TEST_INVALID_PROFILE}]`,
                    info: ''
                },
                httpMockConfig: [],
                run: false
            },
            {
                testCase: 'valid command when nextToken is specified for default profile but api request fails with no error response',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1}`,
                expectedResult: {
                    error: '[Fatal]: SMAPI error code 401. No response body from the service request.',
                    info: ''
                },
                httpMockConfig: [{
                    input: [requestOptionGenerator(JSON.parse(`{"nextToken":"${TEST_NEXT_TOKEN1}",                       
                        "maxResults":"${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}"}`)), operation],
                    output: [null, { statusCode: 401 }]
                }],
                run: true
            },
            {
                testCase: 'valid command with nextToken is specified for default profile',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1}`,
                expectedResult: {
                    error: '',
                    info: jsonView.toString(R.omit(['_links'], TEST_HTTP_RESPONSE_BODY))
                },
                httpMockConfig: [{
                    input: [requestOptionGenerator(JSON.parse(`{"nextToken":"${TEST_NEXT_TOKEN1}",                       
                        "maxResults":"${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}"}`)), operation],
                    output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
                }],
                run: false
            },
            {
                testCase: 'valid command with nextToken is specified for default profile but api request fails',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1}`,
                expectedResult: {
                    error: jsonView.toString(R.omit(['_links'], TEST_HTTP_RESPONSE_BODY)),
                    info: ''
                },
                httpMockConfig: [{
                    input: [requestOptionGenerator(JSON.parse(`{"nextToken":"${TEST_NEXT_TOKEN1}",                       
                        "maxResults":"${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}"}`)), operation],
                    output: [null, { statusCode: 401, body: TEST_HTTP_RESPONSE_BODY }]
                }],
                run: false
            },
            {
                testCase: 'valid command with nextToken and maxResult are specified when profile is default profile',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`,
                expectedResult: {
                    error: '',
                    info: jsonView.toString(R.omit(['_links'], TEST_HTTP_RESPONSE_BODY))
                },
                httpMockConfig: [{
                    input: [requestOptionGenerator(JSON.parse(`{"nextToken":"${TEST_NEXT_TOKEN1}",                       
                        "maxResults":"${TEST_MAX_RESULT}"}`)), operation],
                    output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
                }],
                run: false
            }
        ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig, run }) => {
            testRunner(selectiveTestExecution, run, testCase, expectedResult, operation, cmd, envVar, httpMockConfig);
        });
    });

    describe('# list-catalogs without options traverses the list automatically', () => {
        [
            {
                testCase: 'list all the skills when no option set for default profile but fails the request in the middle',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID}`,
                expectedResult: {
                    error: jsonView.toString(TEST_ERROR_MESSAGE),
                    info: ''
                },
                httpMockConfig: [
                    {
                        input: [requestOptionGenerator(JSON.parse(`{
                        "maxResults":"${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}","nextToken":null
                        }`)), operation],
                        output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, TEST_ACCOUNTS_LIST_RESPONSE) }]
                    },
                    {
                        input: [requestOptionGenerator(JSON.parse(`{
                        "maxResults":"${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}", "nextToken":"${TEST_NEXT_TOKEN1}"
                        }`)), operation],
                        output: [null, { statusCode: 400, body: TEST_ERROR_MESSAGE }]
                    }
                ],
                run: true
            },
            {
                testCase: 'iteratively list all the catalogs when no option set for default profile',
                envVar: {},
                cmd: `${TEST_COMMAND_BASE} -s ${TEST_SKILL_ID}`,
                expectedResult: {
                    error: '',
                    info: jsonView.toString({
                        accounts: [
                            TEST_ACCOUNTS_LIST_RESPONSE,
                            TEST_ACCOUNTS_LIST_RESPONSE,
                            TEST_ACCOUNTS_LIST_RESPONSE,
                        ]
                    })
                },
                httpMockConfig: [
                    {
                        input: [requestOptionGenerator(JSON.parse(`{
                        "maxResults":"${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}","nextToken":null
                        }`)), operation],
                        output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, TEST_ACCOUNTS_LIST_RESPONSE) }]
                    },
                    {
                        input: [requestOptionGenerator(JSON.parse(`{
                        "maxResults":"${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}","nextToken":"${TEST_NEXT_TOKEN1}"
                        }`)), operation],
                        output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN2, TEST_ACCOUNTS_LIST_RESPONSE) }]
                    },
                    {
                        input: [requestOptionGenerator(JSON.parse(`{
                        "maxResults":"${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}","nextToken":"${TEST_NEXT_TOKEN2}"
                        }`)), operation],
                        output: [null, { statusCode: 200, body: responseGenerator(null, TEST_ACCOUNTS_LIST_RESPONSE) }]
                    }
                ],
                run: true
            }
        ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig, run }) => {
            testRunner(selectiveTestExecution, run, testCase, expectedResult, operation, cmd, envVar, httpMockConfig);
        });
    });
});
