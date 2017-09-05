'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const fs =require('fs');

const MockCommand = require('../mocks/command');
const simulateCommand = require('../../lib/simulate/simulate');
const jsonUtility = require('../../lib/utils/json-utility');
const profileHelper = require('../../lib/utils/profile-helper');
const apiWrapper = require('../../lib/api/api-wrapper.js');
const tools = require('../../lib/utils/tools');
const cliSpinner = require('cli-spinner');

describe('simulate command testing', () => {
    describe('# build high-level command simulate', () => {
        let sandbox;
        let command;

        before(() => {
        });

        beforeEach(() => {
            command = new MockCommand();
            simulateCommand.createCommand(command);
            sandbox = sinon.sandbox.create();
            sandbox.stub(console, 'warn');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('| warn of the required file or text when it not set', () => {
            command.runWith('simulate');
            expect(console.warn.getCall(0).args[0]).equal(
                'Please input required parameter: file | text'
            );
        });

        it('| warn if locale is not set and ASK_DEFAULT_DEVICE_LOCALE is not set', () => {
            sandbox.stub(process.env.ASK_DEFAULT_DEVICE_LOCALE).returns(null);
            command.runWith('simulate -f file.tx');
            expect(console.warn.getCall(0).args[0]).equal(
                'Please specify device locale via command line parameter locale or environment variable - ASK_DEFAULT_DEVICE_LOCALE'
            );
        });

        it('| warn if the input file does not exist', () => {
            sandbox.stub(fs, 'existsSync').returns(false);
            command.runWith('simulate -f file.txt -l en-us');
            expect(console.warn.getCall(0).args[0]).equal(
                'Please verify the file exists'
            );
        });

        it ('| warn if project config file does not exist', () => {
            sandbox.stub(fs, 'existsSync')
                   .onFirstCall()
                   .returns(true)
                   .onSecondCall()
                   .returns(false);

            command.runWith('simulate -f file.txt -l en-us');
            expect(console.warn.getCall(0).args[0]).equal(
                'Failed to simulate. ' +
                'Please run this command under the root of the skill project or explictly specify the skill id via skill-id option '
            );
        });

        it ('| warn if project file exists but skill id doesn not exist in the config file', () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(jsonUtility, 'read').returns('askConfig');
            sandbox.stub(jsonUtility, 'getPropertyFromJsonObject').returns(null);
            sandbox.stub(profileHelper, 'runtimeProfile').returns('profile');

            command.runWith('simulate -f file.txt -l en-us');
            expect(console.warn.getCall(0).args[0]).equal(
                'Failed to simulate. ' +
                'The skill that you are trying to simulate has not been created or cloned. ' +
                'If this is a new skill, please try creating and deploying the skill in your project first. ' +
                'If this is an existing skill, please try cloning the skill in your project first. ' +
                'Or you can try expliclty specifying the skill id via skill-id option.'
            );
        });

        it('| warn of both file and text are set', () => {
            command.runWith('simulate -f file.txt -t something');
            expect(console.warn.getCall(0).args[0]).equal(
                'Both file and text parameters are specified. Please indicate which parameter you want.'
            );
        });

        describe('make all the way through to make a apiWrapper call', () => {
            it ('| polling successful', () => {
                sandbox.stub(fs, 'existsSync').returns(true);
                sandbox.stub(jsonUtility, 'read').returns('askConfig');
                sandbox.stub(jsonUtility, 'getPropertyFromJsonObject').returns('12345');
                sandbox.stub(profileHelper, 'runtimeProfile').returns('profile');
                sandbox.stub(apiWrapper, 'callSimulateSkill')
                    .callsArgWith(5, '{"id": 6789, "status": "IN_PROGRESS"}')
                sandbox.stub(apiWrapper, 'callGetSimulation')
                    .callsArgWith(3, '{"id": 6789, "status": "SUCCESSFUL"}');
                let clock = sandbox.useFakeTimers();

                sandbox.stub(console, 'log');
                sandbox.stub(console, 'error');

                command.runWith('simulate -f file.txt -l en-us');
                clock.tick(1001);

                expect(apiWrapper.callSimulateSkill.getCall(0).args[0]).equal('file.txt');
                expect(apiWrapper.callSimulateSkill.getCall(0).args[1]).equal(undefined);
                expect(apiWrapper.callSimulateSkill.getCall(0).args[2]).equal('12345');
                expect(apiWrapper.callSimulateSkill.getCall(0).args[3]).equal('en-us');
                expect(apiWrapper.callSimulateSkill.getCall(0).args[4]).equal('profile');

                expect(console.error.getCall(0).args[0]).equal(
                    '✓ Simulation created for simulation id: 6789'
                );

                let obj = tools.convertDataToJsonObject('{"id": 6789, "status": "SUCCESSFUL"}');
                let str = JSON.stringify(obj, null, 2);
                expect(console.log.getCall(0).args[0]).equal(str);
            });

            it ('| polling failed because the simulation expires its time to live', () => {
                let mockSpinner = new cliSpinner.Spinner();
                sandbox.stub(cliSpinner, 'Spinner', () => { return mockSpinner; });
                sandbox.stub(mockSpinner, 'start');
                sandbox.stub(mockSpinner, 'stop');
                sandbox.stub(fs, 'existsSync').returns(true);
                sandbox.stub(jsonUtility, 'read').returns('askConfig');
                sandbox.stub(jsonUtility, 'getPropertyFromJsonObject').returns('12345');
                sandbox.stub(profileHelper, 'runtimeProfile').returns('profile');
                sandbox.stub(apiWrapper, 'callSimulateSkill')
                    .callsArgWith(5, '{"id": 6789, "status": "IN_PROGRESS"}')
                sandbox.stub(apiWrapper, 'callGetSimulation')
                    .onFirstCall()
                    .callsArgWith(3, '{"id": 6789, "status": "IN_PROGRESS"}')
                    .onSecondCall()
                    .callsArgWith(3, '{}');
                let clock = sandbox.useFakeTimers();

                sandbox.stub(console, 'error');

                command.runWith('simulate -f file.txt -l en-us');
                clock.tick(1001);
                clock.tick(1001);

                expect(apiWrapper.callSimulateSkill.getCall(0).args[0]).equal('file.txt');
                expect(apiWrapper.callSimulateSkill.getCall(0).args[1]).equal(undefined);
                expect(apiWrapper.callSimulateSkill.getCall(0).args[2]).equal('12345');
                expect(apiWrapper.callSimulateSkill.getCall(0).args[3]).equal('en-us');
                expect(apiWrapper.callSimulateSkill.getCall(0).args[4]).equal('profile');

                expect(console.error.getCall(0).args[0]).equal(
                    '✓ Simulation created for simulation id: 6789'
                );

                expect(console.error.getCall(1).args[0]).equal(
                    '𐄂 Simulation failed because the simulation with id 6789 has expired its time-to-live'
                );
            });
        });
    });
});
