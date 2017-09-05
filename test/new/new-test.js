'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const parser = require('../../lib/utils/skill-parser');
const template = require('../../lib/utils/template');
const childProcess = require('child_process');
const clui = require('clui');
const fs =require('fs');

const MockCommand = require('../mocks/command');
const newCommand = require('../../lib/new/new');
const install = require('../../lib/new/install-node-module');

describe('new command testing', () => {
    // describe('# build high-level command new', () => {
    //     let sandbox;
    //     let command;
    //
    //     before(() => {
    //         command = new MockCommand();
    //         newCommand.createCommand(command);
    //     });
    //
    //     beforeEach(() => {
    //         sandbox = sinon.sandbox.create();
    //
    //         sandbox.stub(parser, 'isSkillNameValid');
    //         sandbox.stub(fs, 'access');
    //         sandbox.stub(fs, 'mkdirSync');
    //         sandbox.stub(fs, 'existsSync');
    //         sandbox.stub(install, 'install');
    //         sandbox.stub(template, 'copyConfig');
    //         sandbox.stub(template, 'copyModel');
    //         sandbox.stub(template, 'copySkill');
    //         sandbox.stub(template, 'copyLambda');
    //     });
    //
    //     afterEach(() => {
    //         sandbox.restore();
    //     });
    //
    //     it('| warn of the required skill name when it not set', () => {
    //         sandbox.stub(console, 'warn');
    //         command.runWith('new');
    //         expect(console.warn.getCall(0).args[0]).equal(
    //             'Please enter the skill-name for the new project.'
    //         );
    //         expect(parser.isSkillNameValid.called).equal(false);
    //     });
    //
    //     it('| warn of the invalid skill name', () => {
    //         sandbox.stub(console, 'warn');
    //         parser.isSkillNameValid.returns(false);
    //         command.runWith('new -n >_<!!!');
    //         expect(console.warn.getCall(0).args[0]).equal(
    //             'Skill name is not valid.\nPattern of the name should be /[a-zA-Z0-9-_]+/.'
    //         );
    //     });
    //
    //     it('| create new skill scaffold if skill name is valid', () => {
    //         parser.isSkillNameValid.returns(true);
    //         command.runWith('new -n skillName');
    //         expect(fs.access.calledOnce).equal(true);
    //     });
    //
    //     it('| fs access error', () => {
    //         sandbox.stub(console, 'error');
    //         parser.isSkillNameValid.returns(true);
    //         fs.access.callsArgWith(2, 'error');
    //         command.runWith('new -n skillName');
    //         expect(console.error.getCall(0).args[0]).equal(
    //             'No permission to write for the current path.'
    //         );
    //     });
    //
    //     it('| new project directory already exists', () => {
    //         sandbox.stub(console, 'warn');
    //         parser.isSkillNameValid.returns(true);
    //         fs.access.callsArgWith(0, 'dir');
    //         fs.access.callsArgWith(2, null);
    //         fs.existsSync.returns(true);
    //         command.runWith('new -n skillName');
    //         expect(console.warn.getCall(0).args[0]).equal(
    //             'Failed to create skill project with the name already existed.'
    //         );
    //     });
    //
    //     it('| new is working fine and will install node module', () => {
    //         parser.isSkillNameValid.returns(true);
    //         fs.access.callsArgWith(0, 'dir');
    //         fs.access.callsArgWith(2, null);
    //         fs.existsSync.returns(false);
    //         command.runWith('new -n skillName');
    //         expect(install.install.calledOnce).equal(true);
    //     });
    // });

    describe('# install node module', () => {
        let mockSpinner;
        let emptyCallback = () => {};

        before(() => {
            mockSpinner = new clui.Spinner();
        });

        beforeEach(() => {
            sinon.stub(childProcess, 'exec');
            sinon.stub(clui, 'Spinner', () => {
                return mockSpinner;
            });
            sinon.stub(mockSpinner, 'start', () => {});
            sinon.stub(console, 'error');
        });

        afterEach(() => {
            childProcess.exec.restore();
            clui.Spinner.restore();
            mockSpinner.start.restore();
            console.error.restore();
        });

        it('| run the install without a spinner', () => {
            install.install('test', false, emptyCallback);
            expect(mockSpinner.start.called).equal(false);
        });

        it('| call exec once', () => {
            install.install('test', false, emptyCallback);
            expect(childProcess.exec.calledOnce).equal(true);
        });

        it('| call exec with correct parameters', () => {
            install.install('test', false, emptyCallback);
            expect(childProcess.exec.getCall(0).args[0]).equal('npm install');
        });
    });
});
