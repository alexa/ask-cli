const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-catalog-uploads', () => {
    const operation = 'list-catalog-uploads';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_NEXT_TOKEN2 = 'NEXT_TOKEN_2';
    const TEST_MAX_RESULT = 30;
    const TEST_CATALOG_ID = 'CATALOG_ID';
    const TEST_CATALOG_UPLOADS_LIST_RESPONSE = {
        id: 'ID',
        catalogId: 'CATALOG_ID',
        status: 'STATUS',
        createdDate: 'CREATED_DATE',
        lastUpdatedDate: 'LAST_UPDATED_DATE'
    };
    const TEST_HTTP_RESPONSE_BODY = {
        uploads: [TEST_CATALOG_UPLOADS_LIST_RESPONSE]
    };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    // request options test object for non-traverse mode
    const requestOptionWithDefaultProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs/${TEST_CATALOG_ID}/uploads?nextToken=${TEST_NEXT_TOKEN1}\
&maxResults=${TEST_MAX_RESULT}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    // request options test object for traverse mode for default profile
    const requestOptionWithDefaultProfileFirst = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs/${TEST_CATALOG_ID}/uploads?maxResults=\
${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listCatalogUploadsResponseWithDefaultProfileFirst = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN1,
        uploads: [TEST_CATALOG_UPLOADS_LIST_RESPONSE]
    };
    const requestOptionWithDefaultProfileSecond = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs/${TEST_CATALOG_ID}/uploads?maxResults=\
${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}&nextToken=${TEST_NEXT_TOKEN1}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listCatalogUploadsResponseWithDefaultProfileSecond = {
        isTruncated: true,
        nextToken: TEST_NEXT_TOKEN2,
        uploads: [TEST_CATALOG_UPLOADS_LIST_RESPONSE]
    };
    const requestOptionWithDefaultProfileThird = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs/${TEST_CATALOG_ID}/uploads?maxResults=\
${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}&nextToken=${TEST_NEXT_TOKEN2}`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const listCatalogUploadsResponseWithDefaultProfileThird = {
        isTruncated: false,
        uploads: [TEST_CATALOG_UPLOADS_LIST_RESPONSE]
    };

    it('| print error when catalog-id is not provided', (done) => {
        const cmd = 'ask api list-catalog-uploads';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: catalog-id. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    describe('# list-catalog-uploads with any option will make direct api request', () => {
        it('| print error when max-result is not a number', (done) => {
            const cmd = `ask api list-catalog-uploads --catalog-id ${TEST_CATALOG_ID} --max-results not_number`;
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
            const cmd = `ask api list-catalog-uploads --catalog-id ${TEST_CATALOG_ID} --max-results 10 -p ${TEST_INVALID_PROFILE}`;
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

        it('| list-catalog-uploads when nextToken is specified for default profile but api request fails with no error response', (done) => {
            const cmd = `ask api list-catalog-uploads --catalog-id ${TEST_CATALOG_ID} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs/${TEST_CATALOG_ID}/uploads?nextToken=${TEST_NEXT_TOKEN1}\
&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
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

        it('| list-catalog-uploads when nextToken is specified for default profile but api request fails', (done) => {
            const cmd = `ask api list-catalog-uploads --catalog-id ${TEST_CATALOG_ID} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs/${TEST_CATALOG_ID}/uploads?nextToken=${TEST_NEXT_TOKEN1}\
&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
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

        it('| list-catalog-uploads when nextToken is specified for default profile', (done) => {
            const cmd = `ask api list-catalog-uploads --catalog-id ${TEST_CATALOG_ID} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const requestOptionWithDefaultProfileWithoutMaxResults = {
                url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs/${TEST_CATALOG_ID}/uploads?nextToken=${TEST_NEXT_TOKEN1}\
&maxResults=${CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE}`,
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

        it('| list-catalog-uploads when nextToken and maxResult are specified when profile is default profile', (done) => {
            const cmd = `ask api list-catalog-uploads --catalog-id ${TEST_CATALOG_ID} --next-token ${TEST_NEXT_TOKEN1} \
--max-results ${TEST_MAX_RESULT}`;
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

    describe('# list-catalog-uploads without options traverses the list automatically', () => {
        it('| list all the skills when no option set for default profile but fails the request in the middle', (done) => {
            const cmd = `ask api list-catalog-uploads --catalog-id ${TEST_CATALOG_ID}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionWithDefaultProfileFirst, operation],
                    output: [null, { statusCode: 200, body: listCatalogUploadsResponseWithDefaultProfileFirst }]
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

        it('| iteratively list all the uploads when no option set for default profile', (done) => {
            const cmd = `ask api list-catalog-uploads --catalog-id ${TEST_CATALOG_ID}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionWithDefaultProfileFirst, operation],
                    output: [null, { statusCode: 200, body: listCatalogUploadsResponseWithDefaultProfileFirst }]
                },
                {
                    input: [requestOptionWithDefaultProfileSecond, operation],
                    output: [null, { statusCode: 200, body: listCatalogUploadsResponseWithDefaultProfileSecond }]
                },
                {
                    input: [requestOptionWithDefaultProfileThird, operation],
                    output: [null, { statusCode: 200, body: listCatalogUploadsResponseWithDefaultProfileThird }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                const aggregatedResult = {
                    uploads: [
                        TEST_CATALOG_UPLOADS_LIST_RESPONSE,
                        TEST_CATALOG_UPLOADS_LIST_RESPONSE,
                        TEST_CATALOG_UPLOADS_LIST_RESPONSE
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
