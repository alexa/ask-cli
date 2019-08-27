const fs = require('fs');
const tmp = require('tmp');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { expect } = require('chai');

const zipUtils = require('@src/utils/zip-utils');
const Messenger = require('@src/view/messenger');

describe('Utils test - zip utility', () => {
    const TEST_SRC = 'TEST_SRC';
    const TEST_ERROR = 'TEST_ERROR';
    const TEST_ZIP_FILE_PATH = 'TEST_ZIP_FILE_PATH';

    describe('# test function createTempZip', () => {
        beforeEach(() => {
            sinon.stub(tmp, 'tmpNameSync').withArgs({
                prefix: 'askcli_temp_',
                postfix: '.zip',
                dir: TEST_SRC
            }).callsFake(() => TEST_ZIP_FILE_PATH);

            new Messenger({});
        });

        afterEach(() => {
            sinon.restore();
            Messenger.getInstance().dispose();
        });

        it('| call back error when src file is not set', (done) => {
            // call
            zipUtils.createTempZip(null, (error) => {
                // verify
                expect(error).equal('Zip file path must be set.');
                done();
            });
        });

        it('| call back error when access file fail', (done) => {
            // setup
            sinon.stub(fs, 'access').callsArgWith(2, TEST_ERROR);

            // call
            zipUtils.createTempZip(TEST_SRC, (error) => {
                // verify
                expect(error).equal(`File access error. ${TEST_ERROR}`);
                done();
            });
        });

        it('| when input file is a zip, callback original filePath and warn skip message', (done) => {
            const src = 'test.zip';

            // setup
            sinon.stub(fs, 'access').callsArgWith(2);
            sinon.stub(Messenger.getInstance(), 'debug');

            // call
            zipUtils.createTempZip(src, (error, response) => {
                // verify
                expect(Messenger.getInstance().debug.args[0][0]).equal(`The source file ${src} has already been compressed. Skip the zipping`);
                expect(error).equal(null);
                expect(response).equal(src);
                done();
            });
        });

        it('| when input file is a jar, callback original filePath and warn skip message', (done) => {
            const src = 'test.jar';

            // setup
            sinon.stub(fs, 'access').callsArgWith(2);
            sinon.stub(Messenger.getInstance(), 'debug');

            // call
            zipUtils.createTempZip(src, (error, response) => {
                // verify
                expect(Messenger.getInstance().debug.args[0][0]).equal(`The source file ${src} has already been compressed. Skip the zipping`);
                expect(error).equal(null);
                expect(response).equal(src);
                done();
            });
        });

        describe('# test archive inside the createTempZip function', () => {
            let proxyZipUtils;
            let archiveOnStub, archiveFileStub, archiveGlobStub;
            let writeStreamOnStub;

            beforeEach(() => {
                archiveOnStub = sinon.stub();
                archiveFileStub = sinon.stub();
                archiveGlobStub = sinon.stub();
                const archiveStubObj = {
                    on: archiveOnStub,
                    pipe: () => {},
                    file: archiveFileStub,
                    glob: archiveGlobStub,
                    finalize: () => {}
                };
                proxyZipUtils = proxyquire('@src/utils/zip-utils', {
                    archiver: () => archiveStubObj
                });
                sinon.stub(fs, 'access').callsArgWith(2);
                sinon.stub(Messenger.getInstance(), 'debug');
                writeStreamOnStub = sinon.stub();
                sinon.stub(fs, 'createWriteStream').returns({
                    on: writeStreamOnStub
                });
            });

            it('| when input src is folder and archive error occurs, expect callback archive error', (done) => {
                // setup
                sinon.stub(fs, 'statSync').returns({
                    isFile: () => false,
                    isDirectory: () => false
                });
                archiveOnStub.callsArgWith(1, 'error');
                // call
                proxyZipUtils.createTempZip(TEST_SRC, (error, response) => {
                    // verify
                    expect(fs.createWriteStream.args[0][0]).equal(TEST_ZIP_FILE_PATH);
                    expect(error).equal('Archive error. error');
                    expect(response).equal(undefined);
                    done();
                });
            });

            it('| when input src is folder and src is file, expect zip file and callback when wrtieStream close', (done) => {
                // setup
                sinon.stub(fs, 'statSync').returns({
                    isFile: () => true,
                    isDirectory: () => false
                });
                writeStreamOnStub.callsArgWith(1);
                // call
                proxyZipUtils.createTempZip(TEST_SRC, (error, response) => {
                    // verify
                    expect(fs.createWriteStream.args[0][0]).equal(TEST_ZIP_FILE_PATH);
                    expect(archiveFileStub.args[0][0]).equal(TEST_SRC);
                    expect(archiveFileStub.args[0][1]).deep.equal({ name: TEST_SRC });
                    expect(error).equal(null);
                    expect(response).equal(TEST_ZIP_FILE_PATH);
                    done();
                });
            });

            it('| when input src is folder and src is directory, expect zip file and callback when wrtieStream close', (done) => {
                // setup
                sinon.stub(fs, 'statSync').returns({
                    isFile: () => false,
                    isDirectory: () => true
                });
                writeStreamOnStub.callsArgWith(1);
                // call
                proxyZipUtils.createTempZip(TEST_SRC, (error, response) => {
                    // verify
                    expect(fs.createWriteStream.args[0][0]).equal(TEST_ZIP_FILE_PATH);
                    expect(archiveGlobStub.args[0][0]).equal('**/*');
                    expect(archiveGlobStub.args[0][1]).deep.equal({
                        cwd: TEST_SRC,
                        ignore: TEST_ZIP_FILE_PATH
                    });
                    expect(error).equal(null);
                    expect(response).equal(TEST_ZIP_FILE_PATH);
                    done();
                });
            });
        });


        afterEach(() => {
            sinon.restore();
            Messenger.getInstance().dispose();
        });
    });
});
