const fs = require('fs');
const tmp = require('tmp');
const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api simulate', () => {
    after(() => {
        tmp.setGracefulCleanup();
    });
    const tmpobj = tmp.fileSync({ postfix: '.txt' });
    fs.writeFileSync(tmpobj.name, 'foobar');
    const selectiveTestExecution = false;
    const operation = 'simulate-skill';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_FILE_PATH = tmpobj.name;
    const TEST_FILE_CONTENT = fs.readFileSync(TEST_FILE_PATH, { encoding: 'utf-8' });
    const TEST_SIMULATION_ID = 'TEST_SIMULATION_ID';
    const TEST_HTTP_RESPONSE_BODY = { id: `${TEST_SIMULATION_ID}` };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const SKILL_COMMAND = `ask api ${operation}`;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_LOCALE = 'en-US';

    const simulateSkillRequestOptions = (stage = CONSTANTS.SKILL.STAGE.DEVELOPMENT, newSession = false) => {
        const payload = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V2}/skills/${TEST_SKILL_ID}/stages/${stage}/simulations`,
            method: CONSTANTS.HTTP_REQUEST.VERB.POST,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: {
                input: {
                    content: `${TEST_FILE_CONTENT}`
                },
                device: {
                    locale: `${TEST_LOCALE}`
                }
            },
            json: true
        };
        if (newSession) {
            payload.body.session = {
                mode: 'FORCE_NEW_SESSION'
            };
        }
        return payload;
    };

    [
        {
            testCase: 'no skill-id provided',
            envVar: {},
            cmd: `${SKILL_COMMAND}`,
            expectedResult: {
                error: 'Please provide valid input for option: skill-id. Field is required and must be set.',
                response: ''
            },
            httpMockConfig: [],
            run: false
        },
        {
            testCase: 'valid skill-id, neither file or text payload specified',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID}`,
            expectedResult: {
                error: 'Error: Please input required parameter: file | text.',
                response: ''
            },
            httpMockConfig: [],
            run: false
        },
        {
            testCase: 'valid skill-id, valid endpoint-region, text and file path specified',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -t 'foobar' -f ${TEST_FILE_PATH}`,
            expectedResult: {
                error: 'Error: Both file and text parameters are specified. Please enter file | text.',
                response: ''
            },
            httpMockConfig: [],
            run: false
        },
        {
            testCase: 'valid skill-id, valid endpoint-region, text and no locale',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -t 'foobar'`,
            expectedResult: {
                error: 'Error: Please specify device locale via command line parameter locale or environment variable - ASK_DEFAULT_DEVICE_LOCALE.',
                response: ''
            },
            httpMockConfig: [],
            run: false
        },
        {
            testCase: 'valid skill-id, valid endpoint-region, text and invalid locale',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -t 'foobar' -l 'foobar'`,
            expectedResult: {
                error: 'Please provide valid input for option: locale. Input value (\'foobar\') doesn\'t match REGEX rule ^[a-z]{2}-[A-Z]{2}$.',
                response: ''
            },
            httpMockConfig: [],
            run: false
        },
        {
            testCase: 'valid skill invocation command with invalid profile and json payload',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -t ${TEST_FILE_CONTENT} -l ${TEST_LOCALE} --quick -p ${TEST_INVALID_PROFILE}`,
            expectedResult: {
                error: `Cannot resolve profile [${TEST_INVALID_PROFILE}]`,
                response: ''
            },
            httpMockConfig: []
        },
        {
            testCase: 'valid simulation command with default profile, text payload, cmd line passed locale and no wait',
            envVar: {},
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -t ${TEST_FILE_CONTENT} -l ${TEST_LOCALE} --quick`,
            expectedResult: {
                error: '',
                response: `${jsonView.toString(TEST_HTTP_RESPONSE_BODY)}Simulation created for simulation id: ${TEST_SIMULATION_ID}.`
                + 'Please use the ask get-simulation command to get the status of the simulation id.'
            },
            httpMockConfig: [{
                input: [simulateSkillRequestOptions(), operation],
                output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: true
        },
        {
            testCase: 'valid simulation command with default profile, text payload , env passed locale and no wait',
            envVar: {
                ASK_DEFAULT_DEVICE_LOCALE: TEST_LOCALE
            },
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -t ${TEST_FILE_CONTENT} --quick`,
            expectedResult: {
                error: '',
                response: `${jsonView.toString(TEST_HTTP_RESPONSE_BODY)}Simulation created for simulation id: ${TEST_SIMULATION_ID}.`
                    + 'Please use the ask get-simulation command to get the status of the simulation id.'
            },
            httpMockConfig: [{
                input: [simulateSkillRequestOptions(), operation],
                output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: false
        },
        {
            testCase: 'valid simulation command with default profile, file payload , env passed locale and no wait',
            envVar: {
                ASK_DEFAULT_DEVICE_LOCALE: TEST_LOCALE
            },
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} --quick`,
            expectedResult: {
                error: '',
                response: `${jsonView.toString(TEST_HTTP_RESPONSE_BODY)}Simulation created for simulation id: ${TEST_SIMULATION_ID}.`
                    + 'Please use the ask get-simulation command to get the status of the simulation id.'
            },
            httpMockConfig: [{
                input: [simulateSkillRequestOptions(), operation],
                output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: false
        },
        {
            testCase: 'valid simulation command with default profile, file payload , env passed locale, no wait, live stage and force new session',
            envVar: {
                ASK_DEFAULT_DEVICE_LOCALE: TEST_LOCALE
            },
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} --quick --force-new-session -g ${CONSTANTS.SKILL.STAGE.LIVE}`,
            expectedResult: {
                error: '',
                response: `${jsonView.toString(TEST_HTTP_RESPONSE_BODY)}Simulation created for simulation id: ${TEST_SIMULATION_ID}.`
                    + 'Please use the ask get-simulation command to get the status of the simulation id.'
            },
            httpMockConfig: [{
                input: [simulateSkillRequestOptions(CONSTANTS.SKILL.STAGE.LIVE, true), operation],
                output: [null, { statusCode: 204, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: true
        },
        {
            testCase: 'handle http request error',
            envVar: {
                ASK_DEFAULT_DEVICE_LOCALE: TEST_LOCALE
            },
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} --quick`,
            expectedResult: {
                error: TEST_ERROR_MESSAGE,
                response: ''
            },
            httpMockConfig: [{
                input: [simulateSkillRequestOptions(), operation],
                output: [TEST_ERROR_MESSAGE, null]
            }],
            run: false
        },
        {
            testCase: 'handle SMAPI response with status code < 300',
            envVar: {
                ASK_DEFAULT_DEVICE_LOCALE: TEST_LOCALE
            },
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} --quick`,
            expectedResult: {
                error: '',
                response: `${jsonView.toString(TEST_HTTP_RESPONSE_BODY)}Simulation created for simulation id: ${TEST_SIMULATION_ID}.`
                    + 'Please use the ask get-simulation command to get the status of the simulation id.'
            },
            httpMockConfig: [{
                input: [simulateSkillRequestOptions(), operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: false
        },
        {
            testCase: 'handle SMAPI response with status code >= 300',
            envVar: {
                ASK_DEFAULT_DEVICE_LOCALE: TEST_LOCALE
            },
            cmd: `${SKILL_COMMAND} -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} --quick`,
            expectedResult: {
                error: jsonView.toString(TEST_HTTP_RESPONSE_BODY),
                response: ''
            },
            httpMockConfig: [{
                input: [simulateSkillRequestOptions(), operation],
                output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
            }],
            run: false
        }
    ].forEach(({ testCase, envVar, cmd, expectedResult, httpMockConfig, run }) => {
        if (selectiveTestExecution) {
            if (!run) {
                return;
            }
        }
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
