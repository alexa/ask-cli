'use strict';

const expect = require('chai').expect;
const aws = require('aws-sdk');
const initAWS = require('../../lib/utils/init-aws');
const sinon = require('sinon');


describe('utils init-aws testing', () => {
    const TEST_PROFILE = 'test';

    describe('# init AWS', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            sandbox.stub(console, 'error');
            sandbox.stub(process, 'exit');
        });
        afterEach(() => {
            sandbox.restore();
        });
        it('| no aws_profile, no region. error message creates and process stops', () => {
            initAWS.initAWS();
            expect(console.error.getCall(0).args[0]).equal(
                '[Error]: AWS credentials are not found in current profile.'
            );
            expect(process.exit.getCall(0).args[0]).equal(1);
        });

        it('| no aws_profile, but have region. error message creates and process stops', () => {
            initAWS.initAWS(null, 'CN');
            expect(console.error.getCall(0).args[0]).equal(
                '[Error]: AWS credentials are not found in current profile.'
            );
            expect(process.exit.getCall(0).args[0]).equal(1);
        });

        it('| init aws with default us-east-1 region', () => {
            let aws = initAWS.initAWS(TEST_PROFILE);
            expect(aws.config.region).equal('us-east-1');
        });

        it('| init aws with input region', () => {
            expect(initAWS.initAWS(TEST_PROFILE, 'EU').config.region).equal('eu-west-1');
            expect(initAWS.initAWS(TEST_PROFILE, 'NA').config.region).equal('us-east-1');

        });

    });

    describe('# judge if is Lambda ARN', () => {
        it('| should match these examples as Lambda ARN', () => {
            expect(initAWS.isLambdaArn('arn:aws:lambda:us-east-1:123456789012:function:Case')).equal(true);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-southeast-2:123456789012:function:Cadsfase:1.0')).equal(true);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-southeast-2:123456789012:function:')).equal(true);
        });

        it('| should not take these examples as Lambda ARN', () => {
            expect(initAWS.isLambdaArn('arn:aws:lada:ap-southeast-2:123456789012:function:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arns:lambda:ap-southeast-2:123456789012:function:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('lambda:ap-southeast-2:123456789012:function:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:east-2:123456789012:function:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('aws:lambda:ap-southeast-2:123456789012:function:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:apeuus-east-2:123456789012:function:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-southeast:123456789012:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-southeast-2:123456789012:func:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-:function:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-southeast-2:function:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-southeast-2:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-southeast-2:tion:Cadsfase:1.0')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:ap-southeast-2:123456789012:function')).equal(false);
            expect(initAWS.isLambdaArn('arn:aws:lambda:function:')).equal(false);
        });
    });

    describe('# set AWS region from Lambda', () => {
        it('| set AWS region to us-east-1', () => {
            let arn = 'arn:aws:lambda:us-east-1:123456789012:function:Case';
            expect(initAWS.setRegionWithLambda(aws, arn).config.region).equal('us-east-1');
        });

        it('| set AWS region to eu-west-1', () => {
            let arn = 'arn:aws:lambda:eu-west-1:123456789012:function:Process0';
            expect(initAWS.setRegionWithLambda(aws, arn).config.region).equal('eu-west-1');
        });

        it('| set AWS region to ap-southeast-1', () => {
            let arn = 'arn:aws:lambda:ap-southeast-1:123456789012:function:ProcsisRecords:1.0';
            expect(initAWS.setRegionWithLambda(aws, arn).config.region).equal('ap-southeast-1');
        });

        it('| set AWS region to ap-southeast-2', () => {
            let arn = 'arn:aws:lambda:ap-southeast-2:123456789012:function:ProcessKinesis';
            expect(initAWS.setRegionWithLambda(aws, arn).config.region).equal('ap-southeast-2');
        });
    });
});
