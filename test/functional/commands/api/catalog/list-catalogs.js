const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-catalogs', () => {
    const operation = 'list-catalogs';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_NEXT_TOKEN2 = 'NEXT_TOKEN_2';
    const TEST_MAX_RESULT = 30;
    const TEST_CATALOGS_LIST_RESPONSE = {
        id: 'ID',
        title: 'TITLE',
        type: 'TYPE',
        usage: 'USAGE',
        lastUpdatedDate: 'LAST_UPDATED_DATE',
        createdDate: 'CREATED_DATE',
        associatedSkillIds: ['SKILL_ID']
    };
    const TEST_HTTP_RESPONSE_BODY = {
        catalogs: [TEST_CATALOGS_LIST_RESPONSE]
    };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };
    const TEST_DEFAULT_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.DEFAULT_VENDOR_ID;

    // request options test object for non-traverse mode
    const requestOptionWithDefaultProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs?nextToken=${TEST_NEXT_TOKEN1}&maxResults=${TEST_MAX_RESULT}\
&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    // request options test object for traverse mode for default profile
    const requestOptionWithDefaultProfileFirst = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs?maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}\
&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithDefaultProfileFirst = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN1,
        catalogs: [TEST_CATALOGS_LIST_RESPONSE]
    };
    const requestOptionWithDefaultProfileSecond = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs?maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}\
&nextToken=${TEST_NEXT_TOKEN1}&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithDefaultProfileSecond = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN2,
        catalogs: [TEST_CATALOGS_LIST_RESPONSE]
    };
    const requestOptionWithDefaultProfileThird = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs?maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}\
&nextToken=${TEST_NEXT_TOKEN2}&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listSkillResponseWithDefaultProfileThird = {
        isTruncated: false,
        catalogs: [TEST_CATALOGS_LIST_RESPONSE]
    };

    describe('# list-catalogs with any option will make direct api request', () => {
        it('| print error when max-result is not a number', (done) => {
            const cmd = 'ask api list-catalogs --max-results not_number';
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

        it('| print error when profile is invalid', (done) => {
            const cmd = `ask api list-catalogs --max-results 10 -p ${TEST_INVALID_PROFILE}`;
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

        it('| list-catalogs when nextToken is specified for default profile but api request fails with no error response', (done) => {
            const cmd = `ask api list-catalogs --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs?nextToken=${TEST_NEXT_TOKEN1}\
&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
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
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list-catalogs when nextToken is specified for default profile but api request fails', (done) => {
            const cmd = `ask api list-catalogs --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs?nextToken=${TEST_NEXT_TOKEN1}\
&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
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
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('[Fatal]: SMAPI error code 401. No response body from the service request.');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list-catalogs when nextToken is specified for default profile', (done) => {
            const cmd = `ask api list-catalogs --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs\
?nextToken=${TEST_NEXT_TOKEN1}&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}&vendorId=${TEST_DEFAULT_VENDOR_ID}`,
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
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list-catalogs when nextToken and maxResult are specified when profile is default profile', (done) => {
            const cmd = `ask api list-catalogs --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionWithDefaultProfile, operation],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });

    describe('# list-catalogs without options traverses the list automatically', () => {
        it('| list all the skills when no option set for default profile but fails the request in the middle', (done) => {
            const cmd = 'ask api list-catalogs';
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionWithDefaultProfileFirst, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithDefaultProfileFirst }]
                },
                {
                    input: [requestOptionWithDefaultProfileSecond, operation],
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

        it('| iteratively list all the catalogs when no option set for default profile', (done) => {
            const cmd = 'ask api list-catalogs';
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionWithDefaultProfileFirst, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithDefaultProfileFirst }]
                },
                {
                    input: [requestOptionWithDefaultProfileSecond, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithDefaultProfileSecond }]
                },
                {
                    input: [requestOptionWithDefaultProfileThird, operation],
                    output: [null, { statusCode: 200, body: listSkillResponseWithDefaultProfileThird }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    catalogs: [
                        TEST_CATALOGS_LIST_RESPONSE,
                        TEST_CATALOGS_LIST_RESPONSE,
                        TEST_CATALOGS_LIST_RESPONSE
                    ]
                };
                expect(msgCatcher.info).equal(jsonView.toString(aggregatedResult));
                expect(msgCatcher.warn).equal('');
                expect(msgCatcher.error).equal('');
                done();
            };
            new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
