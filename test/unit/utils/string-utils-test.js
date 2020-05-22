const { expect } = require('chai');
const stringUtils = require('@src/utils/string-utils');

describe('Utils test - string utility', () => {
    describe('# test function getParamNames', () => {
        [{
            testCase: 'provide a no param function',
            input: function test() {
                return true;
            },
            expectation: []
        }, {
            testCase: 'provide a single param function',
            input: function test(param1) {
                return param1;
            },
            expectation: ['param1']
        }, {
            testCase: 'provide a single param with a default value function',
            input: function test(param1 = true) {
                return param1;
            },
            expectation: ['param1', '=', 'true']
        }, {
            testCase: 'provide a multiple param with a several default value function',
            input: function test(param1, param2, param3 = 0, param4 = true) {
                return { param1, param2, param3, param4 };
            },
            expectation: ['param1', 'param2', 'param3', '=', '0', 'param4', '=', 'true']

        }, {
            testCase: 'provide a spreded params function',
            input: function test(...params) {
                return params;
            },
            expectation: ['...params']

        }].forEach(({ testCase, input, expectation }) => {
            it(`| ${testCase}, expect returns ${JSON.stringify(expectation)}`, () => {
                const callResult = stringUtils.getParamNames(input);
                expect(callResult).deep.equal(expectation);
            });
        });
    });
    describe('# test function kebabCase', () => {
        [
            {
                input: 'hello',
                expectation: 'hello'
            },
            {
                input: 'hello-world',
                expectation: 'hello-world'
            },
            {
                input: 'Hello World',
                expectation: 'hello-world'
            },
            {
                input: 'HelloWorld',
                expectation: 'hello-world'
            }
        ].forEach(({ input, expectation }) => {
            it(`| input is ${input}, expect kebabCase ${expectation}`, () => {
                // call
                const callResult = stringUtils.kebabCase(input);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });
    describe('# test function camelCase', () => {
        [
            {
                input: 'hello',
                expectation: 'hello'
            },
            {
                input: 'hello-world',
                expectation: 'helloWorld'
            },
            {
                input: 'Hello World',
                expectation: 'helloWorld'
            },
            {
                input: 'HelloWorld',
                expectation: 'helloWorld'
            }
        ].forEach(({ input, expectation }) => {
            it(`| input is ${input}, expect camelCase ${expectation}`, () => {
                // call
                const callResult = stringUtils.camelCase(input);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });
    describe('# test function isNonEmptyString', () => {
        [
            {
                testCase: 'input is an object',
                str: {},
                expectation: false
            },
            {
                testCase: 'input is an array',
                str: [1, 2, 3],
                expectation: false
            },
            {
                testCase: 'input is a boolean',
                str: true,
                expectation: false
            },
            {
                testCase: 'input is an empty string',
                str: '',
                expectation: false
            },
            {
                testCase: 'input is a blank string',
                str: '      ',
                expectation: true
            },
            {
                testCase: 'input is a string with actual content',
                str: ' test string ',
                expectation: true
            },
        ].forEach(({ testCase, str, expectation }) => {
            it(`| ${testCase}, expect isNonEmptyString ${expectation}`, () => {
                // call
                const callResult = stringUtils.isNonEmptyString(str);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function standardize', () => {
        [
            {
                testCase: 'camel case to lower',
                str: 'testTest',
                expectation: 'testtest'
            },
            {
                testCase: 'capital case to lower',
                str: 'TestTest',
                expectation: 'testtest'
            },
            {
                testCase: 'non alphanumeric',
                str: 'test.test',
                expectation: 'testtest'
            },
        ].forEach(({ testCase, str, expectation }) => {
            it(`| ${testCase}, expect standardize ${str}`, () => {
                // call
                const callResult = stringUtils.standardize(str);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function canParseAsJson', () => {
        [
            {
                testCase: 'parse non json',
                str: 'some non json string',
                expectation: false
            },
            {
                testCase: 'parse json string',
                str: JSON.stringify({ x: 'x' }),
                expectation: true
            },
        ].forEach(({ testCase, str, expectation }) => {
            it(`| ${testCase}, expect standardize ${str}`, () => {
                // call
                const callResult = stringUtils.canParseAsJson(str);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function isNonBlankString', () => {
        [
            {
                testCase: 'input is an object',
                str: {},
                expectation: false
            },
            {
                testCase: 'input is an array',
                str: [1, 2, 3],
                expectation: false
            },
            {
                testCase: 'input is a boolean',
                str: true,
                expectation: false
            },
            {
                testCase: 'input is an empty string',
                str: '',
                expectation: false
            },
            {
                testCase: 'input is a blank string',
                str: '      ',
                expectation: false
            },
            {
                testCase: 'input is a string with actual content',
                str: ' test string ',
                expectation: true
            },
        ].forEach(({ testCase, str, expectation }) => {
            it(`| ${testCase}, expect isNonBlankString ${expectation}`, () => {
                // call
                const callResult = stringUtils.isNonBlankString(str);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function isLambdaFunctionName', () => {
        [
            {
                testCase: 'input url string is null',
                str: null,
                expectation: false
            },
            {
                testCase: 'input url string is undefined',
                str: undefined,
                expectation: false
            },
            {
                testCase: 'input url string is empty',
                str: '',
                expectation: false
            },
            {
                testCase: 'input url string is blank',
                str: '        ',
                expectation: false
            },
            {
                testCase: 'input url string is valid function name',
                str: 'ask-custom-cityGuide-default',
                expectation: true
            },
            {
                testCase: 'input url string is http',
                str: 'http://lambda.arn.com',
                expectation: false
            },
            {
                testCase: 'input url string is https',
                str: 'https://test.com',
                expectation: false
            },
            {
                testCase: 'input url is random string',
                str: 'abc:A:<http://lambda>/invoke',
                expectation: false
            }

        ].forEach(({ testCase, str, expectation }) => {
            it(`| ${testCase}, expect isLambdaFunctionName ${expectation}`, () => {
                // call
                const callResult = stringUtils.isLambdaFunctionName(str);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function filterNonAlphanumeric', () => {
        [
            {
                testCase: 'input string is null',
                str: null,
                expectation: null
            },
            {
                testCase: 'input string is undefined',
                str: undefined,
                expectation: undefined
            },
            {
                testCase: 'input string is empty',
                str: '',
                expectation: ''
            },
            {
                testCase: 'input string is blank',
                str: '        ',
                expectation: ''
            },
            {
                testCase: 'input string is with non alphanumeric characters',
                str: 'default-!!!???09',
                expectation: 'default-09'
            },
            {
                testCase: 'input string is with non alphanumeric characters test 2',
                str: 'http://lambda.arn.com',
                expectation: 'httplambdaarncom'
            },
            {
                testCase: 'input string is all consisted of non alphanumeric characters',
                str: '://!@#$%^&*()<>?_',
                expectation: ''
            },
            {
                testCase: 'input string includes non-latin character',
                str: '中文 にほんご',
                expectation: ''
            }

        ].forEach(({ testCase, str, expectation }) => {
            it(`| ${testCase}, expect isLambdaFunctionName ${expectation}`, () => {
                // call
                const callResult = stringUtils.filterNonAlphanumeric(str);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function splitStringFilterAndMapTo', () => {
        [
            {
                testCase: 'input string is empty',
                str: '',
                delimiter: '/n',
                filterBy: null,
                mapper: null,
                expectation: []
            },
            {
                testCase: 'input string is null',
                str: null,
                delimiter: '/n',
                filterBy: null,
                mapper: null,
                expectation: []
            },
            {
                testCase: 'input string is valid',
                str: 'abc,xyz',
                delimiter: ',',
                filterBy: null,
                mapper: null,
                expectation: ['abc', 'xyz']
            },
            {
                testCase: 'filterBy is not provided',
                str: 'abc,xyz',
                delimiter: ',',
                filterBy: null,
                mapper: item => item.toUpperCase(),
                expectation: ['ABC', 'XYZ']
            },
            {
                testCase: 'mapper is not provided',
                str: 'abc,xyz',
                delimiter: ',',
                filterBy: item => item !== 'xyz',
                mapper: null,
                expectation: ['abc']
            },
            {
                testCase: 'all parameters are valid',
                str: 'abc,xyz',
                delimiter: ',',
                filterBy: item => item !== 'xyz',
                mapper: item => item.toUpperCase(),
                expectation: ['ABC']
            }
        ].forEach(({ testCase, str, delimiter, filterBy, mapper, expectation }) => {
            it(`| ${testCase}, expect splitStringFilterAndMapTo returns ${expectation}`, () => {
                // call
                const callResult = stringUtils.splitStringFilterAndMapTo(str, delimiter, filterBy, mapper);
                // verify
                expect(JSON.stringify(callResult)).equal(JSON.stringify(expectation));
            });
        });
    });

    describe('# test function validateSyntax', () => {
        [
            {
                testCase: 'input value is null',
                value: null,
                expectation: false
            },
            {
                testCase: 'input value is undefined',
                value: undefined,
                expectation: false
            },
            {
                testCase: 'input value is empty',
                value: '',
                expectation: false
            }

        ].forEach(({ testCase, value, expectation }) => {
            it(`| ${testCase}, is a valid profile: ${expectation}`, () => {
                // call
                const callResult = stringUtils.validateSyntax('PROFILE_NAME', value);
                // verify
                expect(callResult).equal(expectation);
            });
        });

        describe('# test syntax for profile name', () => {
            [
                {
                    testCase: 'input value is with non alphanumeric characters',
                    value: 'default-!!!???09',
                    expectation: false
                },
                {
                    testCase: 'input value is with non alphanumeric characters test 2',
                    value: 'http://lambda.arn.com',
                    expectation: false
                },
                {
                    testCase: 'input value is all consisted of non alphanumeric characters',
                    value: '://!@#$%^&*()<>?_',
                    expectation: false
                },
                {
                    testCase: 'input value includes non-latin character',
                    value: '中文 にほんご',
                    expectation: false
                },
                {
                    testCase: 'input value is a valid profile name',
                    value: 'askProfile',
                    expectation: true
                },
                {
                    testCase: 'input value is environment profile name',
                    value: '__ENVIRONMENT_ASK_PROFILE__',
                    expectation: false
                }

            ].forEach(({ testCase, value, expectation }) => {
                it(`| ${testCase}, is a valid profile: ${expectation}`, () => {
                    // call
                    const callResult = stringUtils.validateSyntax('PROFILE_NAME', value);
                    // verify
                    expect(callResult).equal(expectation);
                });
            });
        });
    });
});
