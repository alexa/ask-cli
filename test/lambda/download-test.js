'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const path = require('path');
const aws = require('aws-sdk');
const inquirer = require('inquirer');
const fs = require('fs');
const tmp = require('tmp');
const clui = require('clui');
const https = require('https');
const initAWS = require('../../lib/utils/init-aws');

const MockCommand = require('../mocks/command');
const download = require('../../lib/lambda/download');

describe('Lambda download testing', () => {
    describe('# build download command', () => {
        let command, lambda;

        before(() => {
            lambda = new aws.Lambda();
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

    describe('# download by list', () => {
        let sandbox;
        let command, lambda;

        before(() => {
            lambda = new aws.Lambda();
            command = new MockCommand();
            download.createCommand(command);
        });

        beforeEach(() => {
            sandbox = sinon.sandbox.create();

            sandbox.stub(download, 'downloadByName');
            sandbox.stub(initAWS, 'initAWS', () => {
                return aws;
            });
            sandbox.stub(aws, 'Lambda', () => {
                return lambda;
            });
            sandbox.stub(lambda, 'listFunctions');
            sandbox.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('| call list of functions from Lambda', () => {
            command.runWith('download');
            expect(lambda.listFunctions.calledOnce).equal(true);
        });

        // it('| list of functions has an error occured', () => {
        //     sandbox.stub(console, 'error');
        //     lambda.listFunctions.callsArgWith(1, 'error', null);
        //     command.runWith('download');
        //     expect(console.error.getCall(0).args[0]).equal(
        //         'List of functions error.\nerror'
        //     );
        // });

        // it('| list of functions is running correctly', () => {
        //     let data = {
        //         Functions: [{
        //             FunctionName: 'func1'
        //         }]
        //     };
        //     lambda.listFunctions.callsArgWith(1, null, data);
        //     inquirer.prompt.returns({
        //         then: () => {}
        //     });
        //     command.runWith('download');
        //     expect(inquirer.prompt.calledOnce).equal(true);
        // });
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
                'fs': fsStub
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

    describe('# download from Lambda', () => {
        let sandbox;
        let lambda, mockSpinner;

        before(() => {
            lambda = new aws.Lambda();
            mockSpinner = new clui.Spinner();
        });

        beforeEach(() => {
            sandbox = sinon.sandbox.create();

            sandbox.stub(path, 'join');
            sandbox.stub(fs, 'existsSync');
            sandbox.stub(tmp, 'tmpNameSync');
            sandbox.stub(initAWS, 'isLambdaArn');
            sandbox.stub(initAWS, 'setRegionWithLambda');
            sandbox.stub(initAWS, 'initAWS', () => {
                return aws;
            });
            sandbox.stub(aws, 'Lambda', () => {
                return lambda;
            });
            sandbox.stub(lambda, 'getFunction');
            sandbox.stub(clui, 'Spinner', () => {
                return mockSpinner;
            });
            sandbox.stub(mockSpinner, 'start');
            sandbox.stub(https, 'get');
            sandbox.stub(fs, 'mkdirSync');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('| call setRegionWithLambda from initAWS when it is Lambda arn', () => {
            tmp.tmpNameSync.returns('tmpName');
            fs.existsSync.returns(true);
            path.join.returns('test/fixture/tmpPath.zip');
            initAWS.isLambdaArn.returns(true);
            download.downloadByName('func', 'dest');
            expect(initAWS.setRegionWithLambda.calledOnce).equal(true);
        });

        it('| call get function from Lambda', () => {
            tmp.tmpNameSync.returns('tmpName');
            fs.existsSync.returns(true);
            path.join.returns('test/fixture/tmpPath.zip');
            initAWS.isLambdaArn.returns(false);
            download.downloadByName('func', 'dest');
            expect(lambda.getFunction.calledOnce).equal(true);
        });

        it('| get Lambda function without error', () => {
            tmp.tmpNameSync.returns('tmpName');
            fs.existsSync.returns(true);
            path.join.returns('test/fixture/tmpPath.zip');
            initAWS.isLambdaArn.returns(false);
            let data = {
                Code: {
                    Location: 'url'
                }
            };
            lambda.getFunction.callsArgWith(1, null, data);
            download.downloadByName('func', 'dest');
            expect(https.get.getCall(0).args[0]).equal('url');
        });

        it('| get Lambda function with error', () => {
            sandbox.stub(console, 'error');
            tmp.tmpNameSync.returns('tmpName');
            fs.existsSync.returns(true);
            path.join.returns('test/fixture/tmpPath.zip');
            initAWS.isLambdaArn.returns(false);
            lambda.getFunction.callsArgWith(1, 'error', null);
            download.downloadByName('func', 'dest');
            expect(console.error.getCall(0).args[0]).equal(
                'Get lambda function error.\nerror'
            );
        });

        it('| unzip Lambda function code file after get Lambda function', () => {
            tmp.tmpNameSync.returns('tmpName');
            fs.existsSync.returns(true);
            path.join.returns('test/fixture/tmpPath.zip');
            initAWS.isLambdaArn.returns(false);
            let data = {
                Code: {
                    Location: 'url'
                }
            };
            lambda.getFunction.callsArgWith(1, null, data);
            let response = {
                pipe: () => {
                    return {
                        on: (str) => {
                            if (str === 'finish') {
                                return;
                            }
                        }
                    };
                }
            };
            https.get.callsArgWith(1, response);
            download.downloadByName('func', 'dest');
            expect(fs.mkdirSync.calledOnce).equal(false);
        });
    });
});
