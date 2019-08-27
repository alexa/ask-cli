const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api intent-requests-history', () => {
    const operation = 'intent-requests-history';
    const TEST_CLI_CMD = 'ask api intent-requests-history';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_STAGE = CONSTANTS.SKILL.STAGE.LIVE;
    const TEST_LOCALE = 'en-US';
    const TEST_SORT_DIRECTION = 'asc';
    const TEST_SORT_FIELD = 'publicationStatus';
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_NEXT_TOKEN2 = 'NEXT_TOKEN_2';
    const TEST_FILTERS = 'Name=locale,Values=en-US,en-GB';
    const TEST_FILTERS_1 = 'Name=locale,Values=en-US,en-GB;Name=intent.name,Values=PlayMusic,StopMusic;Name=locale,Values=en-MX';
    const TEST_FILTERS_1_QUERY_PARAM = 'locale=en-US&locale=en-GB&locale=en-MX&intent.name=PlayMusic&intent.name=StopMusic';
    const TEST_INVALID_FILTERS = 'Name=locale,Values=,';
    const TEST_FILTERS_IN_QUERY_PARAM = 'locale=en-US&locale=en-GB';
    const TEST_MAX_RESULT = CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INTENT_REQUESTS_HISTORY_RESPONSE = {
        dialogAct: 'test dialogAct',
        intent: 'test intent',
        slots: 'test slots',
        locale: TEST_LOCALE,
        interactionType: 'test interactionType',
        stage: TEST_STAGE,
        publicationStatus: 'test publicationStatus',
        utteranceText: 'test utteranceText'
    };
    const TEST_HTTP_RESPONSE_BODY = {
        items: [TEST_INTENT_REQUESTS_HISTORY_RESPONSE]
    };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    // request options test object for traverse mode

    function createSmapiBaseUrl(skillId) {
        return `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${skillId}/history/intentRequests`;
    }

    function checkAndAppendDelimiter(url) {
        const lastChar = url[url.length - 1];
        if (lastChar === '?') {
            return url;
        }
        return `${url}&`;
    }

    function createIntentRequestsHistoryRequestOptions(
        skillId, filters, nextToken, maxResult, sortDirection, sortField, profileToken
    ) {
        let url = `${createSmapiBaseUrl(skillId)}?`;

        if (filters) {
            url += filters;
        }

        if (maxResult) {
            url = checkAndAppendDelimiter(url);
            url += `maxResults=${maxResult}`;
        }

        if (sortDirection) {
            url = checkAndAppendDelimiter(url);
            url += `sortDirection=${sortDirection}`;
        }

        if (sortField) {
            url = checkAndAppendDelimiter(url);
            url += `sortField=${sortField}`;
        }

        if (nextToken) {
            url = checkAndAppendDelimiter(url);
            url += `nextToken=${nextToken}`;
        }
        return {
            url,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: profileToken },
            body: null,
            json: false
        };
    }

    describe('# intent-requests-history with any option will make direct api request', () => {
        it('| print error when --skill-id is not provided', (done) => {
            const cmd = TEST_CLI_CMD;
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

        it('| print error when max-result is not a number', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --max-results not_number`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: max-results. Input should be a number.');
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when sort-direction is invalid', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --sort-direction invalid`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: sort-direction. Value must be in (asc, desc).');
                done();
            };

            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when profile is invalid', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`;
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

        it('| get intent-requests-history when nextToken is specified but api request fails', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, TEST_NEXT_TOKEN1, null, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when nextToken is specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, TEST_NEXT_TOKEN1, null, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.warn).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when invalid filters are specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --filters ${TEST_INVALID_FILTERS}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, TEST_INVALID_FILTERS, null, null, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('[Error] : No parsable value(s) for Name=locale. Please verify "--filters" parameter is a double-quote-qualified, semicolon-delimited list of name/value pairs, for instance: "Name=intent.name,Values=MyIntent,YourIntent;Name=interactionType,Value=MODAL".');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when invalid filters are specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --filters invalidFilter`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, 'invalidFilter', null, null, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('[Error] : Invalid name/value pair. Please verify "--filters" parameter is a double-quote-qualified, semicolon-delimited list of name/value pairs, for instance: "Name=intent.name,Values=MyIntent,YourIntent;Name=interactionType,Value=MODAL".');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when valid filters are specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --filters ${TEST_FILTERS_1}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, TEST_FILTERS_1_QUERY_PARAM, null, null, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.warn).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when maxResults is specified but api request fails', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, null, TEST_MAX_RESULT, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when maxResults is specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, null, TEST_MAX_RESULT, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.warn).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when sortDirection is specified but api request fails', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --sort-direction ${TEST_SORT_DIRECTION}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, null, null, TEST_SORT_DIRECTION, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when sortDirection is specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --sort-direction ${TEST_SORT_DIRECTION}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, null, null, TEST_SORT_DIRECTION, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.warn).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when sortField is specified but api request fails with no error response', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --sort-field ${TEST_SORT_FIELD}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, null, null, null, TEST_SORT_FIELD, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when sortField is specified but api request fails', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --sort-field ${TEST_SORT_FIELD}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, null, null, null, TEST_SORT_FIELD, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when sortField is specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --sort-field ${TEST_SORT_FIELD}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, null, null, null, TEST_SORT_FIELD, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.warn).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history when filters, nextToken, maxResult, sortDirection, sortField are specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID} --filters ${TEST_FILTERS}`
             + ` --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`
             + ` --sort-direction ${TEST_SORT_DIRECTION} --sort-field ${TEST_SORT_FIELD}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, TEST_FILTERS_IN_QUERY_PARAM, TEST_NEXT_TOKEN1, TEST_MAX_RESULT, TEST_SORT_DIRECTION, TEST_SORT_FIELD, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.warn).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| get intent-requests-history no options are specified', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID}`;
            const envVar = {};
            const requestOption = createIntentRequestsHistoryRequestOptions(
                TEST_SKILL_ID, null, null, TEST_MAX_RESULT, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.warn).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });

    describe('# get intent-requests-history without options traverses the list automatically', () => {
        const requestOptionForTraverseMode1st = {
            url: `${createSmapiBaseUrl(TEST_SKILL_ID)}?maxResults=50`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: null,
            json: false
        };
        const getIntentRequestsHistoryResponse1st = {
            isTruncated: true,
            nextToken: TEST_NEXT_TOKEN1,
            items: [TEST_INTENT_REQUESTS_HISTORY_RESPONSE]
        };
        const requestOptionForTraverseMode2nd = {
            url: `${createSmapiBaseUrl(TEST_SKILL_ID)}?maxResults=50&nextToken=${TEST_NEXT_TOKEN1}`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: null,
            json: false
        };
        const getIntentRequestsHistoryResponse2nd = {
            isTruncated: true,
            nextToken: TEST_NEXT_TOKEN2,
            items: [TEST_INTENT_REQUESTS_HISTORY_RESPONSE]
        };
        const requestOptionForTraverseMode3rd = {
            url: `${createSmapiBaseUrl(TEST_SKILL_ID)}?maxResults=50&nextToken=${TEST_NEXT_TOKEN2}`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: null,
            json: false
        };
        const getIntentRequestsHistoryResponse3rd = {
            isTruncated: false,
            items: [TEST_INTENT_REQUESTS_HISTORY_RESPONSE]
        };

        it('| list all the intent requests when no option set but fails the request in the middle', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionForTraverseMode1st, operation],
                    output: [null, { statusCode: 200, body: getIntentRequestsHistoryResponse1st }]
                },
                {
                    input: [requestOptionForTraverseMode2nd, operation],
                    output: [null, { statusCode: 400, body: TEST_ERROR_MESSAGE }]
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

        it('| iteratively list all the intent requests when no option set', (done) => {
            const cmd = `${TEST_CLI_CMD} -s ${TEST_SKILL_ID}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionForTraverseMode1st, operation],
                    output: [null, { statusCode: 200, body: getIntentRequestsHistoryResponse1st }]
                },
                {
                    input: [requestOptionForTraverseMode2nd, operation],
                    output: [null, { statusCode: 200, body: getIntentRequestsHistoryResponse2nd }]
                },
                {
                    input: [requestOptionForTraverseMode3rd, operation],
                    output: [null, { statusCode: 200, body: getIntentRequestsHistoryResponse3rd }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    items: [
                        TEST_INTENT_REQUESTS_HISTORY_RESPONSE,
                        TEST_INTENT_REQUESTS_HISTORY_RESPONSE,
                        TEST_INTENT_REQUESTS_HISTORY_RESPONSE
                    ]
                };
                expect(msgCatcher.info).equal(jsonView.toString(aggregatedResult));
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.warn).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
