const { expect } = require('chai');
const sinon = require('sinon');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');
const helper = require('@src/commands/api/validation/validate-skill/helper');

describe('Functional test - ask api validate-skill', () => {
    const operation = 'validate-skill';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'SKILL_ID';
    const TEST_LOCALE_1 = 'en-US';
    const TEST_LOCALE_2 = 'ja-JP';
    const TEST_STAGE = 'live';
    const TEST_VALIDATION_ID = 'VALIDATION_ID';
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_HTTP_RESPONSE_BODY = { id: TEST_VALIDATION_ID };
    const TEST_GET_VALIDATION_MESSAGE = 'GET_VALIDATION_RESULTS';

    function createValidateSkillRequestOptions(stage, profileToken, locale1, locale2) {
        return {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${stage}/validations`,
            method: CONSTANTS.HTTP_REQUEST.VERB.POST,
            headers: { authorization: profileToken },
            json: true,
            body: { locales: [locale1, locale2] }
        };
    }

    it('| print error when --skill-id is not provided', (done) => {
        const cmd = 'ask api validate-skill';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when invalid stage is provided', (done) => {
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -g certification`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when --locales is provided', (done) => {
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID}`;
        const envVar = {
            // ASK_DEFAULT_DEVICE_LOCALE: null
        };
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Error: Please provide valid input for option: locales.'
            + ' Specify locale via command line parameter <-l|--locales> or environment variable ASK_DEFAULT_DEVICE_LOCALE.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', (done) => {
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -l ${TEST_LOCALE_1},${TEST_LOCALE_2} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, with stage, locales, quick mode provided', (done) => {
        const inputOptions = createValidateSkillRequestOptions(TEST_STAGE, TEST_DEFAULT_PROFILE_TOKEN, TEST_LOCALE_1, TEST_LOCALE_2);
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -g ${TEST_STAGE} -l ${TEST_LOCALE_1},${TEST_LOCALE_2} --quick`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 202, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(
                `Validation created for validation id: ${TEST_VALIDATION_ID}`
                + 'Please use the ask api get-validation command to get the status of the validation'
            );
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, with locales, quick mode provided', (done) => {
        const inputOptions = createValidateSkillRequestOptions(
            CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN, TEST_LOCALE_1, TEST_LOCALE_2
        );
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -l ${TEST_LOCALE_1},${TEST_LOCALE_2} --quick`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 202, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(
                `Validation created for validation id: ${TEST_VALIDATION_ID}`
                + 'Please use the ask api get-validation command to get the status of the validation'
            );
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, with quick mode provided, locales from environment variable', (done) => {
        const inputOptions = createValidateSkillRequestOptions(
            CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN, TEST_LOCALE_1, TEST_LOCALE_2
        );
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} --quick`;
        const envVar = { ASK_DEFAULT_DEVICE_LOCALE: `${TEST_LOCALE_1},${TEST_LOCALE_2}` };
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 202, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(
                `Validation created for validation id: ${TEST_VALIDATION_ID}`
                + 'Please use the ask api get-validation command to get the status of the validation'
            );
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct response, when waiting for skill validation errors out', (done) => {
        const inputOptions = createValidateSkillRequestOptions(
            CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN, TEST_LOCALE_1, TEST_LOCALE_2
        );
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -l ${TEST_LOCALE_1},${TEST_LOCALE_2}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 202, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        sinon.stub(helper, 'pollingSkillValidationResult').callsArgWith(4, TEST_ERROR_MESSAGE);

        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
            expect(msgCatcher.info).equal(`Validation created for validation id: ${TEST_VALIDATION_ID}`);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response, when waiting for skill validation passes', (done) => {
        const inputOptions = createValidateSkillRequestOptions(
            CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN, TEST_LOCALE_1, TEST_LOCALE_2
        );
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -l ${TEST_LOCALE_1},${TEST_LOCALE_2}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 202, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        sinon.stub(helper, 'pollingSkillValidationResult').callsArgWith(4, null, TEST_GET_VALIDATION_MESSAGE);

        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(
                `Validation created for validation id: ${TEST_VALIDATION_ID}`
                + `${TEST_GET_VALIDATION_MESSAGE}`
            );
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response error', (done) => {
        const inputOptions = createValidateSkillRequestOptions(
            CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN, TEST_LOCALE_1, TEST_LOCALE_2
        );
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -l ${TEST_LOCALE_1},${TEST_LOCALE_2}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with status code >= 300', (done) => {
        const inputOptions = createValidateSkillRequestOptions(
            CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN, TEST_LOCALE_1, TEST_LOCALE_2
        );
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -l ${TEST_LOCALE_1},${TEST_LOCALE_2}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can handle http response with no response body', (done) => {
        const inputOptions = createValidateSkillRequestOptions(
            CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_DEFAULT_PROFILE_TOKEN, TEST_LOCALE_1, TEST_LOCALE_2
        );
        const cmd = `ask api validate-skill -s ${TEST_SKILL_ID} -l ${TEST_LOCALE_1},${TEST_LOCALE_2}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [inputOptions, operation],
            output: [null, { statusCode: 202 }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Error: No response body from service request.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
