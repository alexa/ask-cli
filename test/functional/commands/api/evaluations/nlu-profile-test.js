const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api nlu-profile', () => {
    const operation = 'nlu-profile';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_SKILL_STAGE = 'live';
    const TEST_LOCALE = 'en-US';
    const INVALID_LOCALE = 'en-us';
    const TEST_SKILL_ID = 'skillId';
    const TEST_UTTERANCE = 'utterance';
    const TEST_MULTI_TURN_TOKEN = 'multiTurnToken';

    function callProfileNluRequestOptionsWithMultiturnToken(stage, profileToken) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${stage}/interactionModel/locales/${TEST_LOCALE}/profileNlu`,
            method: CONSTANTS.HTTP_REQUEST.VERB.POST,
            headers: { authorization: profileToken },
            body: {
                utterance: TEST_UTTERANCE,
                multiTurnToken: TEST_MULTI_TURN_TOKEN
            },
            json: true
        };
    }

    function callProfileNluRequestOptions(stage, profileToken) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${stage}/interactionModel/locales/${TEST_LOCALE}/profileNlu`,
            method: CONSTANTS.HTTP_REQUEST.VERB.POST,
            headers: { authorization: profileToken },
            body: {
                utterance: TEST_UTTERANCE
            },
            json: true
        };
    }

    it('| print error if skill-id is not provided', async () => {
        const cmd = 'ask api nlu-profile';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error if utterance is not provided', async () => {
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: utterance. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error if locale is not provided', async () => {
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID} -u ${TEST_UTTERANCE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: locale. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error if locale is invalid', async () => {
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID} -u ${TEST_UTTERANCE} -l ${INVALID_LOCALE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Please provide valid input for option: locale. Input value (${INVALID_LOCALE}) doesn't match REGEX rule ^[a-z]{2}-[A-Z]{2}$.`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID} -u ${TEST_UTTERANCE} -l ${TEST_LOCALE} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, when stage is set by valid input', async () => {
        const inputOptions = callProfileNluRequestOptions(TEST_SKILL_STAGE, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID} -u ${TEST_UTTERANCE} -l ${TEST_LOCALE} -g ${TEST_SKILL_STAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, when stage is not provided', async () => {
        const inputOptions = callProfileNluRequestOptions(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID} -u ${TEST_UTTERANCE} -l ${TEST_LOCALE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, with multiturn-token when stage is not provided', async () => {
        const inputOptionsWithToken = callProfileNluRequestOptionsWithMultiturnToken(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID} -u ${TEST_UTTERANCE} -l ${TEST_LOCALE} --multiturn-token ${TEST_MULTI_TURN_TOKEN}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptionsWithToken, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', async () => {
        const inputOptions = callProfileNluRequestOptions(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID} -u ${TEST_UTTERANCE} -l ${TEST_LOCALE}`;
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
        const inputOptions = callProfileNluRequestOptions(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api nlu-profile -s ${TEST_SKILL_ID} -u ${TEST_UTTERANCE} -l ${TEST_LOCALE}`;
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
