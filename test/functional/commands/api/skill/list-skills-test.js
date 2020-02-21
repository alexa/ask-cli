const { expect } = require('chai');
const R = require('ramda');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-skills', () => {
    const operation = 'list-skills';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_VALID_PROFILE = ApiCommandBasicTest.testDataProvider.VALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_VALID_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.VALID_PROFILE_TOKEN;
    const TEST_ENV_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.ENV_PROFILE_TOKEN;
    const TEST_DEFAULT_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.DEFAULT_VENDOR_ID;
    const TEST_VALID_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.VALID_VENDOR_ID;
    const TEST_ENV_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.ENV_VENDOR_ID;
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_NEXT_TOKEN2 = 'NEXT_TOKEN_2';
    const TEST_MAX_RESULT = 30;
    const TEST_SKILLS_LIST_RESPONSE = {
        _links: 'internal links',
        lastUpdated: 'date',
        publicationStatus: 'DEVELOPMENT',
        skillId: 'skillId',
        stage: 'development'
    };
    const TEST_HTTP_RESPONSE_BODY = {
        skills: [TEST_SKILLS_LIST_RESPONSE]
    };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    // request options test object for non-traverse mode
    const requestOptionWithDefaultProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?nextToken=${TEST_NEXT_TOKEN1}`
        + `&maxResults=${TEST_MAX_RESULT}&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const requestOptionWithValidProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?nextToken=${TEST_NEXT_TOKEN1}`
        + `&maxResults=${TEST_MAX_RESULT}&vendorId=${TEST_VALID_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_VALID_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const requestOptionWithEnvVarProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?nextToken=${TEST_NEXT_TOKEN1}`
        + `&maxResults=${TEST_MAX_RESULT}&vendorId=${TEST_ENV_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_ENV_PROFILE_TOKEN },
        body: null,
        json: false
    };
    // request options test object for traverse mode for default profile
    const requestOptionWithDefaultProfile1st = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?maxResults=50&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithDefaultProfile1st = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN1,
        skills: [TEST_SKILLS_LIST_RESPONSE]
    };
    const requestOptionWithDefaultProfile2nd = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?maxResults=50`
        + `&nextToken=${TEST_NEXT_TOKEN1}&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithDefaultProfile2nd = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN2,
        skills: [TEST_SKILLS_LIST_RESPONSE]
    };
    const requestOptionWithDefaultProfile3rd = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?maxResults=50`
        + `&nextToken=${TEST_NEXT_TOKEN2}&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithDefaultProfile3rd = {
        isTruncated: false,
        skills: [TEST_SKILLS_LIST_RESPONSE]
    };
    // request options test object for traverse mode for a valid profile
    const requestOptionWithValidProfile1st = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?maxResults=50&vendorId=${TEST_VALID_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_VALID_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithValidProfile1st = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN1,
        skills: [TEST_SKILLS_LIST_RESPONSE]
    };
    const requestOptionWithValidProfile2nd = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?maxResults=50`
        + `&nextToken=${TEST_NEXT_TOKEN1}&vendorId=${TEST_VALID_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_VALID_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithValidProfile2nd = {
        isTruncated: false,
        skills: [TEST_SKILLS_LIST_RESPONSE]
    };
    // request options test object for traverse mode for env variable profile
    const requestOptionWithEnvVarProfile1st = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?maxResults=50&vendorId=${TEST_ENV_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_ENV_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithEnvVarProfile1st = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN1,
        skills: [TEST_SKILLS_LIST_RESPONSE]
    };
    const requestOptionWithEnvVarProfile2nd = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?maxResults=50`
        + `&nextToken=${TEST_NEXT_TOKEN1}&vendorId=${TEST_ENV_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_ENV_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithEnvVarProfile2nd = {
        isTruncated: false,
        skills: [TEST_SKILLS_LIST_RESPONSE]
    };

    describe('# list-skills with any option will make direct api request', () => {
        it('| print error when max-result is not a number', async () => {
            const cmd = 'ask api list-skills --max-results not_number';
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: max-results. Input should be a number.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when profile is invalid', async () => {
            const cmd = `ask api list-skills --max-results 10 -p ${TEST_INVALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken is specified for default profile but api request fails with no error response', async () => {
            const cmd = `ask api list-skills --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?nextToken=${TEST_NEXT_TOKEN1}`
                + `&vendorId=${TEST_DEFAULT_VENDOR_ID}&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
                method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
                body: null,
                json: false
            };
            const httpMockConfig = [{
                input: [requestOptionWithDefaultProfileWithoutMaxResults, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                const filteredResponse = TEST_HTTP_RESPONSE_BODY.skills;
                filteredResponse[0]._links = undefined;
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken is specified for default profile but api request fails', async () => {
            const cmd = `ask api list-skills --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?nextToken=${TEST_NEXT_TOKEN1}`
                + `&vendorId=${TEST_DEFAULT_VENDOR_ID}&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
                method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
                body: null,
                json: false
            };
            const httpMockConfig = [{
                input: [requestOptionWithDefaultProfileWithoutMaxResults, operation],
                output: [null, { statusCode: 401, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                const filteredResponse = TEST_HTTP_RESPONSE_BODY.skills;
                filteredResponse[0]._links = undefined;
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken is specified for default profile', async () => {
            const cmd = `ask api list-skills --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?nextToken=${TEST_NEXT_TOKEN1}`
                + `&vendorId=${TEST_DEFAULT_VENDOR_ID}&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
                method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
                body: null,
                json: false
            };
            const httpMockConfig = [{
                input: [requestOptionWithDefaultProfileWithoutMaxResults, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(R.omit(['_links'], TEST_HTTP_RESPONSE_BODY)));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when only maxResults is specified for default profile', async () => {
            const cmd = 'ask api list-skills --max-results 10';
            const envVar = {};
            const requestOptionWithDefaultProfileWithOnlyMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills?`
                + `maxResults=10&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
                method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
                body: null,
                json: false
            };
            const httpMockConfig = [{
                input: [requestOptionWithDefaultProfileWithOnlyMaxResults, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(R.omit(['_links'], TEST_HTTP_RESPONSE_BODY)));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken and maxResult are specified when profile is default profile', async () => {
            const cmd = `ask api list-skills --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionWithDefaultProfile, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(R.omit(['_links'], TEST_HTTP_RESPONSE_BODY)));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken and maxResult are specified when profile is valid profile', async () => {
            const cmd = `ask api list-skills --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT} -p ${TEST_VALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionWithValidProfile, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(R.omit(['_links'], TEST_HTTP_RESPONSE_BODY)));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken and maxResult are specified when profile is set by env variable', async () => {
            const cmd = `ask api list-skills --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {
                AWS_ACCESS_KEY_ID: 1,
                AWS_SECRET_ACCESS_KEY: 2,
                ASK_REFRESH_TOKEN: 3,
                ASK_VENDOR_ID: TEST_ENV_VENDOR_ID
            };
            const httpMockConfig = [{
                input: [requestOptionWithEnvVarProfile, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(R.omit(['_links'], TEST_HTTP_RESPONSE_BODY)));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });

    describe('# list-skills without options traverses the list automatically', () => {
        it('| list all the skills when no option set for default profile but fails the request in the middle', async () => {
            const cmd = 'ask api list-skills';
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionWithDefaultProfile1st, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithDefaultProfile1st }]
                },
                {
                    input: [requestOptionWithDefaultProfile2nd, operation],
                    output: [null, { statusCode: 400, body: TEST_ERROR_MESSAGE }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| iteratively list all the skills when no option set for default profile', async () => {
            const cmd = 'ask api list-skills';
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionWithDefaultProfile1st, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithDefaultProfile1st }]
                },
                {
                    input: [requestOptionWithDefaultProfile2nd, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithDefaultProfile2nd }]
                },
                {
                    input: [requestOptionWithDefaultProfile3rd, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithDefaultProfile3rd }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    skills: [
                        R.omit(['_links'], TEST_SKILLS_LIST_RESPONSE),
                        R.omit(['_links'], TEST_SKILLS_LIST_RESPONSE),
                        R.omit(['_links'], TEST_SKILLS_LIST_RESPONSE)
                    ]
                };
                expect(msgCatcher.info).equal(jsonView.toString(aggregatedResult));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| iteratively list all the skills when no option set and with a valid profile', async () => {
            const cmd = `ask api list-skills -p ${TEST_VALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionWithValidProfile1st, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithValidProfile1st }]
                },
                {
                    input: [requestOptionWithValidProfile2nd, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithValidProfile2nd }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    skills: [
                        R.omit(['_links'], TEST_SKILLS_LIST_RESPONSE),
                        R.omit(['_links'], TEST_SKILLS_LIST_RESPONSE)
                    ]
                };
                expect(msgCatcher.info).equal(jsonView.toString(aggregatedResult));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| iteratively list all the skills when no option set and with an env variable profile', async () => {
            const cmd = 'ask api list-skills';
            const envVar = {
                AWS_ACCESS_KEY_ID: 1,
                AWS_SECRET_ACCESS_KEY: 2,
                ASK_REFRESH_TOKEN: 3,
                ASK_VENDOR_ID: TEST_ENV_VENDOR_ID
            };
            const httpMockConfig = [
                {
                    input: [requestOptionWithEnvVarProfile1st, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithEnvVarProfile1st }]
                },
                {
                    input: [requestOptionWithEnvVarProfile2nd, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithEnvVarProfile2nd }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    skills: [
                        R.omit(['_links'], TEST_SKILLS_LIST_RESPONSE),
                        R.omit(['_links'], TEST_SKILLS_LIST_RESPONSE)
                    ]
                };
                expect(msgCatcher.info).equal(jsonView.toString(aggregatedResult));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
