const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-skills-for-isp', () => {
    const operation = 'list-skills-for-isp';
    const TEST_COMMAND_PREFIX = 'ask api';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_STAGE = 'development';
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_ISP_ID = '123';
    const TEST_MAX_RESULT = 30;
    const TEST_SKILL_INFO1 = { content: '1' };
    const TEST_SKILL_INFO2 = { content: '2' };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    const requestOptionGenerator = (stage, ispId, queryParamJson) => {
        let requestUrl = `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts/${ispId}/`
            + `stages/${stage}/skills`;
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
        associatedSkillIds: inSkillProducts
    });

    describe('# list-skills with any option will make direct api request', () => {
        it('| print error when isp-id is not provided', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -g ${TEST_STAGE}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: isp-id. Field is required and must be set.');
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when stage is not provided', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: stage. Field is required and must be set.');
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when stage is not valid', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g notValid`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when max-result is not a number', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g ${TEST_STAGE} --max-results not_number`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: max-results. Input should be a number.');
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken is specified for default profile but api request fails', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g ${TEST_STAGE} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator(TEST_STAGE, TEST_ISP_ID, {
                    nextToken: TEST_NEXT_TOKEN1,
                }), operation],
                output: [null, { statusCode: 401, body: TEST_ERROR_MESSAGE }]
            }];

            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when input invalid profile', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development -p ${TEST_INVALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken is specified for default profile', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator(TEST_STAGE, TEST_ISP_ID, {
                    nextToken: TEST_NEXT_TOKEN1,
                }), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_SKILL_INFO1, TEST_SKILL_INFO2]) }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString({
                    nextToken: TEST_NEXT_TOKEN1,
                    associatedSkillIds: [TEST_SKILL_INFO1, TEST_SKILL_INFO2]
                }));
                expect(msgCatcher.error).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken and maxResult are specified when profile is default profile', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development`
                + ` --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator(TEST_STAGE, TEST_ISP_ID, {
                    nextToken: TEST_NEXT_TOKEN1,
                    maxResults: TEST_MAX_RESULT,
                }), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_SKILL_INFO1, TEST_SKILL_INFO2]) }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString({
                    nextToken: TEST_NEXT_TOKEN1,
                    associatedSkillIds: [TEST_SKILL_INFO1, TEST_SKILL_INFO2]
                }));
                expect(msgCatcher.error).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list all the skills when no option set for default profile but fails the request in the middle', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionGenerator(TEST_STAGE, TEST_ISP_ID, { maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_SKILL_INFO1]) }]
                },
                {
                    input: [requestOptionGenerator(TEST_STAGE, TEST_ISP_ID, {
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                        nextToken: TEST_NEXT_TOKEN1
                    }), operation],
                    output: [null, { statusCode: 400, body: TEST_ERROR_MESSAGE }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| iteratively list all the skills when no option set for default profile', (done) => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -i ${TEST_ISP_ID} -g development`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionGenerator(TEST_STAGE, TEST_ISP_ID, { maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_SKILL_INFO1]) }]
                },
                {
                    input: [requestOptionGenerator(TEST_STAGE, TEST_ISP_ID, {
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                        nextToken: TEST_NEXT_TOKEN1
                    }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(null, [TEST_SKILL_INFO2]) }]
                }
            ];
            const expectedResponse = {
                associatedSkillIds: [TEST_SKILL_INFO1, TEST_SKILL_INFO2],
            };
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString(expectedResponse));
                expect(msgCatcher.error).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
