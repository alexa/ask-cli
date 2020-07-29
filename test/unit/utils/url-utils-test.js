const { expect } = require('chai');

const urlUtility = require('@src/utils/url-utils');

describe('Utils test - url utility', () => {
    describe('# test function isValidUrl', () => {
        [
            {
                testCase: 'input url string is null',
                urlString: null,
                expectation: false
            },
            {
                testCase: 'input url string is undefined',
                urlString: undefined,
                expectation: false
            },
            {
                testCase: 'input url string is empty',
                urlString: '',
                expectation: false
            },
            {
                testCase: 'input url string is blank',
                urlString: '        ',
                expectation: false
            },
            {
                testCase: 'input url is not a string',
                urlString: 12323,
                expectation: false
            },
            {
                testCase: 'input url string is random string',
                urlString: 'aaaaaaaaaaaaabbbbbbbbbbbsssssssssssssss',
                expectation: false
            },
            {
                testCase: 'input url string does not have protocol',
                urlString: 'www.abc.com',
                expectation: false
            },
            {
                testCase: 'input url string is http',
                urlString: 'http://test.tail',
                expectation: true
            },
            {
                testCase: 'input url string is https',
                urlString: 'https://test.safe',
                expectation: true
            }
        ].forEach(({ testCase, urlString, expectation }) => {
            it(`| ${testCase}, expect isValidResult ${expectation}`, () => {
                // call
                const callResult = urlUtility.isValidUrl(urlString);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function isLambdaArn', () => {
        [
            {
                testCase: 'input url string is null',
                urlString: null,
                expectation: false
            },
            {
                testCase: 'input url string is undefined',
                urlString: undefined,
                expectation: false
            },
            {
                testCase: 'input url string is empty',
                urlString: '',
                expectation: false
            },
            {
                testCase: 'input url string is blank',
                urlString: '        ',
                expectation: false
            },
            {
                testCase: 'input url string is random string',
                urlString: 'aaaaaaaaaaaaabbbbbbbbbbbsssssssssssssss',
                expectation: false
            },
            {
                testCase: 'input url string is http',
                urlString: 'http://lambda.arn.com',
                expectation: false
            },
            {
                testCase: 'input url string is https',
                urlString: 'https://test.com',
                expectation: false
            },
            {
                testCase: 'input url string is invalid ARN1',
                urlString: 'arn:aws:lambda:function:',
                expectation: false
            },
            {
                testCase: 'input url string is invalid ARN2',
                urlString: 'arns:lambda:ap-southeast-2:123456789012:function:Cadsfase:1.0',
                expectation: false
            },
            {
                testCase: 'input url string is invalid ARN3',
                urlString: 'arn:aws:lambda:ap-southeast-2:function:Cadsfase:1.0',
                expectation: false
            },
            {
                testCase: 'input string is a valid lambda ARN1',
                urlString: 'arn:aws:lambda:us-east-1:359620628909:function:ask-custom-skill-sample-nodejs-fact-default',
                expectation: true
            },
            {
                testCase: 'input string is a valid lambda ARN2',
                urlString: 'arn:aws:lambda:eu-west-1:359620628909:function:ask-custom-S3Sleep',
                expectation: true
            },
            {
                testCase: 'input string is a valid lambda ARN3 with version',
                urlString: 'arn:aws:lambda:ap-southeast-2:123456789012:function:Cadsfase:1.0',
                expectation: true
            }
        ].forEach(({ testCase, urlString, expectation }) => {
            it(`| ${testCase}, expect isLambdaArn ${expectation}`, () => {
                // call
                const callResult = urlUtility.isLambdaArn(urlString);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function isHttpsUrl', () => {
        [
            {
                testCase: 'input url string is null',
                urlString: null,
                expectation: false
            },
            {
                testCase: 'input url string is undefined',
                urlString: undefined,
                expectation: false
            },
            {
                testCase: 'input url string is empty',
                urlString: '',
                expectation: false
            },
            {
                testCase: 'input url string is blank',
                urlString: '        ',
                expectation: false
            },
            {
                testCase: 'input url string is random string',
                urlString: 'aaaaaaaaaaaaabbbbbbbbbbbsssssssssssssss',
                expectation: false
            },
            {
                testCase: 'input url string is http',
                urlString: 'http://lambda.arn.com',
                expectation: false
            },
            {
                testCase: 'input url string is https',
                urlString: 'https://test.com',
                expectation: true
            },
            {
                testCase: 'input string is a valid lambda ARN1',
                urlString: 'arn:aws:lambda:us-east-1:359620628909:function:ask-custom-skill-sample-nodejs-fact-default',
                expectation: false
            }
        ].forEach(({ testCase, urlString, expectation }) => {
            it(`| ${testCase}, expect isHttpsUrl ${expectation}`, () => {
                // call
                const callResult = urlUtility.isHttpsUrl(urlString);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function isUrlOfficialTemplate', () => {
        [
            {
                testCase: 'input url string is null',
                urlString: null,
                expectation: false
            },
            {
                testCase: 'input url string is undefined',
                urlString: undefined,
                expectation: false
            },
            {
                testCase: 'input url string is empty',
                urlString: '',
                expectation: false
            },
            {
                testCase: 'input url string is blank',
                urlString: '        ',
                expectation: false
            },
            {
                testCase: 'input url string is random string',
                urlString: 'aaaaaaaaaaaaabbbbbbbbbbbsssssssssssssss',
                expectation: false
            },
            {
                testCase: 'input url is git url but is not an alexa url',
                urlString: 'https://github.com/airbnb/javascript.git',
                expectation: false
            },
            {
                testCase: 'input url string is not an alexa url',
                urlString: 'https://github.com/airbnb/javascript',
                expectation: false
            },
            {
                testCase: 'input url string is an alexa github url',
                urlString: 'https://github.com/alexa/skill-sample-nodejs-hello-world.git',
                expectation: true
            }
        ].forEach(({ testCase, urlString, expectation }) => {
            it(`| ${testCase}, expect isUrlOfficialTemplate ${expectation}`, () => {
                // call
                const callResult = urlUtility.isUrlOfficialTemplate(urlString);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });

    describe('# test function isUrlWithJsonExtension', () => {
        [
            {
                testCase: 'input url string is null',
                urlString: null,
                expectation: false
            },
            {
                testCase: 'input url string is undefined',
                urlString: undefined,
                expectation: false
            },
            {
                testCase: 'input url string is empty',
                urlString: '',
                expectation: false
            },
            {
                testCase: 'input url string is blank',
                urlString: '        ',
                expectation: false
            },
            {
                testCase: 'input url string is random string',
                urlString: 'aaaaaaaaaaaaabbbbbbbbbbbsssssssssssssss',
                expectation: false
            },
            {
                testCase: 'input url is git url',
                urlString: 'https://github.com/airbnb/javascript.git',
                expectation: false
            },
            {
                testCase: 'input url is url with querry params',
                urlString: 'https://github.com/airbnb/javascript.git?d=y&w=n',
                expectation: false
            },
            {
                testCase: 'input url string is json url',
                urlString: 'https://github.com/airbnb/javascript.json',
                expectation: true
            }
        ].forEach(({ testCase, urlString, expectation }) => {
            it(`| ${testCase}, expect isUrlWithJsonExtension ${expectation}`, () => {
                // call
                const callResult = urlUtility.isUrlWithJsonExtension(urlString);
                // verify
                expect(callResult).equal(expectation);
            });
        });
    });
});
