const { expect } = require('chai');
const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

const { makeFolderInTempDirectory } = require('@test/test-utils');
const AbstractBuildFlow = require('@src/builtins/build-flows/abstract-build-flow');
const Messenger = require('@src/view/messenger');

const fixturesDirectory = path.join(process.cwd(), 'test', 'unit', 'fixture', 'build-flow');

describe('AbstractBuildFlow test', () => {
    let config;
    let debugStub;
    beforeEach(() => {
        const cwd = makeFolderInTempDirectory('abstract-build-flow');
        const buildFile = path.join(cwd, 'build.zip');
        fs.copySync(fixturesDirectory, cwd);
        config = {
            cwd,
            src: 'src',
            buildFile,
            doDebug: false
        };
        debugStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({ debug: debugStub });
    });

    describe('# inspect correctness for constructor', () => {
        it('| initiate the class', () => {
            const buildFlow = new AbstractBuildFlow(config);

            expect(buildFlow).to.be.instanceOf(AbstractBuildFlow);
        });
    });

    describe('# inspect correctness of createZip and modifyZip', () => {
        it('| should call create and modify temp zip', (done) => {
            const buildFlow = new AbstractBuildFlow(config);

            buildFlow.createZip((err, res) => {
                expect(err).eql(null);
                expect(res).eql('');
                buildFlow.modifyZip((errModify, resModify) => {
                    expect(errModify).eql(null);
                    expect(resModify).eql('');
                    done();
                });
            });
        });

        it('| should call create and modify temp zip with options', (done) => {
            const buildFlow = new AbstractBuildFlow(config);

            buildFlow.createZip({ filter: () => false }, (err, res) => {
                expect(err).eql(null);
                expect(res).eql('');
                buildFlow.modifyZip({ entryProcessor: () => {} }, (errModify, resModify) => {
                    expect(errModify).eql(null);
                    expect(resModify).eql('');
                    done();
                });
            });
        });
    });

    describe('# inspect correctness of execCommand', () => {
        it('| should execute the command', () => {
            const testCommand = 'test';
            const stub = sinon.stub(childProcess, 'execSync');
            const buildFlow = new AbstractBuildFlow(config);

            buildFlow.execCommand(testCommand);
            expect(stub.callCount).eql(1);
            expect(stub.args[0][0]).eql(testCommand);
        });
    });

    describe('# inspect correctness of debug', () => {
        it('| should not output debug message', () => {
            const buildFlow = new AbstractBuildFlow(config);

            buildFlow.debug('test');
            expect(debugStub.callCount).eql(0);
        });

        it('| should output debug message', () => {
            config.doDebug = true;
            const buildFlow = new AbstractBuildFlow(config);

            buildFlow.debug('test');
            expect(debugStub.callCount).eql(1);
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
