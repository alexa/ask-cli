const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-simulation', () => {
    const operation = 'get-simulation';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const SKILL_COMMAND = `ask api ${operation}`;
    const TEST_SIMULATION_ID = 'TEST_SIMULATION_ID';
    const TEST_SKILL_ID = 'TEST_SKILL_ID';

    const getSimulationSkillRequestOptions = (stage = CONSTANTS.SKILL.STAGE.DEVELOPMENT) => ({
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V2}/skills/${TEST_SKILL_ID}/stages/${stage}/simulations/${TEST_SIMULATION_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    });

    [
        {
            testCase: 'no simulation-id provided',
            envVar: {},
            cmd: `${SKILL_COMMAND}`,
            expectedResult: {
                error: 'Please provide valid input for option: simulation-id. Field is required and must be set.',
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid simulation-id, no skill-id',
            envVar: {},
            cmd: `${SKILL_COMMAND} -i ${TEST_SIMULATION_ID}`,
            expectedResult: {
                error: 'Please provide valid input for option: skill-id. Field is required and must be set.',
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid simulation-id, valid skill-id and invalid stage id',
            envVar: {},
            cmd: `${SKILL_COMMAND} -i ${TEST_SIMULATION_ID} -s ${TEST_SKILL_ID} -g ${CONSTANTS.SKILL.STAGE.CERTIFICATION}`,
            expectedResult: {
                error: `Please provide valid input for option: stage. Value must be in (development, live).`,
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid simulation-id, valid skill-id and invalid profile',
            envVar: {},
            cmd: `${SKILL_COMMAND} -i ${TEST_SIMULATION_ID} -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`,
            expectedResult: {
                error: `Cannot resolve profile [${TEST_INVALID_PROFILE}]`,
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid get-simulation command with default profile',
            envVar: {},
            cmd: `${SKILL_COMMAND} -i ${TEST_SIMULATION_ID} -s ${TEST_SKILL_ID}`,
            expectedResult: {
                error: '',
                response: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [getSimulationSkillRequestOptions(), operation],
                output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        },
        {
            testCase: 'handle http request error',
            envVar: {},
            cmd: `${SKILL_COMMAND} -i ${TEST_SIMULATION_ID} -s ${TEST_SKILL_ID}`,
            expectedResult: {
                error: TEST_ERROR_MESSAGE,
                response: ''
            },
            httpMockConfig: [{
                input: [getSimulationSkillRequestOptions(), operation],
                output: [TEST_ERROR_MESSAGE, null]
            }]
        },
        {
            testCase: 'handle SMAPI response with status code < 300',
            envVar: {},
            cmd: `${SKILL_COMMAND} -i ${TEST_SIMULATION_ID} -s ${TEST_SKILL_ID}`,
            expectedResult: {
                error: '',
                response: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [getSimulationSkillRequestOptions(), operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        },
        {
            testCase: 'handle SMAPI response with status code < 300 and live stage id',
            envVar: {},
            cmd: `${SKILL_COMMAND} -i ${TEST_SIMULATION_ID} -s ${TEST_SKILL_ID} -g ${CONSTANTS.SKILL.STAGE.LIVE}`,
            expectedResult: {
                error: '',
                response: jsonView.toString(TEST_HTTP_RESPONSE_BODY)
            },
            httpMockConfig: [{
                input: [getSimulationSkillRequestOptions(CONSTANTS.SKILL.STAGE.LIVE), operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        },
        {
            testCase: 'handle SMAPI response with status code >= 300',
            envVar: {},
            cmd: `${SKILL_COMMAND} -i ${TEST_SIMULATION_ID} -s ${TEST_SKILL_ID}`,
            expectedResult: {
                error: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                response: ''
            },
            httpMockConfig: [{
                input: [getSimulationSkillRequestOptions(), operation],
                output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
            }]
        }
    ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig }) => {
        it(`| ${testCase}`, (done) => {
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(expectedResult.response);
                expect(msgCatcher.error).equal(expectedResult.error);
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
