const { assert } = require('chai');
const sinon = require('sinon');
const retryUtils = require('@src/utils/retry-utility');

/**
 * The test input description are as follows
 * testCase: description of the test case
 * retryConfig: retry configuration with the elements - base, factor and maxRetry
 * expectedResult: Object with the elements
 *    error: error value returned by the retry call back
 *    response: response value returned by the call back
 *    callCount: number of times the spy retryCall fn was called
 * pollCount: The retry count that determines the termination condition
 * testResponse: Contains either a default response or an array of responses or both. This is fed to the sinon stub
 */
describe('Utils test - retry utility', () => {
    describe('# test function retry', () => {
        const SUCCESS_RESPONSE = 'Complete';
        const PROGRESS_RESPONSE = 'In Progress';
        [
            {
                testCase: 'null retry config value',
                retryConfig: null,
                expectedResult: {
                    error: '[Error]: Invalid retry configuration. Retry configuration with values - base, factor and maxRetry needs to be specified',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'undefined retry config value',
                retryConfig: undefined,
                expectedResult: {
                    error: '[Error]: Invalid retry configuration. Retry configuration with values - base, factor and maxRetry needs to be specified',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'invalid string value in retry config',
                retryConfig: 'foobar',
                expectedResult: {
                    error: '[Error]: Invalid retry configuration: base. Base is a required configuration and its value needs to be greater than 0',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'empty base value in retry config',
                retryConfig: {
                },
                expectedResult: {
                    error: '[Error]: Invalid retry configuration: base. Base is a required configuration and its value needs to be greater than 0',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'invalid base value in retry config',
                retryConfig: {
                    base: -1,
                    factor: -1
                },
                expectedResult: {
                    error: '[Error]: Invalid retry configuration: base. Base is a required configuration and its value needs to be greater than 0',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'empty factor value in retry config',
                retryConfig: {
                    base: 1
                },
                expectedResult: {
                    error: '[Error]: Invalid retry configuration: factor. Factor is a required '
                        + 'configuration and its value needs to be greater than 0',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'invalid factor value in retry config',
                retryConfig: {
                    base: 1,
                    factor: -1
                },
                expectedResult: {
                    error: '[Error]: Invalid retry configuration: factor. '
                        + 'Factor is a required configuration and its value needs to be greater than 0',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'invalid factor value in retry config',
                retryConfig: {
                    base: 1,
                    factor: 1
                },
                expectedResult: {
                    error: '[Error]: Invalid retry configuration: maxRetry. '
                        + 'MaxRetry is a required configuration and its value needs to be greater than 0',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'invalid maxRetry value in retry config',
                retryConfig: {
                    base: 1,
                    factor: 1,
                    maxRetry: -1
                },
                expectedResult: {
                    error: '[Error]: Invalid retry configuration: maxRetry. Value needs to be an integer and greater than 0',
                    response: undefined,
                    callCount: 0
                }
            },
            {
                testCase: 'Valid retry configurations. Exceeds maximum retry attempts.',
                retryConfig: {
                    base: 1,
                    factor: 1,
                    maxRetry: 2
                },
                pollCount: 5,
                testResponse: {
                    defaultResponse: PROGRESS_RESPONSE
                },
                expectedResult: {
                    error: '[Error]: Retry attempt exceeded.',
                    response: PROGRESS_RESPONSE,
                    callCount: 3
                }
            },
            {
                testCase: 'Valid retry configurations. 3 requests are made. Service returns '
                    + '"In Progress" for first 2 requests. Final retry attempt succeeds with response "Complete"',
                retryConfig: {
                    base: 1,
                    factor: 1,
                    maxRetry: 3
                },
                pollCount: 2,
                testResponse: {
                    defaultResponse: PROGRESS_RESPONSE,
                    responseMap: [
                        PROGRESS_RESPONSE,
                        PROGRESS_RESPONSE,
                        SUCCESS_RESPONSE,
                    ],
                },
                expectedResult: {
                    error: null,
                    response: SUCCESS_RESPONSE,
                    callCount: 3
                },
            }
        ].forEach(({ testCase, retryConfig, expectedResult, pollCount, testResponse }) => {
            const stub = sinon.stub();
            if (testResponse) {
                if (testResponse.defaultResponse) {
                    stub.returns(testResponse.defaultResponse);
                }
                if (testResponse.responseMap) {
                    for (const [index, response] of testResponse.responseMap.entries()) {
                        stub.onCall(index).returns(response);
                    }
                }
            }
            const retryCall = cb => cb(null, stub());
            it(`| ${testCase}`, (done) => {
                const shouldRetryCondition = (res) => {
                    if (res) {
                        if (pollCount > 0) {
                            pollCount--;
                            assert.strictEqual(res, PROGRESS_RESPONSE);
                            return true;
                        }
                    }
                    return false;
                };
                // call
                retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => {
                    assert.strictEqual(err, expectedResult.error);
                    assert.strictEqual(res, expectedResult.response);
                    sinon.assert.callCount(stub, expectedResult.callCount);
                    done();
                });
            });
        });
    });
});
