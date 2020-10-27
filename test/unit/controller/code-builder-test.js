const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const ZipOnlyBuildFlow = require('@src/builtins/build-flows/zip-only');
const NodeJsNpmBuildFlow = require('@src/builtins/build-flows/nodejs-npm');
const CodeBuilder = require('@src/controllers/skill-code-controller/code-builder');

describe('Controller test - CodeBuilder test', () => {
    const config = {
        src: 'src',
        build: 'buildFile',
        doDebug: false
    };
    let selectBuildFlowClassStub;
    beforeEach(() => {
        sinon.stub(fs, 'ensureDirSync');
        sinon.stub(fs, 'emptyDirSync');
        sinon.stub(fs, 'copySync');
        sinon.stub(path, 'resolve');
    });

    describe('# inspect correctness for constructor', () => {
        it('| initiate CodeBuilder', () => {
            selectBuildFlowClassStub = sinon.stub(CodeBuilder.prototype, '_selectBuildFlowClass');
            const codeBuilder = new CodeBuilder(config);

            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(config.src);
            expect(codeBuilder.build).deep.equal(config.build);
            expect(codeBuilder.doDebug).equal(config.doDebug);
            expect(selectBuildFlowClassStub.callCount).equal(1);
        });
    });

    describe('# inspect correctness of execute method', () => {
        it('| should execute zip only build flow when no other build flow is found', (done) => {
            sinon.stub(path, 'join');
            sinon.stub(fs, 'existsSync').returns(false);
            const executeStub = sinon.stub(ZipOnlyBuildFlow.prototype, 'execute').yields();
            const codeBuilder = new CodeBuilder(config);

            codeBuilder.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(codeBuilder.BuildFlowClass.name).equal('ZipOnlyBuildFlow');
                expect(executeStub.callCount).equal(1);
                done();
            });
        });

        it('| should execute node js npm build flow', (done) => {
            sinon.stub(path, 'join')
                .returns('some-file')
                .withArgs(sinon.match.any, sinon.match('package.json')).returns('package.json');
            sinon.stub(fs, 'existsSync')
                .returns(false)
                .withArgs(sinon.match('package.json')).returns(true);
            const executeStub = sinon.stub(NodeJsNpmBuildFlow.prototype, 'execute').yields();
            const codeBuilder = new CodeBuilder(config);

            codeBuilder.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(codeBuilder.BuildFlowClass.name).equal('NodeJsNpmBuildFlow');
                expect(executeStub.callCount).equal(1);
                done();
            });
        });

        it('| should throw error when unable to set up build folder', (done) => {
            const error = 'someError';
            sinon.stub(CodeBuilder.prototype, '_selectBuildFlowClass');
            sinon.stub(CodeBuilder.prototype, '_setUpBuildFolder').throws(new Error(error));
            const codeBuilder = new CodeBuilder(config);

            codeBuilder.execute((err, res) => {
                expect(err.message).eql(error);
                expect(res).eql(undefined);
                done();
            });
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
