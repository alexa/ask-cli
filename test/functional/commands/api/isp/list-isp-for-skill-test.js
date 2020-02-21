const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-isp-for-skill', () => {
    const operation = 'list-isp-for-skill';
    const TEST_COMMAND_PREFIX = 'ask api';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_SKILL_ID = '123';
    const TEST_MAX_RESULT = 30;
    const TEST_ISP_INFO1 = { content: '1' };
    const TEST_ISP_INFO2 = { content: '2' };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    const requestOptionGenerator = (stage, queryParamJson) => {
        let requestUrl = `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/`
            + `stages/${stage}/inSkillProducts`;
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

    const responseGenerator = (nextTokenValue, inSkillProducts, links = 'foobar') => ({
        _links: links,
        nextToken: nextTokenValue,
        inSkillProductSummaryList: inSkillProducts
    });

    describe('# list-skills with any option will make direct api request', () => {
        it('| print error when skill-id is not provided', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -g development`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when stage is not provided', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: stage. Field is required and must be set.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when stage is not valid', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID} -g notValid`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when max-result is not a number', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID} -g development --max-results not_number`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: max-results. Input should be a number.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list isp when nextToken is specified for default profile but api request fails', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID} -g development --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator('development', {
                    nextToken: TEST_NEXT_TOKEN1,
                    maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE
                }), operation],
                output: [null, { statusCode: 401, body: TEST_ERROR_MESSAGE }]
            }];

            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when input invalid profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID} -g development -p ${TEST_INVALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list isp when nextToken is specified for default profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID} -g development --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator('development', {
                    nextToken: TEST_NEXT_TOKEN1,
                    maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE
                }), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1, TEST_ISP_INFO2]) }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString({
                    nextToken: TEST_NEXT_TOKEN1,
                    inSkillProductSummaryList: [TEST_ISP_INFO1, TEST_ISP_INFO2]
                }));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list isp when nextToken and maxResult are specified when profile is default profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID} -g development`
                + ` --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator('development', {
                    nextToken: TEST_NEXT_TOKEN1,
                    maxResults: TEST_MAX_RESULT
                }), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1, TEST_ISP_INFO2]) }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString({
                    nextToken: TEST_NEXT_TOKEN1,
                    inSkillProductSummaryList: [TEST_ISP_INFO1, TEST_ISP_INFO2]
                }));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list all the isp when no option set for default profile but fails the request in the middle', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID} -g development`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionGenerator('development', {
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE
                    }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1]) }]
                },
                {
                    input: [requestOptionGenerator('development', {
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                        nextToken: TEST_NEXT_TOKEN1,
                    }), operation],
                    output: [null, { statusCode: 400, body: TEST_ERROR_MESSAGE }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| iteratively list all the isp when no option set for default profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -s ${TEST_SKILL_ID} -g development`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionGenerator('development', {
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE
                    }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1]) }]
                },
                {
                    input: [requestOptionGenerator('development', {
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                        nextToken: TEST_NEXT_TOKEN1,
                    }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(null, [TEST_ISP_INFO2]) }]
                }
            ];
            const expectedResponse = {
                inSkillProductSummaryList: [TEST_ISP_INFO1, TEST_ISP_INFO2],
            };
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString(expectedResponse));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
