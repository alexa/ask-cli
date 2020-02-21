const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');
const sinon = require('sinon');
const helper = require('@src/commands/api/publishing/withdraw/helper');

describe('Functional test - ask api withdraw', () => {
    const operation = 'withdraw';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'SKILL_ID';
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_EXISTING_REASON_ENUM = 'TEST_SKILL';

    function createWithdrawSkillRequestOptions(profileToken) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/withdraw`,
            method: CONSTANTS.HTTP_REQUEST.VERB.POST,
            headers: { authorization: profileToken },
            json: true,
            body: { reason: TEST_EXISTING_REASON_ENUM, message: null }
        };
    }

    beforeEach(() => {
        sinon.stub(helper, 'collectWithdrawPayload').callsArgWith(0, TEST_EXISTING_REASON_ENUM, null);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('| print error when --skill-id is not provided', async () => {
        const cmd = 'ask api withdraw';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `ask api withdraw -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response', async () => {
        const inputOptions = createWithdrawSkillRequestOptions(TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api withdraw -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 202 }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal('Skill withdrawn successfully.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', async () => {
        const inputOptions = createWithdrawSkillRequestOptions(TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api withdraw -s ${TEST_SKILL_ID}`;
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
        const inputOptions = createWithdrawSkillRequestOptions(TEST_DEFAULT_PROFILE_TOKEN);
        const cmd = `ask api withdraw -s ${TEST_SKILL_ID}`;
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
