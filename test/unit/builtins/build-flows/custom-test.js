const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');

const AbstractBuildFlow = require('@src/builtins/build-flows/abstract-build-flow');
const CustomBuildFlow = require('@src/builtins/build-flows/custom');

describe('CustomBuildFlow test', () => {
    let config;
    let execStub;
    let debugStub;
    let platformStub;
    beforeEach(() => {
        config = {
            cwd: 'cwd',
            src: 'src',
            buildFile: 'buildFile',
            doDebug: false
        };
        sinon.stub(path, 'join').returns('some-script');
        execStub = sinon.stub(AbstractBuildFlow.prototype, 'execCommand');
        debugStub = sinon.stub(AbstractBuildFlow.prototype, 'debug');
        platformStub = sinon.stub(process, 'platform').value('darwin');
    });
    describe('# inspect correctness of execute', () => {
        it('| should execute commands', (done) => {
            const buildFlow = new CustomBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(execStub.args[0][0]).eql('some-script "buildFile" false');
                done();
            });
        });

        it('| should execute commands on windows', (done) => {
            platformStub.value('win32');
            const buildFlow = new CustomBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(execStub.args[0][0]).eql('PowerShell.exe -Command "& {& \'some-script\' \'buildFile\' $False }"');
                done();
            });
        });

        it('| should execute commands with debug', (done) => {
            config.doDebug = true;
            const buildFlow = new CustomBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(execStub.args[0][0]).eql('some-script "buildFile" true');
                expect(debugStub.args[0][0]).eql('Executing custom hook script some-script.');
                done();
            });
        });

        it('| should execute commands with debug on windows', (done) => {
            platformStub.value('win32');
            config.doDebug = true;
            const buildFlow = new CustomBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(execStub.args[0][0]).eql('PowerShell.exe -Command "& {& \'some-script\' \'buildFile\' $True }"');
                expect(debugStub.args[0][0]).eql('Executing custom hook script some-script.');
                done();
            });
        });
    });

    describe('# inspect correctness of manifest getter', () => {
        it('| should return manifest script for windows', () => {
            platformStub.value('win32');

            const { manifest } = CustomBuildFlow;

            expect(manifest).eq('build.ps1');
        });

        it('| should return manifest script for non windows', () => {
            const { manifest } = CustomBuildFlow;

            expect(manifest).eq('build.sh');
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
