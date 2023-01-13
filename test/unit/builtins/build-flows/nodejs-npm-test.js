const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');

const AbstractBuildFlow = require('@src/builtins/build-flows/abstract-build-flow');
const NodeJsNpmBuildFlow = require('@src/builtins/build-flows/nodejs-npm');

describe('NodeJsNpmBuildFlow test', () => {
    let config;
    let execStub;
    let debugStub;
    let createZipStub;
    let lockFileStub;
    beforeEach(() => {
        config = {
            cwd: 'cwd',
            src: 'src',
            buildFile: 'buildFile',
            doDebug: false
        };
        execStub = sinon.stub(AbstractBuildFlow.prototype, 'execCommand');
        debugStub = sinon.stub(AbstractBuildFlow.prototype, 'debug');
        createZipStub = sinon.stub(AbstractBuildFlow.prototype, 'createZip').yields();
        lockFileStub = sinon.stub(fs, 'existsSync').returns(false);
    });
    describe('# inspect correctness of execute', () => {
        it('| should execute commands', (done) => {
            const buildFlow = new NodeJsNpmBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(buildFlow.env.NODE_ENV).eql('production');
                expect(execStub.args[0][0]).eql('npm install --quiet');
                expect(createZipStub.callCount).eql(1);
                done();
            });
        });

        it('| should execute commands with package lock file', (done) => {
            lockFileStub.returns(true);
            const buildFlow = new NodeJsNpmBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(buildFlow.env.NODE_ENV).eql('production');
                expect(execStub.args[0][0]).eql('npm ci --quiet');
                expect(createZipStub.callCount).eql(1);
                done();
            });
        });

        it('| should execute commands with debug flag', (done) => {
            config.doDebug = true;
            const buildFlow = new NodeJsNpmBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(buildFlow.env.NODE_ENV).eql('production');
                expect(execStub.args[0][0]).eql('npm install');
                expect(debugStub.args[0][0]).eql('Installing NodeJS dependencies based on the package.json.');
                expect(createZipStub.callCount).eql(1);
                done();
            });
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
