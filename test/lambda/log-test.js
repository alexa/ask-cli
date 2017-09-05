'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const aws = require('aws-sdk');

const MockCommand = require('../mocks/command');
const log = require('../../lib/lambda/log');

describe('Lambda log testing', () => {

    describe('# verify parameters', () => {
        let command, cloudWatch;

        before(() => {
            command = new MockCommand();
            log.createCommand(command);
            cloudWatch = new aws.CloudWatchLogs();
        });

        beforeEach(() => {
            sinon.stub(aws, 'CloudWatchLogs', () => {
                return cloudWatch;
            });
            sinon.stub(cloudWatch, 'filterLogEvents');
        });

        afterEach(() => {
            aws.CloudWatchLogs.restore();
            cloudWatch.filterLogEvents.restore();
        });

        it('| pass correct function name with function name provided', () => {
            let expectFuncName = '/aws/lambda/testFunc';
            sinon.stub(console, 'log');
            command.runWith('log -f testFunc');
            expect(cloudWatch.filterLogEvents.getCall(0).args[0].logGroupName).equal(expectFuncName);
            console.log.restore();
        });

        it('| run with correct start time', () => {
            sinon.stub(console, 'log');
            let expectStartTime = 1451635200000;
            command.runWith('log --start-time 2016/01/01');
            expect(cloudWatch.filterLogEvents.getCall(0).args[0].startTime).equal(expectStartTime);
            console.log.restore();
        });

        it('| run with correct end time', () => {
            sinon.stub(console, 'log');
            let expectEndTime = 1451635200000;
            command.runWith('log --end-time 2016/01/01');
            expect(cloudWatch.filterLogEvents.getCall(0).args[0].endTime).equal(expectEndTime);
            console.log.restore();
        });

        it('| run with correct limit', () => {
            sinon.stub(console, 'log');
            command.runWith('log --limit 15');
            expect(parseInt(cloudWatch.filterLogEvents.getCall(0).args[0].limit)).equal(15);
            console.log.restore();
        });
    });

    describe('# display logs correct', () => {
        let command, cloudWatch;

        before(() => {
            command = new MockCommand();
            log.createCommand(command);
            cloudWatch = new aws.CloudWatchLogs();
        });

        beforeEach(() => {
            sinon.stub(aws, 'CloudWatchLogs', () => {
                return cloudWatch;
            });
            sinon.stub(cloudWatch, 'filterLogEvents');
        });

        afterEach(() => {
            aws.CloudWatchLogs.restore();
            cloudWatch.filterLogEvents.restore();
        });

        it('| set up the CloudWatchLogs client', () => {
            command.runWith('log -f testFunc --raw');
            expect(aws.CloudWatchLogs.calledOnce).equal(true);
        });

        it('| call the filterLogEvents function once', () => {
            command.runWith('log -f testFunc --raw');
            expect(cloudWatch.filterLogEvents.calledOnce).equal(true);
        });

        it('| show error when get log events', () => {
            sinon.stub(console, 'error');
            cloudWatch.filterLogEvents.callsArgWith(1, 'error', null);
            command.runWith('log -f testFunc --raw');
            expect(console.error.getCall(0).args[0]).equal('Log events error.\nerror');
            console.error.restore();
        });

        it('| show correct information of log events', () => {
            sinon.stub(console, 'log');
            let data = {
                events: [
                    {message: 'log1     '},
                    {message: 'log2'}
                ]
            };
            cloudWatch.filterLogEvents.callsArgWith(1, null, data);
            command.runWith('log -f testFunc --raw');
            expect(console.log.calledTwice).equal(true);
            expect(console.log.getCall(0).args[0]).equal('log1');
            expect(console.log.getCall(1).args[0]).equal('log2');
            console.log.restore();
        });

        it('| show correct information of log events with color', () => {
            sinon.stub(console, 'log');
            let data = {
                events: [
                    {message: 'STARTlog1'},
                    {message: 'ENDlog2'},
                    {message: 'REPORTlog3'},
                    {message: 'log4'}
                ]
            };
            cloudWatch.filterLogEvents.callsArgWith(1, null, data);
            command.runWith('log -f testFunc');
            expect(console.log.callCount).equal(4);
            console.log.restore();
        });
    });

});
