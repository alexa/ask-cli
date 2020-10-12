const { expect } = require('chai');
const fs = require('fs-extra');
const https = require('https');
const path = require('path');
const sinon = require('sinon');
const { PassThrough } = require('stream');

const helper = require('@src/controllers/hosted-skill-controller/helper');

describe('Controller test - hosted skill controller - helper test', () => {
    const TEST_ERROR = 'error';


    describe('# test helper method: downloadAuthInfoScript', () => {

        afterEach(() => {
            sinon.restore();
        });

        it('| helper download Script fails, expect error thrown ', (done) => {
            // setup
            sinon.stub(helper, 'downloadScriptFromS3').callsArgWith(2, TEST_ERROR);
            // call
            helper.downloadAuthInfoScript((err) => {
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| helper download Script succeeds, expect none error response', (done) => {
            // setup
            sinon.stub(helper, 'downloadScriptFromS3').callsArgWith(2, null);
            // call
            helper.downloadAuthInfoScript((err) => {
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test helper method: downloadAskPrePushScript', () => {

        afterEach(() => {
            sinon.restore();
        });

        it('| helper download Script fails, expect error thrown ', (done) => {
            // setup
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(helper, 'downloadScriptFromS3').callsArgWith(2, TEST_ERROR);
            // call
            helper.downloadAskPrePushScript((err) => {
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| helper download Script succeeds, expect none error response', (done) => {
            // setup
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(helper, 'downloadScriptFromS3').callsArgWith(2, null);
            // call
            helper.downloadAskPrePushScript((err) => {
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test helper method: downloadGitCredentialHelperScript', () => {

        afterEach(() => {
            sinon.restore();
        });

        it('| helper download Script fails, expect error thrown ', (done) => {
            // setup
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(helper, 'downloadScriptFromS3').callsArgWith(2, TEST_ERROR);
            // call
            helper.downloadGitCredentialHelperScript((err) => {
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| helper download Script succeeds, expect none error response', (done) => {
            // setup
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(helper, 'downloadScriptFromS3').callsArgWith(2, null);
            // call
            helper.downloadGitCredentialHelperScript((err) => {
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# test helper method: downloadScriptFromS3', () => {
        const TEST_SCRIPT_URL = 'script_url';
        const TEST_FILE_PATH = 'filepath'
        let httpsSub;
        let writeStreamOnStub;
        let responseStub;

        beforeEach(() => {
            responseStub = {
                pipe: () => {}
            }
            writeStreamOnStub = sinon.stub();
            sinon.stub(fs, 'createWriteStream').returns({
                on: writeStreamOnStub
            });
            httpsSub = sinon.stub(https, 'get');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| download Script succeeds, expect none error response', (done) => {
            // setup
            httpsSub.callsFake((TEST_SCRIPT_URL, callback) => {
                return callback(responseStub);
            })
            // sinon.spy(TEST_STREAM, 'pipe');
            writeStreamOnStub.callsArgWith(1);
            sinon.stub(fs, 'chmodSync');
            // call
            helper.downloadScriptFromS3(TEST_SCRIPT_URL, TEST_FILE_PATH, (err) => {
                // verify
                expect(fs.createWriteStream.args[0][0]).equal(TEST_FILE_PATH);
                expect(httpsSub.args[0][0]).equal(TEST_SCRIPT_URL)
                expect(err).equal(null);
                done();
            });
        });
    });
});
