'use strict';
 
 const expect = require('chai').expect;
 const sinon = require('sinon');
 const childProcess = require('child_process');
 const fs =require('fs');
 
 const MockCommand = require('../mocks/command');
 const simulateCommand = require('../../lib/simulate/simulate');
 const apiWrapper = require('../../lib/api/api-wrapper.js');
 const tools = require('../../lib/utils/tools');
 const clui = require('clui');
 
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
                 'Please input required parameter: skill-id'
             );
         });

         it('| warn of the required file or text when it not set', () => {
             command.runWith('simulate -s skill-id');
             expect(console.warn.getCall(0).args[0]).equal(
                 'Please input required parameter: file | text'
             );
         });
 
         it('| warn if locale is not set and ASK_DEFAULT_DEVICE_LOCALE is not set', () => {
             sandbox.stub(process.env.ASK_DEFAULT_DEVICE_LOCALE).returns(null);
             command.runWith('simulate -s skill-id -f file.tx');
             expect(console.warn.getCall(0).args[0]).equal(
                 'Please specify device locale via command line parameter locale or environment variable - ASK_DEFAULT_DEVICE_LOCALE'
             );
         });
 
         it('| warn if the input file does not exist', () => {
             sandbox.stub(fs, 'existsSync').returns(false);
             command.runWith('simulate -s skill-id -f file.txt -l en-us');
             expect(console.warn.getCall(0).args[0]).equal(
                 'Please verify the file exists'
             );
         });
 
         it('| warn of both file and text are set', () => {
             command.runWith('simulate -s skill-id -f file.txt -t something');
             expect(console.warn.getCall(0).args[0]).equal(
                 'Both file and text parameters are specified. Please indicate which parameter you want.'
             );
         });
 
         describe('make all the way through to make a apiWrapper call', () => {
             it ('| polling successful', () => {
                 sandbox.stub(fs, 'existsSync').returns(true);
                 sandbox.stub(apiWrapper, 'callSimulateSkill')
                     .callsArgWith(4, '{"id": 6789, "status": "IN_PROGRESS"}')
                 sandbox.stub(apiWrapper, 'callGetSimulation')
                     .callsArgWith(2, '{"id": 6789, "status": "SUCCESSFUL"}');
                 let clock = sandbox.useFakeTimers();
 
                 sandbox.stub(console, 'log');
 
                 command.runWith('simulate -s 12345 -f file.txt -l en-us');
                 clock.tick(1001);
 
                 expect(apiWrapper.callSimulateSkill.getCall(0).args[0]).equal('file.txt');
                 expect(apiWrapper.callSimulateSkill.getCall(0).args[1]).equal(undefined);
                 expect(apiWrapper.callSimulateSkill.getCall(0).args[2]).equal('12345');
                 expect(apiWrapper.callSimulateSkill.getCall(0).args[3]).equal('en-us');
 
                 expect(console.log.getCall(0).args[0]).equal(
                     '✓ Simulation created for simulation id: 6789'
                 );
 
                 let obj = tools.convertDataToJsonObject('{"id": 6789, "status": "SUCCESSFUL"}');
                 let str = JSON.stringify(obj, null, 2);
                 expect(console.log.getCall(1).args[0]).equal(str);
             });
 
             it ('| polling failed because the simulation expires its time to live', () => {
                 let mockSpinner = new clui.Spinner();
                 sandbox.stub(clui, 'Spinner', () => { return mockSpinner; });
                 sandbox.stub(mockSpinner, 'start');
                 sandbox.stub(mockSpinner, 'stop');
                 sandbox.stub(fs, 'existsSync').returns(true);
                 sandbox.stub(apiWrapper, 'callSimulateSkill')
                     .callsArgWith(4, '{"id": 6789, "status": "IN_PROGRESS"}')
                 sandbox.stub(apiWrapper, 'callGetSimulation')
                     .onFirstCall()
                     .callsArgWith(2, '{"id": 6789, "status": "IN_PROGRESS"}')
                     .onSecondCall()
                     .callsArgWith(2, '{}');
                 let clock = sandbox.useFakeTimers();
 
                 sandbox.stub(console, 'log');
 
                 command.runWith('simulate -s 12345 -f file.txt -l en-us');
                 clock.tick(1001);
                 clock.tick(1001);
 
                 expect(apiWrapper.callSimulateSkill.getCall(0).args[0]).equal('file.txt');
                 expect(apiWrapper.callSimulateSkill.getCall(0).args[1]).equal(undefined);
                 expect(apiWrapper.callSimulateSkill.getCall(0).args[2]).equal('12345');
                 expect(apiWrapper.callSimulateSkill.getCall(0).args[3]).equal('en-us');
 
                 expect(console.log.getCall(0).args[0]).equal(
                     '✓ Simulation created for simulation id: 6789'
                 );
 
                 expect(console.log.getCall(1).args[0]).equal(
                     '𐄂 Simulation failed because the simulation with id 6789 has expired its time-to-live'
                 );
             });
         });
     });
 });