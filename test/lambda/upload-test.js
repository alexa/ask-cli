'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const aws = require('aws-sdk');
const fs = require('fs');
const clui = require('clui');
const tmp = require('tmp');
const initAWS = require('../../lib/utils/init-aws');

const MockCommand = require('../mocks/command');
const upload = require('../../lib/lambda/upload');


describe('Lambda upload testing', () => {
    describe('build upload command', () => {
        let command;

        before(() => {
            command = new MockCommand();
            upload.createCommand(command);
        });

        beforeEach(() => {
            sinon.stub(upload, 'uploadByName');
            sinon.stub(console, 'warn');
        });

        afterEach(() => {
            console.warn.restore();
            upload.uploadByName.restore();
        });

        // it('| warn correctly if function name not provided', () => {
        //     command.runWith('upload');
        //     expect(console.warn.getCall(0).args[0]).equal(
        //         'Please input required option: function.'
        //     );
        // });

        it('| make sure upload by name called once', () => {
            command.runWith('upload -f test');
            expect(upload.uploadByName.calledOnce).equal(true);
        });

        it('| call upload by name with function name provided', () => {
            command.runWith('upload -f test');
            expect(upload.uploadByName.getCall(0).args[0]).equal('test');
        });

        it('| pass in correct src with source directory provided', () => {
            command.runWith('upload -f test -s ./test');
            expect(upload.uploadByName.getCall(0).args[1]).equal('./test');
        });
    });

    describe('uploadLambda function by name', () => {
        let sandbox;
        let lambda, mockSpinner;

        before(() => {
            lambda = new aws.Lambda();
            mockSpinner = new clui.Spinner();
        });

        beforeEach(() => {
            sandbox = sinon.sandbox.create();

            sandbox.stub(upload, 'createZip');
            sandbox.stub(initAWS, 'initAWS', () => {
                return aws;
            });
            sandbox.stub(initAWS, 'isLambdaArn');
            sandbox.stub(initAWS, 'setRegionWithLambda');
            sandbox.stub(aws, 'Lambda', () => {
                return lambda;
            });
            sandbox.stub(lambda, 'updateFunctionCode');
            sandbox.stub(fs, 'readFileSync');
            sandbox.stub(clui, 'Spinner', () => {
                return mockSpinner;
            });
            sandbox.stub(mockSpinner, 'start');
            sandbox.stub(fs, 'unlinkSync');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('| call create zip with correct source', () => {
            upload.uploadByName('test', 'test');
            expect(upload.createZip.getCall(0).args[0]).equal('test');
        });

        it('| set region from Lambda if function name is in arn format', () => {
            upload.createZip.callsArgWith(1, 'zipFile');
            fs.readFileSync.returns('file');
            initAWS.isLambdaArn.returns(true);
            upload.uploadByName('test', 'test');
            expect(initAWS.setRegionWithLambda.calledOnce).equal(true);
        });

        it('| triger update function code from Lambda client', () => {
            upload.createZip.callsArgWith(1, 'zipFile');
            fs.readFileSync.returns('file');
            upload.uploadByName('test', 'test');
            expect(lambda.updateFunctionCode.calledOnce).equal(true);
        });

        it('| error occurs when uploading function code', () => {
            sandbox.stub(console, 'error');
            upload.createZip.callsArgWith(1, 'zipFile');
            fs.readFileSync.returns('file');
            lambda.updateFunctionCode.callsArgWith(1, 'error');
            upload.uploadByName('test', 'test');
            expect(fs.unlinkSync.getCall(0).args[0]).equal('zipFile');
            expect(console.error.getCall(0).args[0]).equal(
                'Upload Lambda function error.\nerror'
            );
        });
    });

    describe('create zip for uploading', () => {
        let sandbox;
        let mockSpinner;

        before(() => {
            mockSpinner = new clui.Spinner();
        });

        beforeEach(() => {
            sandbox = sinon.sandbox.create();

            sandbox.stub(fs, 'access');
            sandbox.stub(clui, 'Spinner', () => {
                return mockSpinner;
            });
            sandbox.stub(mockSpinner, 'start');
            sandbox.stub(tmp, 'tmpNameSync');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('| use zip file as a source file', (done) => {
            sandbox.stub(console, 'log');
            fs.access.callsArgWith(2, null);
            upload.createZip('test.zip', () => {});
            expect(console.log.getCall(0).args[0]).equal(
                'The source file has already been compressed. Skip the zipping.'
            );
            done();
        });

        it('| create tmp file with non-zip file as a source file', (done) => {
            fs.access.callsArgWith(2, null);
            tmp.tmpNameSync.returns('test/fixture/tmpPath.zip');
            upload.createZip('test', () => {});
            expect(tmp.tmpNameSync.calledOnce).equal(true);
            done();
        });
    });
});
