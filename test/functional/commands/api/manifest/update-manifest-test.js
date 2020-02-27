const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api update-manifest', () => {
    const operation = 'update-manifest';
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_ENV_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.ENV_PROFILE_TOKEN;
    const TEST_SKILL_ID = 'SKILL_ID';
    const TEST_DEVELOPMENT_STAGE = CONSTANTS.SKILL.STAGE.DEVELOPMENT;
    const TEST_INVALID_STAGE = 'INVALID_STAGE';
    const TEST_FILE_PATH = path.join(process.cwd(), 'test', 'functional', 'fixture', 'manifest.json');
    const INVALID_FILE_PATH = path.join(process.cwd(), 'test', 'functional', 'fixture', 'invalid');
    const NO_ACCESS_FILE_PATH = path.join(process.cwd(), 'test', 'functional', 'fixture', 'no-read-access-file');
    const TEST_FILE_CONTENT = JSON.parse(fs.readFileSync(TEST_FILE_PATH, 'utf-8'));
    const TEST_ETAG = 'ETAG';
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_ERROR_RESPONSE = { TEST: TEST_ERROR_MESSAGE };

    after(() => {
        // guaranteed to convert the file access back
        fs.chmodSync(NO_ACCESS_FILE_PATH, 0o644);
    });

    it('| print error when --skill-id is not provided', async () => {
        const cmd = 'ask api update-manifest';
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: skill-id. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when --file is not provided', async () => {
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: file. Field is required and must be set.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input invalid profile', async () => {
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} -p ${TEST_INVALID_PROFILE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when input stage is invalid', async () => {
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} -g ${TEST_INVALID_STAGE}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    if (process.platform !== 'win32') {
        it('| print error when file access is not readable', async () => {
            fs.chmodSync(NO_ACCESS_FILE_PATH, 0o111);
            const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f ${NO_ACCESS_FILE_PATH}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: file. The provided file must have read permission.');
                fs.chmodSync(NO_ACCESS_FILE_PATH, 0o644);
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    }

    it('| print error when file input doesn not exist', async () => {
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f invalid.path`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal('Please provide valid input for option: file. File does not exist with the given path.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| print error when file is not JSON file', async () => {
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f ${INVALID_FILE_PATH}`;
        const envVar = {};
        const httpMockConfig = [];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).include('SyntaxError');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| get correct http response when profile is set to default', async () => {
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH} --etag ${TEST_ETAG}`;
        const envVar = {};
        const requestOptions = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/manifest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN, 'If-Match': TEST_ETAG },
            body: TEST_FILE_CONTENT,
            json: true
        };
        const httpMockConfig = [{
            input: [requestOptions, operation],
            output: [null, { statusCode: 202 }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal('Update manifest request submitted successfully.');
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| display error when response itself fails', async () => {
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const requestOptions = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/manifest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: TEST_FILE_CONTENT,
            json: true
        };
        const httpMockConfig = [{
            input: [requestOptions, operation],
            output: [TEST_ERROR_MESSAGE, null]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(TEST_ERROR_MESSAGE);
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| display error when response contains error', async () => {
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH}`;
        const envVar = {};
        const requestOptions = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/manifest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
            headers: { authorization: TEST_DEFAULT_PROFILE_TOKEN },
            body: TEST_FILE_CONTENT,
            json: true
        };
        const httpMockConfig = [{
            input: [requestOptions, operation],
            output: [null, { statusCode: 401, body: TEST_ERROR_RESPONSE }]
        }];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.info).equal('');
            expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_RESPONSE));
        };

        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });

    it('| get correct http response when profile is set by env variable', async () => {
        // prepare test data
        const cmd = `ask api update-manifest -s ${TEST_SKILL_ID} -f ${TEST_FILE_PATH}`;
        const requestOptions = {
            url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/stages/${TEST_DEVELOPMENT_STAGE}/manifest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
            headers: { authorization: TEST_ENV_PROFILE_TOKEN },
            body: TEST_FILE_CONTENT,
            json: true
        };
        const envVar = {
            AWS_ACCESS_KEY_ID: 1,
            AWS_SECRET_ACCESS_KEY: 2,
            ASK_REFRESH_TOKEN: 3,
            ASK_VENDOR_ID: 4
        };
        const httpMockConfig = [
            {
                input: [requestOptions, operation],
                output: [null, { statusCode: 202 }]
            }
        ];
        const expectationHandler = (msgCatcher) => {
            expect(msgCatcher.error).equal('');
            expect(msgCatcher.info).equal('Update manifest request submitted successfully.');
        };

        // instantiate test and call
        await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
    });
});
