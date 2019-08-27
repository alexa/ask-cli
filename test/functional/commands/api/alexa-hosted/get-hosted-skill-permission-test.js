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

describe('Functional test - ask api get-alexa-hosted-skill-permission', () => {
    const selectiveTestExecution = false;
    const operation = 'get-alexa-hosted-skill-permission';
    const TEST_COMMAND = 'ask api get-alexa-hosted-skill-permission';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.DEFAULT_VENDOR_ID;
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_PERMISSION_TYPE = 'newSkill';
    const TEST_PERMISSION_RESULT = 'ALLOWED';
    const TEST_HTTP_RESPONSE_BODY = {
        status: TEST_PERMISSION_RESULT,
        permission: TEST_PERMISSION_TYPE,
        actionUrl: '',
    };

    function getHostedSkillPermissionRequestOptions(vendorId, permissionType, profileToken) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/vendors/${vendorId}/alexaHosted/permissions/${permissionType}`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: profileToken },
            body: null,
            json: false
        };
    }

    describe('# get-alexa-hosted-skill-permission with any option will make direct api request', () => {
        [
            {
                testCase: 'print error if permission-type is not provided',
                envVar: {},
                cmd: TEST_COMMAND,
                expectedResult: {
                    error: 'Please provide valid input for option: permission-type. Field is required and must be set.',
                    info: '',
                    warn: ''
                },
                httpMockConfig: []
            },
            {
                testCase: 'print error when input invalid profile',
                envVar: {},
                cmd: `${TEST_COMMAND} --permission-type ${TEST_PERMISSION_TYPE} -p ${TEST_INVALID_PROFILE}`,
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
                cmd: `${TEST_COMMAND} --permission-type ${TEST_PERMISSION_TYPE}`,
                expectedResult: {
                    error: '',
                    info: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getHostedSkillPermissionRequestOptions(TEST_VENDOR_ID, TEST_PERMISSION_TYPE, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
                }]
            },
            {
                testCase: 'can handle http response with status code >= 300',
                envVar: {},
                cmd: `${TEST_COMMAND} --permission-type ${TEST_PERMISSION_TYPE}`,
                expectedResult: {
                    error: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                    info: '',
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getHostedSkillPermissionRequestOptions(TEST_VENDOR_ID, TEST_PERMISSION_TYPE, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
                }]
            },
            {
                testCase: 'can handle http response error',
                envVar: {},
                cmd: `${TEST_COMMAND} --permission-type ${TEST_PERMISSION_TYPE}`,
                expectedResult: {
                    error: TEST_ERROR_MESSAGE,
                    info: '',
                    warn: ''
                },
                httpMockConfig: [{
                    input: [getHostedSkillPermissionRequestOptions(TEST_VENDOR_ID, TEST_PERMISSION_TYPE, TEST_DEFAULT_PROFILE_TOKEN), operation],
                    output: [TEST_ERROR_MESSAGE, null]
                }]
            }
        ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig, run }) => {
            testRunner(selectiveTestExecution, run, testCase, expectedResult, operation, cmd, envVar, httpMockConfig);
        });
    });
});
