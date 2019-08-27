const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

function testRunner(selectiveTestExecution, run, testCase, expectedResult, operation, cmd, envVar, httpMockConfig) {
    if (selectiveTestExecution) {
        if (!run) {
            return;
        }
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
}

describe('Functional test - ask api get-alexa-hosted-skill', () => {
    const selectiveTestExecution = false;
    const operation = 'get-alexa-hosted-skill';
    const TEST_COMMAND = 'ask api get-alexa-hosted-skill';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'skillId';
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_HTTP_RESPONSE_BODY = {
        alexaHosted: {
            repository: {
                url: 'url',
                type: 'type'
            },
            runtime: 'runtime'
        }
    };

    function getHostedSkillRequestOptions(skillId, profileToken) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${skillId}/alexaHosted`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: profileToken },
            body: null,
            json: false
        };
    }

    describe('# get-alexa-hosted-skill with any option will make direct api request', () => {
        [
            {
                testCase: 'print error if skill-id is not provided',
                envVar: {},
                cmd: TEST_COMMAND,
                expectedResult: {
                    error: 'Please provide valid input for option: skill-id. Field is required and must be set.',
                    info: '',
                    warn: ''
                },
                httpMockConfig: []
            },
            {
                testCase: 'print error when input invalid profile',
                envVar: {},
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`,
                expectedResult: {
                    error: `Cannot resolve profile [${TEST_INVALID_PROFILE}]`,
                    info: '',
                    warn: ''
                },
                httpMockConfig: []
            },
            {
                testCase: 'can get correct http response, when valid input',
                envVar: {},
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID}`,
                expectedResult: {
                    error: '',
                    info: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getHostedSkillRequestOptions(TEST_SKILL_ID, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
                }]
            },
            {
                testCase: 'can handle http response with status code >= 300',
                envVar: {},
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID}`,
                expectedResult: {
                    error: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                    info: '',
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getHostedSkillRequestOptions(TEST_SKILL_ID, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
                }]
            },
            {
                testCase: 'can handle http response error',
                envVar: {},
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID}`,
                expectedResult: {
                    error: TEST_ERROR_MESSAGE,
                    info: '',
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getHostedSkillRequestOptions(TEST_SKILL_ID, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [TEST_ERROR_MESSAGE, null]
                }]
            }
        ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig, run }) => {
            testRunner(selectiveTestExecution, run, testCase, expectedResult, operation, cmd, envVar, httpMockConfig);
        });
    });
});
