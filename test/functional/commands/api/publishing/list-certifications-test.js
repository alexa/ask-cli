const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-certifications', () => {
    const operation = 'list-certifications';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_NEXT_TOKEN2 = 'NEXT_TOKEN_2';
    const TEST_MAX_RESULT = 30;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_CERTIFICATIONS_LIST_RESPONSE = {
        id: 'string',
        status: 'IN_PROGRESS',
        skillSubmissionTimestamp: 'TestSubmissionTimeStamp',
        reviewTrackingInfo: {
            estimatedCompletionTimestamp: 'testEstimatedCompletionTimestamp',
            actualCompletionTimestamp: 'testActualCompletionTimestamp',
            lastUpdated: 'testLastUpdated'
        }
    };
    const TEST_HTTP_RESPONSE_BODY = {
        items: [TEST_CERTIFICATIONS_LIST_RESPONSE]
    };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    // request options test object for non-traverse mode
    function createSmapiBaseUrl() {
        return `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/certifications`;
    }

    function checkAndAppendDelimiter(url) {
        const lastChar = url[url.length - 1];
        if (lastChar === '?') {
            return url;
        }
        return `${url}&`;
    }

    function createListCertificationsRequestOptions(nextToken, maxResult, profileToken) {
        let url = `${createSmapiBaseUrl()}?`;

        if (nextToken) {
            url += `nextToken=${nextToken}`;
        }

        if (maxResult) {
            url = checkAndAppendDelimiter(url);
            url += `maxResults=${maxResult}`;
        }

        return {
            url,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: profileToken },
            body: null,
            json: false
        };
    }
    // request options test object for traverse mode for default profile
    const requestOptionForTraverseMode1st = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/certifications?maxResults=50`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listCertificationsResponse1st = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN1,
        items: [TEST_CERTIFICATIONS_LIST_RESPONSE]
    };
    const requestOptionForTraverseMode2nd = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/certifications`
        + `?maxResults=50&nextToken=${TEST_NEXT_TOKEN1}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listCertificationsResponse2nd = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN2,
        items: [TEST_CERTIFICATIONS_LIST_RESPONSE]
    };
    const requestOptionForTraverseMode3rd = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/certifications`
        + `?maxResults=50&nextToken=${TEST_NEXT_TOKEN2}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listCertificationsResponse3rd = {
        isTruncated: false,
        items: [TEST_CERTIFICATIONS_LIST_RESPONSE]
    };

    describe('# list-certifications with any option will make direct api request', () => {
        it('| print error when --skill-id is not provided', async () => {
            const cmd = 'ask api list-certifications';
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when max-result is not a number', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID} --max-results not_number`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: max-results. Input should be a number.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when profile is invalid', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID} --max-results 10 -p ${TEST_INVALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list certifications when nextToken is specified but api request fails', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [createListCertificationsRequestOptions(TEST_NEXT_TOKEN1, null, TEST_DEFAULT_PROFILE_TOKEN), operation],
                output: [null, { statusCode: 401, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list certifications when nextToken is specified', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [createListCertificationsRequestOptions(TEST_NEXT_TOKEN1, null, TEST_DEFAULT_PROFILE_TOKEN), operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list certifications when maxResult is specified but api request fails', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [createListCertificationsRequestOptions(null, TEST_MAX_RESULT, TEST_DEFAULT_PROFILE_TOKEN), operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list certifications when maxResult is specified', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [createListCertificationsRequestOptions(null, TEST_MAX_RESULT, TEST_DEFAULT_PROFILE_TOKEN), operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list certifications when nextToken and maxResult are specified', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [createListCertificationsRequestOptions(TEST_NEXT_TOKEN1, TEST_MAX_RESULT, TEST_DEFAULT_PROFILE_TOKEN), operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });

    describe('# list-certifications without options traverses the list automatically', () => {
        it('| list all the certifications when no option set but fails the request in the middle', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionForTraverseMode1st, operation],
                    output: [null, { statusCode: 200, body: listCertificationsResponse1st }]
                },
                {
                    input: [requestOptionForTraverseMode2nd, operation],
                    output: [null, { statusCode: 400, body: TEST_ERROR_MESSAGE }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| iteratively list all the certifications when no option set', async () => {
            const cmd = `ask api list-certifications -s ${TEST_SKILL_ID}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionForTraverseMode1st, operation],
                    output: [null, { statusCode: 200, body: listCertificationsResponse1st }]
                },
                {
                    input: [requestOptionForTraverseMode2nd, operation],
                    output: [null, { statusCode: 200, body: listCertificationsResponse2nd }]
                },
                {
                    input: [requestOptionForTraverseMode3rd, operation],
                    output: [null, { statusCode: 200, body: listCertificationsResponse3rd }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    items: [
                        TEST_CERTIFICATIONS_LIST_RESPONSE, TEST_CERTIFICATIONS_LIST_RESPONSE, TEST_CERTIFICATIONS_LIST_RESPONSE
                    ]
                };
                expect(msgCatcher.info).equal(jsonView.toString(aggregatedResult));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
