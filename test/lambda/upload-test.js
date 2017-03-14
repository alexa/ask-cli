'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fs = require('fs');

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

        it('| warn correctly if function name not provided', () => {
            command.runWith('upload');
            expect(console.warn.getCall(0).args[0]).equal(
                'Please input required option: function.'
            );
        });

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
        let fakeUpload;

        before(() => {
            let initAWSStub = {
                initAWS: () => {
                    return null;
                }
            };
            fakeUpload = proxyquire('../../lib/lambda/upload', {
                '../utils/init-aws': initAWSStub
            });
        });

        beforeEach(() => {
            sinon.stub(fakeUpload, 'createZip');
        });

        afterEach(() => {
            fakeUpload.createZip.restore();
        });

        it('| call create zip once', () => {
            fakeUpload.uploadByName('test', 'test');
            expect(fakeUpload.createZip.calledOnce).equal(true);
        });

        it('| call create zip with correct source', () => {
            fakeUpload.uploadByName('test', 'test');
            expect(fakeUpload.createZip.getCall(0).args[0]).equal('test');
        });
    });

    describe('create zip for uploading', () => {
        let fakeUpload;

        before(() => {
            fakeUpload = proxyquire('../../lib/lambda/upload', {
                'clui': {
                    Spinner: function() {
                        return {
                            start: () => {},
                            stop: () => {}
                        };
                    }
                }
            });
        });

        beforeEach(() => {
            sinon.stub(fs, 'access');
        });

        afterEach(() => {
            fs.access.restore();
        });

        it('| display error message if the path not authorized to access', (done) => {
            sinon.stub(console, 'error');
            fs.access.callsArgWith(2, 'error');
            fakeUpload.createZip('test');
            expect(console.error.getCall(0).args[0]).equal(
                'File access error. error'
            );
            console.error.restore();
            done();
        });

        it('| use zip file as a source file', (done) => {
            let callback = () => {};
            sinon.stub(console, 'log');
            fs.access.callsArgWith(2, null);
            fakeUpload.createZip('test.zip', callback);
            expect(console.log.getCall(0).args[0]).equal(
                'The source file has already been compressed. Skip the zipping.'
            );
            console.log.restore();
            done();
        });
    });
});
