'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const clui = require('clui');
const childProcess = require('child_process');
const parser = require('../../lib/utils/skill-parser');

const MockCommand = require('../mocks/command');
const newCommand = require('../../lib/new/new');
const install = require('../../lib/new/install-node-module');

describe('new command testing', () => {
    describe('# build high-level command new', () => {
        let command;

        before(() => {
            command = new MockCommand();
            newCommand.createCommand(command);
        });

        beforeEach(() => {
            sinon.stub(parser, 'isSkillNameValid');
        });

        afterEach(() => {
            parser.isSkillNameValid.restore();
        });

        it('| warn of the required skill name when it not set', () => {
            sinon.stub(console, 'warn');
            command.runWith('new');
            expect(console.warn.getCall(0).args[0]).equal(
                'Please enter the skill-name for the new project.'
            );
            expect(parser.isSkillNameValid.called).equal(false);
            console.warn.restore();
        });

        it('| warn of the invalid skill name', () => {
            sinon.stub(console, 'warn');
            parser.isSkillNameValid.returns(false);
            command.runWith('new -n >_<!!!');
            expect(console.warn.getCall(0).args[0]).equal(
                'Skill name is not valid.\nPattern of the name should be /[a-zA-Z0-9-_]+/.'
            );
            console.warn.restore();
        });
    });

    describe('# install node module', () => {
        let mockSpinner;

        before(() => {
            mockSpinner = new clui.Spinner();
        });

        beforeEach(() => {
            sinon.stub(childProcess, 'exec');
            sinon.stub(clui, 'Spinner', () => {
                return mockSpinner;
            });
            sinon.stub(mockSpinner, 'start', () => {});
        });

        afterEach(() => {
            childProcess.exec.restore();
            clui.Spinner.restore();
            mockSpinner.start.restore();
        });

        it('| run the install without a spinner', (done) => {
            install.install('test', false, done);
            expect(mockSpinner.start.called).equal(false);
            done();
        });

        it('| call exec once', (done) => {
            install.install('test', false, done);
            expect(childProcess.exec.calledOnce).equal(true);
            done();
        });

        it('| call exec with correct parameters', (done) => {
            install.install('test', false, done);
            expect(childProcess.exec.getCall(0).args[0]).equal('npm install');
            done();
        });
    });
});
