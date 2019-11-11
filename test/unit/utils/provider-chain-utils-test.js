const { expect } = require('chai');
const providerChainUtils = require('@src/utils/provider-chain-utils');

describe('Utils test - provider chain utility', () => {
    describe('# test function resolveProviderChain', () => {
        [
            {
                testCase: 'input is an empty array',
                input: [],
                expectation: null
            },
            {
                testCase: 'input array has empty strings',
                input: ['', ''],
                expectation: null
            },
            {
                testCase: 'input array has valid values',
                input: ['test', 'cli'],
                expectation: 'test'
            },
            {
                testCase: 'input array has mix of valid and invalid values',
                input: ['', 'cli'],
                expectation: 'cli'
            },
            {
                testCase: 'input has undefined as string',
                input: ['undefined'],
                expectation: null
            },
        ].forEach(({ testCase, input, expectation }) => {
            it(`| ${testCase}, expect resolveProviderChain ${expectation}`, () => {
                // call
                const callResult = providerChainUtils.resolveProviderChain(input);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });
});
