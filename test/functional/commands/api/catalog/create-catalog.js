const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api create-catalog', () => {
    const operation = 'create-catalog';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_CATALOG_TYPE = 'CATALOG_TYPE';
    const TEST_CATALOG_TITLE = 'CATALOG_TITLE';
    const TEST_CATALOG_USAGE = 'CATALOG_USAGE';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_DEFAULT_VENDOR_ID = ApiCommandBasicTest.testDataProvider.VALID_VENDOR_ID.DEFAULT_VENDOR_ID;

    const requestOptionsWithDefaultProfile = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V0}/catalogs`,
        method: CONSTANTS.HTTP_REQUEST.VERB.POST,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: {
            vendorId: TEST_DEFAULT_VENDOR_ID,
            title: TEST_CATALOG_TITLE,
            type: TEST_CATALOG_TYPE,
            usage: TEST_CATALOG_USAGE
        },
        json: true
    };

    it('| print error when catalog-type is not provided', (done) => {
        const cmd = `ask api create-catalog --catalog-title ${TEST_CATALOG_TITLE} --catalog-usage ${TEST_CATALOG_USAGE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: catalog-type. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when catalog-title is not provided', (done) => {
        const cmd = `ask api create-catalog --catalog-type ${TEST_CATALOG_TYPE} --catalog-usage ${TEST_CATALOG_USAGE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: catalog-title. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when catalog-usage is not provided', (done) => {
        const cmd = `ask api create-catalog --catalog-type ${TEST_CATALOG_TYPE} --catalog-title ${TEST_CATALOG_TITLE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: catalog-usage. Field is required and must be set.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', (done) => {
        const cmd = `ask api create-catalog --catalog-title ${TEST_CATALOG_TITLE} --catalog-type ${TEST_CATALOG_TYPE} \
--catalog-usage ${TEST_CATALOG_USAGE} -p ${TEST_INVALID_PROFILE}`;
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

    it('| can get correct http response when profile is set to default ', (done) => {
        const cmd = `ask api create-catalog --catalog-title ${TEST_CATALOG_TITLE} --catalog-type ${TEST_CATALOG_TYPE} \
--catalog-usage ${TEST_CATALOG_USAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
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

    it('| handle http request error', (done) => {
        const cmd = `ask api create-catalog --catalog-title ${TEST_CATALOG_TITLE} --catalog-type ${TEST_CATALOG_TYPE} \
--catalog-usage ${TEST_CATALOG_USAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.warn).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| handle SMAPI response with status code < 300', (done) => {
        const cmd = `ask api create-catalog --catalog-title ${TEST_CATALOG_TITLE} --catalog-type ${TEST_CATALOG_TYPE} \
--catalog-usage ${TEST_CATALOG_USAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
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

    it('| handle SMAPI response with status code >= 300', (done) => {
        const cmd = `ask api create-catalog --catalog-title ${TEST_CATALOG_TITLE} --catalog-type ${TEST_CATALOG_TYPE} \
--catalog-usage ${TEST_CATALOG_USAGE}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptionsWithDefaultProfile, operation],
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
});
