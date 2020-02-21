const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api enable-skill', () => {
    const operation = 'enable-skill';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'SKILL_ID';
    const TEST_SKILL_STAGE = 'live';
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };

    function createEnableSkillRequestOptions(stage, profileToken) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${stage}/enablement`,
            method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
            headers: { authorization: profileToken },
            json: false,
            body: null
        };
    }

    it('| print error when --skill-id is not provided', async () => {
        const cmd = 'ask api enable-skill';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when invalid stage is provided', async () => {
        const cmd = `ask api enable-skill -s ${TEST_SKILL_ID} -g invalid_stage`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `ask api enable-skill -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, when stage is set by valid input', async () => {
        const inputOptions = createEnableSkillRequestOptions(TEST_SKILL_STAGE, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api enable-skill -s ${TEST_SKILL_ID} -g ${TEST_SKILL_STAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 204 }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal('The skill has been enabled.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, when stage is not provided', async () => {
        const inputOptions = createEnableSkillRequestOptions(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api enable-skill -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 204 }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal('The skill has been enabled.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', async () => {
        const inputOptions = createEnableSkillRequestOptions(TEST_SKILL_STAGE, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api enable-skill -s ${TEST_SKILL_ID} -g ${TEST_SKILL_STAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with status code >= 300', async () => {
        const inputOptions = createEnableSkillRequestOptions(TEST_SKILL_STAGE, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api enable-skill -s ${TEST_SKILL_ID} -g ${TEST_SKILL_STAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
