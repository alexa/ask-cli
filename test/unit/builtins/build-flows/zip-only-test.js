const { expect } = require('chai');
const sinon = require('sinon');

const AbstractBuildFlow = require('@src/builtins/build-flows/abstract-build-flow');
const ZipOnlyBuildFlow = require('@src/builtins/build-flows/zip-only');

describe('ZipOnlyBuildFlow test', () => {
    let config;
    let createZipStub;
    beforeEach(() => {
        config = {
            cwd: 'cwd',
            src: 'src',
            buildFile: 'buildFile',
            doDebug: false
        };
        createZipStub = sinon.stub(AbstractBuildFlow.prototype, 'createZip').yields();
    });
    describe('# inspect correctness of execute', () => {
        it('| should execute commands', (done) => {
            const buildFlow = new ZipOnlyBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(createZipStub.callCount).eql(1);
                done();
            });
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
