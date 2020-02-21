const { expect } = require('chai');
const fs = require('fs');
const tmp = require('tmp');
const jsonView = require('@src/view/json-view');
const jsonRead = require('@src/utils/json-read');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api invoke-skill', () => {
    const tmpobj = tmp.fileSync({ postfix: '.json' });
    fs.writeFileSync(tmpobj.name, JSON.stringify('{foobar:foobar}'));
    after(() => {
        tmp.setGracefulCleanup();
    });
    const operation = 'invoke-skill';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_FILE_PATH = tmpobj.name;
    const TEST_FILE_CONTENT = JSON.stringify(jsonRead.readFile(TEST_FILE_PATH, 'utf8'));
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const SKILL_COMMAND = `ask api ${operation}`;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_VALID_ENDPOINT_REGION = 'default';

    const invokeSkillRequestOptions = (stage = CONSTANTS.SKILL.STAGE.DEVELOPMENT) => ({
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V2}/skills/${TEST_SKILL_ID}/stages/${stage}/invocations`,
        method: CONSTANTS.HTTP_REQUEST.VERB.POST,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: {
            endpointRegion: `${TEST_VALID_ENDPOINT_REGION}`,
            skillRequest: `${TEST_FILE_CONTENT}`
        },
        json: true
    });

    [
        {
            testCase: 'no skill-id provided',
            envVar: {},
            cmd: `${SKILL_COMMAND}`,
            expectedResult: {
                error: 'Please provide valid input for option: skill-id. Field is required and must be set.',
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill-id, no endpoint-region specified',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID}`,
            expectedResult: {
                error: 'Please provide valid input for option: endpoint-region. Field is required and must be set.',
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill-id, valid endpoint-region, neither file|json specified',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION}`,
            expectedResult: {
                error: 'Error: Please input required parameter: file | json.',
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill-id, valid endpoint-region, empty json specified and valid file path',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION} -j {} -f ${TEST_FILE_PATH}`,
            expectedResult: {
                error: 'Error: Both file and text parameters are specified. Please enter file | json.',
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill invocation command with invalid stage and json payload',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION} `
                + `-j ${TEST_FILE_PATH} -g ${CONSTANTS.SKILL.STAGE.CERTIFICATION}`,
            expectedResult: {
                error: 'Please provide valid input for option: stage. Value must be in (development, live).',
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill invocation command with invalid profile and json payload',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION}`
                + ` -j ${TEST_FILE_PATH} -p ${TEST_INVALID_PROFILE}`,
            expectedResult: {
                error: `Cannot resolve profile [${TEST_INVALID_PROFILE}]`,
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid skill invocation command with default profile and json payload',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION} -j ${TEST_FILE_CONTENT}`,
            expectedResult: {
                error: '',
                response: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [invokeSkillRequestOptions(), operation],
                output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        },
        {
            testCase: 'valid skill invocation command with default profile and file payload',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION} -f ${TEST_FILE_PATH}`,
            expectedResult: {
                error: '',
                response: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [invokeSkillRequestOptions(), operation],
                output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        },
        {
            testCase: 'handle http request error',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION} -f ${TEST_FILE_PATH}`,
            expectedResult: {
                error: TEST_ERROR_MESSAGE,
                response: ''
            },
            httpMockConfig: [{
                input: [invokeSkillRequestOptions(), operation],
                output: [TEST_ERROR_MESSAGE, null]
            }]
        },
        {
            testCase: 'handle SMAPI response with status code < 300',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION} -f ${TEST_FILE_PATH}`,
            expectedResult: {
                error: '',
                response: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [invokeSkillRequestOptions(), operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        },
        {
            testCase: 'handle SMAPI response with status code < 300 and live stage id',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION}`
                + ` -f ${TEST_FILE_PATH} -g ${CONSTANTS.SKILL.STAGE.LIVE}`,
            expectedResult: {
                error: '',
                response: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [invokeSkillRequestOptions(CONSTANTS.SKILL.STAGE.LIVE), operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        },
        {
            testCase: 'handle SMAPI response with status code >= 300',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} --endpoint-region ${TEST_VALID_ENDPOINT_REGION} -f ${TEST_FILE_PATH}`,
            expectedResult: {
                error: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                response: ''
            },
            httpMockConfig: [{
                input: [invokeSkillRequestOptions(), operation],
                output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        }
    ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig }) => {
        it(`| ${testCase}`, async () => {
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(expectedResult.response);
                expect(msgCatcher.error).equal(expectedResult.error);
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
