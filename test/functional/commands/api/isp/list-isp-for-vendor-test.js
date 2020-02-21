const { expect } = require('chai');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const ApiCommandBasicTest = require('@test/functional/commands/api');

describe('Functional test - ask api list-isp-for-vendor', () => {
    const operation = 'list-isp-for-vendor';
    const TEST_COMMAND_PREFIX = 'ask api';
    const TEST_DEFAULT_PROFILE_TOKEN = ApiCommandBasicTest.testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN;
    const TEST_INVALID_PROFILE = ApiCommandBasicTest.testDataProvider.INVALID_PROFILE;
    const TEST_STAGE = 'development';
    const TEST_NEXT_TOKEN1 = 'NEXT_TOKEN_1';
    const TEST_VENDOR_ID = 'DEFAULT_VENDOR_ID';
    const TEST_MAX_RESULT = 30;
    const TEST_ISP_INFO1 = { content: '1' };
    const TEST_ISP_INFO2 = { content: '2' };
    const TEST_ERROR_MESSAGE = { error: 'TEST_ERROR_MESSAGE' };

    const TEST_PARAMS = {
        nextToken: TEST_NEXT_TOKEN1,
        vendorId: TEST_VENDOR_ID,
        stage: TEST_STAGE
    };

    const requestOptionGenerator = (queryParamJson) => {
        let requestUrl = `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/inSkillProducts`;
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
        inSkillProductSummaryList: inSkillProducts
    });

    describe('# list-skills with any option will make direct api request', () => {
        it('| print error when stage is not valid', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -g notValid`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: stage. Value must be in (development, live).');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when max-result is not a number', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --max-results not_number`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: max-results. Input should be a number.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when status is not valid', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --status notValid`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: status.'
                + ' Value must be in (INCOMPLETE, COMPLETE, CERTIFICATION, PUBLISHED, SUPPRESSED).');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when type is not valid', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --type notValid`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('Please provide valid input for option: type.'
                + ' Value must be in (SUBSCRIPTION, ENTITLEMENT, CONSUMABLE).');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when isp-id-list is used with max-results', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --max-results 50 --isp-id-list 123,456`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal('isp-id-list cannot used with max-results or next-token.');
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list isp when nextToken is specified for default profile but api request fails', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator(TEST_PARAMS), operation],
                output: [null, { statusCode: 401, body: TEST_ERROR_MESSAGE }]
            }];

            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| print error when input invalid profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} -p ${TEST_INVALID_PROFILE}`;
            const envVar = {};
            const httpMockConfig = [];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(`Cannot resolve profile [${TEST_INVALID_PROFILE}]`);
            };

            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list isp when nextToken is specified for default profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --next-token ${TEST_NEXT_TOKEN1}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator(TEST_PARAMS), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1, TEST_ISP_INFO2]) }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString({
                    nextToken: TEST_NEXT_TOKEN1,
                    inSkillProductSummaryList: [TEST_ISP_INFO1, TEST_ISP_INFO2]
                }));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list isp when nextToken and maxResult are specified when profile is default profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --next-token ${TEST_NEXT_TOKEN1} --max-results ${TEST_MAX_RESULT}`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator({
                    nextToken: TEST_NEXT_TOKEN1,
                    maxResults: TEST_MAX_RESULT,
                    vendorId: TEST_VENDOR_ID,
                    stage: TEST_STAGE
                }), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1, TEST_ISP_INFO2]) }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString({
                    nextToken: TEST_NEXT_TOKEN1,
                    inSkillProductSummaryList: [TEST_ISP_INFO1, TEST_ISP_INFO2]
                }));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list isp when isp-id-list are specified and profile is default profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --isp-id-list 123`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator({
                    productId: '123',
                    vendorId: TEST_VENDOR_ID,
                    stage: TEST_STAGE
                }), operation],
                output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1, TEST_ISP_INFO2]) }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.info).deep.equal(jsonView.toString({
                    nextToken: TEST_NEXT_TOKEN1,
                    inSkillProductSummaryList: [TEST_ISP_INFO1, TEST_ISP_INFO2]
                }));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list isp when reference-name, status, type, is-associated-with-skill are specified and profile is default profile', async () => {
            const TEST_REFERENCE_NAME = 'name';
            const TEST_STATUS = 'INCOMPLETE';
            const TEST_TYPE = 'SUBSCRIPTION';
            const cmd = `${TEST_COMMAND_PREFIX} ${operation} --reference-name ${TEST_REFERENCE_NAME} --status ${TEST_STATUS}`
            + ` --type ${TEST_TYPE} --is-associated-with-skill true`;
            const envVar = {};
            const httpMockConfig = [{
                input: [requestOptionGenerator({
                    maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                    vendorId: TEST_VENDOR_ID,
                    referenceName: TEST_REFERENCE_NAME,
                    type: TEST_TYPE,
                    stage: TEST_STAGE,
                    status: TEST_STATUS,
                    isAssociatedWithSkill: 'true'
                }), operation],
                output: [null, { statusCode: 200, body: responseGenerator(null, [TEST_ISP_INFO1, TEST_ISP_INFO2]) }]
            }];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.error).equal('');
                expect(msgCatcher.info).deep.equal(jsonView.toString({
                    inSkillProductSummaryList: [TEST_ISP_INFO1, TEST_ISP_INFO2]
                }));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| list all the isp when no option set for default profile but fails the request in the middle', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionGenerator({
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                        vendorId: TEST_VENDOR_ID,
                        stage: TEST_STAGE,
                    }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1]) }]
                },
                {
                    input: [requestOptionGenerator({
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                        nextToken: TEST_NEXT_TOKEN1,
                        vendorId: TEST_VENDOR_ID,
                        stage: TEST_STAGE,
                    }), operation],
                    output: [null, { statusCode: 400, body: TEST_ERROR_MESSAGE }]
                }
            ];
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).equal('');
                expect(msgCatcher.error).equal(jsonView.toString(TEST_ERROR_MESSAGE));
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });

        it('| iteratively list all the isp when no option set for default profile', async () => {
            const cmd = `${TEST_COMMAND_PREFIX} ${operation}`;
            const envVar = {};
            const httpMockConfig = [
                {
                    input: [requestOptionGenerator({
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                        vendorId: TEST_VENDOR_ID,
                        stage: TEST_STAGE,
                    }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(TEST_NEXT_TOKEN1, [TEST_ISP_INFO1]) }]
                },
                {
                    input: [requestOptionGenerator({
                        maxResults: CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE,
                        nextToken: TEST_NEXT_TOKEN1,
                        vendorId: TEST_VENDOR_ID,
                        stage: TEST_STAGE,
                    }), operation],
                    output: [null, { statusCode: 200, body: responseGenerator(null, [TEST_ISP_INFO2]) }]
                }
            ];
            const expectedResponse = {
                inSkillProductSummaryList: [TEST_ISP_INFO1, TEST_ISP_INFO2],
            };
            const expectationHandler = (msgCatcher) => {
                expect(msgCatcher.info).deep.equal(jsonView.toString(expectedResponse));
                expect(msgCatcher.error).equal('');
            };
            await new ApiCommandBasicTest({ operation, cmd, envVar, httpMockConfig, expectationHandler }).test();
        });
    });
});
