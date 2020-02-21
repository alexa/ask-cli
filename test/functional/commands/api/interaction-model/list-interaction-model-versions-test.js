const R = require('ramda');
const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-interaction-model-versions', () => {
    const operation = 'list-interaction-model-versions';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_STAGE = 'live';
    const TEST_LOCALE = 'en-US';
    const TEST_SORT_DIRECTION = 'asc';
    const TEST_SORT_FIELD = 'version';
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_NEXT_TOKEN2 = 'NEXT_TOKEN_2';
    const TEST_MAX_RESULT = 30;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INTERACTION_MODEL_VERSIONS_RESPONSE = {
        version: 'test version',
        creationTime: 'test creation time',
        description: 'test description',
        _links: 'internal links'
    };
    const TEST_HTTP_RESPONSE_BODY = {
        skillModelVersions: [TEST_INTERACTION_MODEL_VERSIONS_RESPONSE]
    };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    // request options test object for traverse mode

    function createSmapiBaseUrl(stage, locale) {
        return `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${stage}/`
        + `interactionModel/locales/${locale}/versions`;
    }

    function checkAndAppendDelimiter(url) {
        const lastChar = url[url.length - 1];
        if (lastChar === '?') {
            return url;
        }
        return `${url}&`;
    }

    function createListInteractionModelVersionsRequestOptions(
        stage, locale, nextToken, maxResult, sortDirection, sortField, profileToken
    ) {
        let url = `${createSmapiBaseUrl(stage, locale)}?`;

        if (nextToken) {
            url += `nextToken=${nextToken}`;
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

        return {
            url,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: profileToken },
            body: null,
            json: false
        };
    }

    describe('# list-interaction-model-versions with any option will make direct api request', () => {
        it('| print error when --skill-id is not provided', async () => {
            const cmd = 'ask api list-interaction-model-versions';
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when --locale is not provided', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: locale. Field is required and must be set.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when --stage provided is invalid', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} -g no_stage`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when max-result is not a number', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --max-results not_number`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: max-results. Input should be a number.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when sort-direction is invalid', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --sort-direction invalid`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: sort-direction. Value must be in (asc, desc).');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when profile is invalid', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} -p ${TEST_INVALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list interaction model versions when nextToken is specified but api request fails', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, TEST_NEXT_TOKEN1, null, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list interaction model versions when nextToken is specified', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, TEST_NEXT_TOKEN1, null, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list interaction model versions when maxResults is specified but api request fails', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, null, TEST_MAX_RESULT, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list interaction model versions when maxResults is specified', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, null, TEST_MAX_RESULT, null, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list interaction model versions when sortDirection is specified but api request fails', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --sort-direction ${TEST_SORT_DIRECTION}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, null, null, TEST_SORT_DIRECTION, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list interaction model versions when sortDirection is specified', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --sort-direction ${TEST_SORT_DIRECTION}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, null, null, TEST_SORT_DIRECTION, null, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list interaction model versions when sortField is specified but api request fails', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --sort-field ${TEST_SORT_FIELD}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, null, null, null, TEST_SORT_FIELD, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 401 }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list interaction model versions when sortField is specified', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} --sort-field ${TEST_SORT_FIELD}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, null, null, null, TEST_SORT_FIELD, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list skills when nextToken, maxResult, sortDirection, sortField are specified', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE}`
            + ` --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`
            + ` --sort-direction ${TEST_SORT_DIRECTION} --sort-field ${TEST_SORT_FIELD}`;
            const envVar = {};
            const requestOption = createListInteractionModelVersionsRequestOptions(
                CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE, TEST_NEXT_TOKEN1,
                TEST_MAX_RESULT, TEST_SORT_DIRECTION, TEST_SORT_FIELD, TEST_DEFAULT_PROFILE_TOKEN
            );
            const httpMockConfig = [{
                input: [requestOption, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });

    describe('# list-interaction-model-versions without options traverses the list automatically', () => {
        const requestOptionForTraverseMode1st = {
            url: `${createSmapiBaseUrl(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE)}?maxResults=50`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: null,
            json: false
        };
        const listInteractionModelVersionsResponse1st = {
            isTruncated: true,
            nextToken: TEST_NEXT_TOKEN1,
            skillModelVersions: [TEST_INTERACTION_MODEL_VERSIONS_RESPONSE]
        };
        const requestOptionForTraverseMode2nd = {
            url: `${createSmapiBaseUrl(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE)}?maxResults=50&nextToken=${TEST_NEXT_TOKEN1}`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: null,
            json: false
        };
        const listInteractionModelVersionsResponse2nd = {
            isTruncated: true,
            nextToken: TEST_NEXT_TOKEN2,
            skillModelVersions: [TEST_INTERACTION_MODEL_VERSIONS_RESPONSE]
        };
        const requestOptionForTraverseMode3rd = {
            url: `${createSmapiBaseUrl(CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_LOCALE)}?maxResults=50&nextToken=${TEST_NEXT_TOKEN2}`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: null,
            json: false
        };
        const listInteractionModelVersionsResponse3rd = {
            isTruncated: false,
            skillModelVersions: [TEST_INTERACTION_MODEL_VERSIONS_RESPONSE]
        };

        it('| list all the certifications when no option set but fails the request in the middle', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionForTraverseMode1st, operation],
                    output: [null, { statusCode: 200, body: listInteractionModelVersionsResponse1st }]
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

        it('| iteratively list all the skills when no option set', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionForTraverseMode1st, operation],
                    output: [null, { statusCode: 200, body: listInteractionModelVersionsResponse1st }]
                },
                {
                    input: [requestOptionForTraverseMode2nd, operation],
                    output: [null, { statusCode: 200, body: listInteractionModelVersionsResponse2nd }]
                },
                {
                    input: [requestOptionForTraverseMode3rd, operation],
                    output: [null, { statusCode: 200, body: listInteractionModelVersionsResponse3rd }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    skillModelVersions: [
                        R.omit(['_links'], TEST_INTERACTION_MODEL_VERSIONS_RESPONSE),
                        R.omit(['_links'], TEST_INTERACTION_MODEL_VERSIONS_RESPONSE),
                        R.omit(['_links'], TEST_INTERACTION_MODEL_VERSIONS_RESPONSE)
                    ]
                };
                expect(msgCatcher.info).equal(jsonView.toString(aggregatedResult));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list all the skills when no option set, stage provided', async () => {
            const cmd = `ask api list-interaction-model-versions -s ${TEST_SKILL_ID} -l ${TEST_LOCALE} -g ${TEST_STAGE}`;
            const envVar = {};
            const requestOptionWithStageForTraverseMode = {
                url: `${createSmapiBaseUrl(TEST_STAGE, TEST_LOCALE)}?maxResults=50`,
                method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
                body: null,
                json: false
            };
            const listInteractionModelVersionsResponse = {
                isTruncated: true,
                skillModelVersions: [TEST_INTERACTION_MODEL_VERSIONS_RESPONSE]
            };
            const httpMockConfig = [
                {
                    input: [requestOptionWithStageForTraverseMode, operation],
                    output: [null, { statusCode: 200, body: listInteractionModelVersionsResponse }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    skillModelVersions: [
                        R.omit(['_links'], TEST_INTERACTION_MODEL_VERSIONS_RESPONSE)
                    ]
                };
                expect(msgCatcher.info).equal(jsonView.toString(aggregatedResult));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
