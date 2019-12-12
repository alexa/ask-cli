const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api search-task', () => {
    const operation = 'search-task';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'SKILL_ID';
    const TEST_SINGLE_KEYWORD = 'KEYWORD';
    const TEST_MULTIPLE_KEYWORDS = 'KEYWORD1,KEYWORD2';
    const TEST_MULTIPLE_KEYWORDS_QUERY_PARAM = 'KEYWORD1%2CKEYWORD2';
    const TEST_PROVIDER_SKILL_ID = 'PROVIDER_SKILL_ID';
    const TEST_MAX_RESULTS = '10';
    const TEST_NEXT_TOKEN = 'NEXT_TOKEN';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_TASK_SUMMARY_1 = { definition: 'taskSummary1' };
    const TEST_TASK_SUMMARY_2 = { definition: 'taskSummary2' };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    const TEST_PARAMS_DEFAULT = {
        nextToken: TEST_NEXT_TOKEN,
        maxResults: TEST_MAX_RESULTS,
        skillId: TEST_SKILL_ID,
        keywords: TEST_SINGLE_KEYWORD,
        providerSkillId: TEST_PROVIDER_SKILL_ID
    };
    const TEST_PARAMS_MULTIPLE_KEYWORDS = {
        nextToken: TEST_NEXT_TOKEN,
        maxResults: TEST_MAX_RESULTS,
        skillId: TEST_SKILL_ID,
        keywords: TEST_MULTIPLE_KEYWORDS_QUERY_PARAM,
        providerSkillId: TEST_PROVIDER_SKILL_ID
    };
    const TEST_PARAMS_NO_KEYWORDS = {
        nextToken: TEST_NEXT_TOKEN,
        maxResults: TEST_MAX_RESULTS,
        skillId: TEST_SKILL_ID,
        providerSkillId: TEST_PROVIDER_SKILL_ID
    };
    const TEST_PARAMS_AUTO_PAGINATION_FIRST_REQUEST = {
        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
        skillId: TEST_SKILL_ID,
        keywords: TEST_SINGLE_KEYWORD,
        providerSkillId: TEST_PROVIDER_SKILL_ID
    };
    const TEST_PARAMS_AUTO_PAGINATION_SECOND_REQUEST = {
        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
        nextToken: TEST_NEXT_TOKEN,
        skillId: TEST_SKILL_ID,
        keywords: TEST_SINGLE_KEYWORD,
        providerSkillId: TEST_PROVIDER_SKILL_ID
    };
    const TEST_PARAMS_NO_AUTO_PAGINATION_NO_NEXT_TOKEN = {
        maxResults: TEST_MAX_RESULTS,
        skillId: TEST_SKILL_ID,
        keywords: TEST_SINGLE_KEYWORD,
        providerSkillId: TEST_PROVIDER_SKILL_ID
    };
    const TEST_PARAMS_NO_AUTO_PAGINATION_NO_MAX_RESULTS = {
        nextToken: TEST_NEXT_TOKEN,
        skillId: TEST_SKILL_ID,
        keywords: TEST_SINGLE_KEYWORD,
        providerSkillId: TEST_PROVIDER_SKILL_ID
    };

    const requestOptionGenerator = (queryParamJson) => {
        let requestUrl = `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/tasks/`;
        if (queryParamJson) {
            requestUrl += '?';
            Object.keys(queryParamJson).forEach((key) => {
                if (queryParamJson[key]) {
                    requestUrl += `${key}=${queryParamJson[key]}&`;
                }
            });
        }
        requestUrl = requestUrl.slice(0, -1);
        return {
            url: requestUrl,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: null,
            json: false
        };
    };

    const responseGenerator = (nextTokenValue, taskSummary, links = 'foobar') => ({
        _links: links,
        nextToken: nextTokenValue,
        taskSummaryList: taskSummary
    });

    it('| print error when skill-id is not provided', (done) => {
        const cmd = `ask api search-task --keywords ${TEST_SINGLE_KEYWORD} --provider-skill-id ${TEST_PROVIDER_SKILL_ID} `
        + `--max-results ${TEST_MAX_RESULTS} --next-token ${TEST_NEXT_TOKEN}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_SINGLE_KEYWORD} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle http request error', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_SINGLE_KEYWORD} --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`
        + ` --max-results ${TEST_MAX_RESULTS} --next-token ${TEST_NEXT_TOKEN}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionGenerator(TEST_PARAMS_DEFAULT), operation],
            output: [null, { statusCode: 401, body: TEST_ERROR_MESSAGE }]
        }];

        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle SMAPI response with status code >= 300', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_SINGLE_KEYWORD} --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`
        + ` --max-results ${TEST_MAX_RESULTS} --next-token ${TEST_NEXT_TOKEN}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionGenerator(TEST_PARAMS_DEFAULT), operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).include(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| search task with skill-id, keywords and provider-skill-id defined', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_SINGLE_KEYWORD} --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`
        + ` --max-results ${TEST_MAX_RESULTS} --next-token ${TEST_NEXT_TOKEN}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionGenerator(TEST_PARAMS_DEFAULT), operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).include(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| search task with multiple keywords', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_MULTIPLE_KEYWORDS}`
        + ` --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`
        + ` --max-results ${TEST_MAX_RESULTS} --next-token ${TEST_NEXT_TOKEN}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionGenerator(TEST_PARAMS_MULTIPLE_KEYWORDS), operation],
            output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN, [TEST_TASK_SUMMARY_1, TEST_TASK_SUMMARY_2]) }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).deep.equal(jsonView.toString({
                nextToken: TEST_NEXT_TOKEN,
                taskSummaryList: [TEST_TASK_SUMMARY_1, TEST_TASK_SUMMARY_2]
            }));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| search task with auto-pagination', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_SINGLE_KEYWORD}`
        + ` --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [
            {
                input: [requestOptionGenerator(TEST_PARAMS_AUTO_PAGINATION_FIRST_REQUEST), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN, [TEST_TASK_SUMMARY_1]) }]
            },
            {
                input: [requestOptionGenerator(TEST_PARAMS_AUTO_PAGINATION_SECOND_REQUEST), operation],
                output: [null, { statusCode: 200, body: responseGenerator(null, [TEST_TASK_SUMMARY_2]) }]
            }
        ];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).deep.equal(jsonView.toString({
                taskSummaryList: [TEST_TASK_SUMMARY_1, TEST_TASK_SUMMARY_2]
            }));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });


    it('| search task with auto-pagination http request error', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_SINGLE_KEYWORD}`
        + ` --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [
            {
                input: [requestOptionGenerator(TEST_PARAMS_AUTO_PAGINATION_FIRST_REQUEST), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN, [TEST_TASK_SUMMARY_1]) }]
            },
            {
                input: [requestOptionGenerator(TEST_PARAMS_AUTO_PAGINATION_SECOND_REQUEST), operation],
                output: [null, { statusCode: 401, body: TEST_ERROR_MESSAGE }]
            }
        ];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| search task with no auto-pagination, no next-token', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_SINGLE_KEYWORD} --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`
        + ` --max-results ${TEST_MAX_RESULTS}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionGenerator(TEST_PARAMS_NO_AUTO_PAGINATION_NO_NEXT_TOKEN), operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).include(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| search task with no auto-pagination, no max-results', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID} --keywords ${TEST_SINGLE_KEYWORD} --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`
        + ` --next-token ${TEST_NEXT_TOKEN}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionGenerator(TEST_PARAMS_NO_AUTO_PAGINATION_NO_MAX_RESULTS), operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).include(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| search task with no keywords', (done) => {
        const cmd = `ask api search-task --skill-id ${TEST_SKILL_ID}`
        + ` --provider-skill-id ${TEST_PROVIDER_SKILL_ID}`
        + ` --max-results ${TEST_MAX_RESULTS} --next-token ${TEST_NEXT_TOKEN}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionGenerator(TEST_PARAMS_NO_KEYWORDS), operation],
            output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN, [TEST_TASK_SUMMARY_1, TEST_TASK_SUMMARY_2]) }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).deep.equal(jsonView.toString({
                nextToken: TEST_NEXT_TOKEN,
                taskSummaryList: [TEST_TASK_SUMMARY_1, TEST_TASK_SUMMARY_2]
            }));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
