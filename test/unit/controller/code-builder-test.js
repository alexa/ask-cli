const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const shell = require('shelljs');
const CodeBuilder = require('@src/controllers/skill-code-controller/code-builder');
const zipUtils = require('@src/utils/zip-utils');

describe('Controller test - CodeBuilder test', () => {
    const TEST_SRC = 'src';
    const TEST_BUILD_FILE = 'buildFile';
    const TEST_BUILD_FOLDER = 'buildFolder';
    const TEST_BUILD = { file: TEST_BUILD_FILE, folder: TEST_BUILD_FOLDER };
    const TEST_DO_DEBUG = false;
    const TEST_ZIP_FILE_PATH = 'zipFilePath';
    const TEST_CONFIGURATION = {
        src: TEST_SRC,
        build: TEST_BUILD,
        doDebug: TEST_DO_DEBUG
    };

    describe('# inspect correctness for constructor', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| initiate as a CodeBuilder class and OS is on win32', () => {
            // setup
            sinon.stub(CodeBuilder.prototype, '_decidePackageBuilder');
            sinon.stub(process, 'platform').value('win32');
            // call
            const codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            // verify
            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(TEST_SRC);
            expect(codeBuilder.build).deep.equal(TEST_BUILD);
            expect(codeBuilder.doDebug).equal(TEST_DO_DEBUG);
            expect(codeBuilder.osType).equal('WINDOWS');
        });

        it('| initiate as a CodeBuilder class and OS is on non-win32', () => {
            // setup
            sinon.stub(CodeBuilder.prototype, '_decidePackageBuilder');
            sinon.stub(process, 'platform').value('anyOther');
            // call
            const codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            // verify
            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(TEST_SRC);
            expect(codeBuilder.build).deep.equal(TEST_BUILD);
            expect(codeBuilder.doDebug).equal(TEST_DO_DEBUG);
            expect(codeBuilder.osType).equal('UNIX');
        });

        it('| decide build flow as custom hook script during CodeBuilder instantiating on win32', () => {
            // setup
            sinon.stub(process, 'platform').value('win32');
            sinon.stub(fs, 'existsSync').returns(true);
            // call
            const codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            // verify
            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(TEST_SRC);
            expect(codeBuilder.build).deep.equal(TEST_BUILD);
            expect(codeBuilder.doDebug).equal(TEST_DO_DEBUG);
            expect(codeBuilder.osType).equal('WINDOWS');
            expect(codeBuilder.buildFlow).equal('custom');
            expect(codeBuilder.packageBuilder).equal(path.join(process.cwd(), 'hooks', 'build.ps1'));
        });

        it('| decide build flow as custom hook script during CodeBuilder instantiating on non-win32', () => {
            // setup
            sinon.stub(process, 'platform').value('non-win32');
            sinon.stub(fs, 'existsSync').returns(true);
            // call
            const codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            // verify
            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(TEST_SRC);
            expect(codeBuilder.build).deep.equal(TEST_BUILD);
            expect(codeBuilder.doDebug).equal(TEST_DO_DEBUG);
            expect(codeBuilder.osType).equal('UNIX');
            expect(codeBuilder.buildFlow).equal('custom');
            expect(codeBuilder.packageBuilder).equal(path.join(process.cwd(), 'hooks', 'build.sh'));
        });

        it('| decide build flow as builtin nodejs codebase during CodeBuilder instantiating on win32', () => {
            // setup
            const TEST_HOOK_SCRIPT = path.join(process.cwd(), 'hooks', 'build.ps1');
            sinon.stub(process, 'platform').value('win32');
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(TEST_HOOK_SCRIPT).returns(false);
            fs.existsSync.withArgs(path.join(TEST_SRC, 'requirements.txt')).returns(true);
            sinon.stub(fs, 'statSync').returns({
                isDirectory: () => true
            });
            // call
            const codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            // verify
            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(TEST_SRC);
            expect(codeBuilder.build).deep.equal(TEST_BUILD);
            expect(codeBuilder.doDebug).equal(TEST_DO_DEBUG);
            expect(codeBuilder.osType).equal('WINDOWS');
            expect(codeBuilder.buildFlow).equal('python-pip');
            expect(codeBuilder.packageBuilder.endsWith(`build-flows${path.sep}python-pip${path.sep}build.ps1`)).equal(true);
        });

        it('| decide build flow as builtin nodejs codebase during CodeBuilder instantiating on non-win32', () => {
            // setup
            const TEST_HOOK_SCRIPT = path.join(process.cwd(), 'hooks', 'build.sh');
            sinon.stub(process, 'platform').value('non-win32');
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(TEST_HOOK_SCRIPT).returns(false);
            fs.existsSync.withArgs(path.join(TEST_SRC, 'pom.xml')).returns(true);
            sinon.stub(fs, 'statSync').returns({
                isDirectory: () => true
            });
            // call
            const codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            // verify
            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(TEST_SRC);
            expect(codeBuilder.build).deep.equal(TEST_BUILD);
            expect(codeBuilder.doDebug).equal(TEST_DO_DEBUG);
            expect(codeBuilder.osType).equal('UNIX');
            expect(codeBuilder.buildFlow).equal('java-mvn');
            expect(codeBuilder.packageBuilder.endsWith(`build-flows${path.sep}java-mvn${path.sep}build.sh`)).equal(true);
        });

        it('| decide build flow as zip-only build flow during CodeBuilder instantiating on win32', () => {
            // setup
            const TEST_HOOK_SCRIPT = path.join(process.cwd(), 'hooks', 'build.ps1');
            sinon.stub(process, 'platform').value('win32');
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(TEST_HOOK_SCRIPT).returns(false);
            sinon.stub(fs, 'statSync').returns({
                isDirectory: () => false
            });
            // call
            const codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            // verify
            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(TEST_SRC);
            expect(codeBuilder.build).deep.equal(TEST_BUILD);
            expect(codeBuilder.doDebug).equal(TEST_DO_DEBUG);
            expect(codeBuilder.osType).equal('WINDOWS');
            expect(codeBuilder.buildFlow).equal('zip-only');
            expect(codeBuilder.packageBuilder).equal(null);
        });

        it('| decide build flow as zip-only build flow during CodeBuilder instantiating on non-win32', () => {
            // setup
            const TEST_HOOK_SCRIPT = path.join(process.cwd(), 'hooks', 'build.sh');
            sinon.stub(process, 'platform').value('non-win32');
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(TEST_HOOK_SCRIPT).returns(false);
            sinon.stub(fs, 'statSync').returns({
                isDirectory: () => false
            });
            // call
            const codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            // verify
            expect(codeBuilder).to.be.instanceOf(CodeBuilder);
            expect(codeBuilder.src).equal(TEST_SRC);
            expect(codeBuilder.build).deep.equal(TEST_BUILD);
            expect(codeBuilder.doDebug).equal(TEST_DO_DEBUG);
            expect(codeBuilder.osType).equal('UNIX');
            expect(codeBuilder.buildFlow).equal('zip-only');
            expect(codeBuilder.packageBuilder).equal(null);
        });
    });

    describe('# test class method: execute', () => {
        const TEST_BUILD_FLOW = 'buildFlow';
        const TEST_PACKAGE_BUILDER = 'packageBuilder';
        let codeBuilder;

        beforeEach(() => {
            sinon.stub(CodeBuilder.prototype, '_decidePackageBuilder');
            codeBuilder = new CodeBuilder(TEST_CONFIGURATION);
            codeBuilder.buildFlow = TEST_BUILD_FLOW;
            codeBuilder.packageBuilder = TEST_PACKAGE_BUILDER;
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| execute fails when working on the fs on win32, expect error called back', (done) => {
            // setup
            codeBuilder.osType = 'WINDOWS';
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'emptyDirSync');
            sinon.stub(fs, 'copySync').throws(new Error('error'));
            // call
            codeBuilder.execute((err) => {
                // verify
                expect(err.message).equal('error');
                expect(fs.ensureDirSync.args[0][0]).equal(TEST_BUILD_FOLDER);
                expect(fs.emptyDirSync.args[0][0]).equal(TEST_BUILD_FOLDER);
                done();
            });
        });

        it('| execute fails when working on the fs on non-win32, expect error called back', (done) => {
            // setup
            codeBuilder.osType = 'UNIX';
            sinon.stub(fs, 'ensureDirSync').throws(new Error('error'));
            sinon.stub(fs, 'emptyDirSync');
            sinon.stub(fs, 'copySync');
            // call
            codeBuilder.execute((err) => {
                // verify
                expect(err.message).equal('error');
                done();
            });
        });

        it('| shell execute fails on win32, expect error called back', (done) => {
            // setup
            const TEST_CODE = 10;
            codeBuilder.osType = 'WINDOWS';
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'emptyDirSync');
            sinon.stub(fs, 'copySync');
            sinon.stub(shell, 'exec').callsArgWith(2, TEST_CODE, null, 'error');
            // call
            codeBuilder.execute((err) => {
                // verify
                expect(shell.exec.args[0][0]).equal(`PowerShell.exe -Command "& {& '${TEST_PACKAGE_BUILDER}' '${TEST_BUILD_FILE}' $False }"`);
                expect(err).equal(`[Error]: Build Scripts failed with non-zero code: ${TEST_CODE}.`);
                done();
            });
        });

        it('| shell execute fails on non-win32, expect error called back', (done) => {
            // setup
            const TEST_CODE = 10;
            codeBuilder.osType = 'UNIX';
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'emptyDirSync');
            sinon.stub(fs, 'copySync');
            sinon.stub(shell, 'exec').callsArgWith(2, TEST_CODE, null, 'error');
            // call
            codeBuilder.execute((err) => {
                // verify
                expect(shell.exec.args[0][0]).equal(`${TEST_PACKAGE_BUILDER} "${TEST_BUILD_FILE}" false`);
                expect(err).equal(`[Error]: Build Scripts failed with non-zero code: ${TEST_CODE}.`);
                done();
            });
        });

        it('| shell execute succeeds on win32, expect no error', (done) => {
            // setup
            codeBuilder.osType = 'WINDOWS';
            codeBuilder.doDebug = true;
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'emptyDirSync');
            sinon.stub(fs, 'copySync');
            sinon.stub(shell, 'exec').callsArgWith(2, 0, null);
            // call
            codeBuilder.execute((err) => {
                // verify
                expect(shell.exec.args[0][0]).equal(`PowerShell.exe -Command "& {& '${TEST_PACKAGE_BUILDER}' '${TEST_BUILD_FILE}' $True }"`);
                expect(err).equal(undefined);
                done();
            });
        });

        it('| shell execute succeeds on non-win32, expect no error', (done) => {
            // setup
            codeBuilder.osType = 'UNIX';
            codeBuilder.doDebug = true;
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'emptyDirSync');
            sinon.stub(fs, 'copySync');
            sinon.stub(shell, 'exec').callsArgWith(2, 0, null);
            // call
            codeBuilder.execute((err) => {
                // verify
                expect(shell.exec.args[0][0]).equal(`${TEST_PACKAGE_BUILDER} "${TEST_BUILD_FILE}" true`);
                expect(err).equal(undefined);
                done();
            });
        });

        it('| build flow is infered as zip-only, zip error happens, expect error called back', (done) => {
            // setup
            codeBuilder.osType = 'UNIX';
            codeBuilder.buildFlow = CodeBuilder.ZIP_ONLY_BUILD_FLOW;
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'emptyDirSync');
            sinon.stub(fs, 'copySync');
            sinon.stub(zipUtils, 'createTempZip').callsArgWith(1, 'error');
            // call
            codeBuilder.execute((err) => {
                // verify
                expect(err).equal('error');
                done();
            });
        });

        it('| build flow is infered as zip-only, zip succeeds, expect no error called back', (done) => {
            // setup
            codeBuilder.osType = 'UNIX';
            codeBuilder.buildFlow = CodeBuilder.ZIP_ONLY_BUILD_FLOW;
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'emptyDirSync');
            sinon.stub(fs, 'copySync');
            sinon.stub(zipUtils, 'createTempZip').callsArgWith(1, null, TEST_ZIP_FILE_PATH);
            sinon.stub(fs, 'moveSync');
            // call
            codeBuilder.execute((err) => {
                // verify
                expect(err).equal(undefined);
                expect(fs.moveSync.args[0][0]).equal(TEST_ZIP_FILE_PATH);
                expect(fs.moveSync.args[0][1]).equal(TEST_BUILD_FILE);
                done();
            });
        });
    });
});
