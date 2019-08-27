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

describe('Functional test - ask api get-git-credentials', () => {
    const selectiveTestExecution = false;
    const operation = 'get-git-credentials';
    const TEST_COMMAND = 'ask api get-git-credentials';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'skillId';
    const TEST_REPO_URL = 'RepoUrl';
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_HTTP_RESPONSE_BODY = {
        repositoryCredentials: {
            username: 'username',
            password: 'password',
            expiresAt: 'expriresAt'
        },
    };

    function getGitCredentialsRequestOptions(skillId, repoUrl, profileToken) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${skillId}/alexaHosted/repository/credentials/generate`,
            method: CONSTANTS.HTTP_REQUEST.VERB.POST,
            headers: { authorization: profileToken },
            body: {
                repository: {
                    type: 'GIT',
                    url: repoUrl
                }
            },
            json: true
        };
    }
    describe('# get-git-credentials with any option will make direct api request', () => {
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
                testCase: 'print error if repo-url is not provided',
                envVar: {},
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID}`,
                expectedResult: {
                    error: 'Please provide valid input for option: repo-url. Field is required and must be set.',
                    info: '',
                    warn: ''
                },
                httpMockConfig: []
            },
            {
                testCase: 'print error when input invalid profile',
                envVar: {},
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID} --repo-url ${TEST_REPO_URL} -p ${TEST_INVALID_PROFILE}`,
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
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID} --repo-url ${TEST_REPO_URL}`,
                expectedResult: {
                    error: '',
                    info: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getGitCredentialsRequestOptions(TEST_SKILL_ID, TEST_REPO_URL, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
                }]
            },
            {
                testCase: 'can handle http response with status code >= 300',
                envVar: {},
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID} --repo-url ${TEST_REPO_URL}`,
                expectedResult: {
                    error: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                    info: '',
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getGitCredentialsRequestOptions(TEST_SKILL_ID, TEST_REPO_URL, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
                }]
            },
            {
                testCase: 'can handle http response error',
                envVar: {},
                cmd: `${TEST_COMMAND} -s ${TEST_SKILL_ID} --repo-url ${TEST_REPO_URL}`,
                expectedResult: {
                    error: TEST_ERROR_MESSAGE,
                    info: '',
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getGitCredentialsRequestOptions(TEST_SKILL_ID, TEST_REPO_URL, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [TEST_ERROR_MESSAGE, null]
                }]
            }
        ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig, run }) => {
            testRunner(selectiveTestExecution, run, testCase, expectedResult, operation, cmd, envVar, httpMockConfig);
        });
    });
});
