const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api get-manifest', () => {
    const operation = 'get-manifest';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_VALID_PROFILE = ApiCommandBasicTest.testDataProvider.VALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_VALID_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.VALID_PROFILE_TOKEN;
    const TEST_ENV_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.ENV_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'TEST_SKILL_ID';
    const TEST_DEVELOPMENT_STAGE = CONSTANTS.SKILL.STAGE.DEVELOPMENT;
    const TEST_LIVE_STAGE = CONSTANTS.SKILL.STAGE.LIVE;
    const TEST_INVALID_STAGE = 'TEST_INVALID_STAGE';
    const TEST_LOCATION = 'TEST_LOCATION';
    const TEST_HTTP_RESPONSE_BODY = { TEST: 'TEST_RESPONSE_BODY' };
    const TEST_ERROR_MESSAGE = 'TEST_ERROR_MESSAGE';

    const getManifestRequestOptionsWithDevelopmentStage = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/manifest`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const getManifestRequestOptionsWithLiveStage = {
        url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_LIVE_STAGE}/manifest`,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null,
        json: false
    };
    const redirectRequestOptions = {
        url: TEST_LOCATION,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
        body: null
    }

    it('| print error when skill-id is not provided', (done) => {
        const cmd = 'ask api get-manifest';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.')
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            done();
        };
        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input stage is invalid', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID} -g ${TEST_INVALID_STAGE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set to default ', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getManifestRequestOptionsWithDevelopmentStage, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set by env variable', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID}`;
        const requestOptions = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/manifest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_ENV_PROFILE_TOKEN },
            body: null,
            json: false
        };
        const envVar = {
            AWS_ACCESS_KEY_ID: 1,
            AWS_SECRET_ACCESS_KEY: 2,
            ASK_REFRESH_TOKEN: 3,
            ASK_VENDOR_ID: 4
        };
        const httpMockConfig = [{
            input: [requestOptions, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY}]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| can get correct http response when profile is set by valid input', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID} -p ${TEST_VALID_PROFILE}`;
        const requestOptions = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/manifest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET,
            headers: { authorization: TEST_VALID_PROFILE_TOKEN },
            body: null,
            json: false
        };
        const envVar = {};
        const httpMockConfig = [{
            input: [requestOptions, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY}]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| getManifest function can handle http response error', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getManifestRequestOptionsWithDevelopmentStage, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| getManifest function can handle http response with status code < 300', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getManifestRequestOptionsWithDevelopmentStage, operation],
            output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY}]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| getManifest function can handle http response with status code >= 300 (except 303)', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [{
            input: [getManifestRequestOptionsWithDevelopmentStage, operation],
            output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY}]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| when statusCode is 303, smapiRedirectRequest function can handle error', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [
            {
                input: [getManifestRequestOptionsWithDevelopmentStage, operation],
                output: [null, { statusCode: 303, body: { location: TEST_LOCATION }}]
            },
            {
                input: [redirectRequestOptions, 'REDIRECT_URL'],
                output: [TEST_ERROR_MESSAGE, null]
            }
        ];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| when statusCode is 303, smapiRedirectRequest function can handle response with statusCode < 300', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID} -g ${TEST_LIVE_STAGE}`;
        const envVar = {};
        const httpMockConfig = [
            {
                input: [getManifestRequestOptionsWithLiveStage, operation],
                output: [null, { statusCode: 303, body: { location: TEST_LOCATION }}]
            },
            {
                input: [redirectRequestOptions, 'REDIRECT_URL'],
                output: [null, { statusCode: 200, body: TEST_HTTP_RESPONSE_BODY }]
            }
        ];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| when statusCode is 303, smapiRedirectRequest function can handle response with statusCode >= 300', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [
            {
                input: [getManifestRequestOptionsWithDevelopmentStage, operation],
                output: [null, { statusCode: 303, body: { location: TEST_LOCATION }}]
            },
            {
                input: [redirectRequestOptions, 'REDIRECT_URL'],
                output: [null, { statusCode: 300, body: TEST_HTTP_RESPONSE_BODY }]
            }
        ];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_HTTP_RESPONSE_BODY));
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| when statusCode is 303, smapiRedirectRequest function can handle null location url', (done) => {
        const cmd = `ask api get-manifest -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [
            {
                input: [getManifestRequestOptionsWithDevelopmentStage, operation],
                output: [null, { statusCode: 303, body: {} }]
            }
        ];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('The redirect url from get-skill response is empty. Please try run this command with --debug for more details.');
            done();
        };

        new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
