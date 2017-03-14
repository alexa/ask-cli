'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const path = require('path');

const MockCommand = require('../mocks/command');
const download = require('../../lib/lambda/download');

describe('Lambda download testing', () => {
    describe('# build download command', () => {
        let command;

        before(() => {
            command = new MockCommand();
            download.createCommand(command);
        });

        beforeEach(() => {
            sinon.stub(download, 'downloadByName');
        });

        afterEach(() => {
            download.downloadByName.restore();
        });

        it('| call download by name with function name provided', () => {
            command.runWith('download -f testFunc');
            expect(download.downloadByName.calledOnce).equal(true);
        });

        it('| pass correct function name with function name provided', () => {
            command.runWith('download -f testFunc');
            expect(download.downloadByName.getCall(0).args[0]).equal('testFunc');
        });

        it('| pass correct dest option with function name provided', () => {
            command.runWith('download -f testFunc -d /somewhere');
            expect(download.downloadByName.getCall(0).args[1]).equal('/somewhere');
        });
    });

    describe('# download Lambda function by name', () => {
        beforeEach(() => {
            sinon.stub(path, 'join');
        });

        afterEach(() => {
            path.join.restore();
        });

        it ('| warn correct message when dest is not existed', () => {
            let fsStub = {
                existsSync: () => {
                    return false;
                }
            };
            let fakeDownload = proxyquire('../../lib/lambda/download', {
                'fs': fsStub,

            });
            sinon.stub(console, 'warn');
            fakeDownload.downloadByName('test', 'test');
            expect(console.warn.getCall(0).args[0]).equal(
                'Please input a valid directory to store the project.'
            );
            console.warn.restore();
        });

        it ('| call path.join with correct parameters if dest is existed', () => {
            let fsStub = {
                existsSync: () => {
                    return true;
                }
            };
            let tmpStub = {
                tmpNameSync: () => {
                    return 'test';
                }
            };
            let initAWSStub = {
                initAWS: () => {
                    return null;
                }
            };
            let fakeDownload = proxyquire('../../lib/lambda/download', {
                'fs': fsStub,
                'tmp': tmpStub,
                '../utils/init-aws': initAWSStub
            });
            sinon.stub(console, 'error');
            fakeDownload.downloadByName('test', 'test');
            expect(path.join.calledOnce).equal(true);
            expect(path.join.getCall(0).args[0]).equal('test');
            expect(path.join.getCall(0).args[1]).equal('test');
            console.error.restore();
        });
    });
});
