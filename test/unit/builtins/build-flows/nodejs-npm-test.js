const { expect } = require('chai');
const sinon = require('sinon');

const AbstractBuildFlow = require('@src/builtins/build-flows/abstract-build-flow');
const NodeJsNpmBuildFlow = require('@src/builtins/build-flows/nodejs-npm');

describe('NodeJsNpmBuildFlow test', () => {
    let config;
    let execStub;
    let debugStub;
    let createZipStub;
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
    });
    describe('# inspect correctness of execute', () => {
        it('| should execute commands', (done) => {
            const buildFlow = new NodeJsNpmBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(execStub.args[0][0]).eql('npm install --production --quite');
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
                expect(execStub.args[0][0]).eql('npm install --production');
                expect(debugStub.args[0][0]).eql('Installing NodeJS dependencies based on the package.json.');
                done();
            });
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
