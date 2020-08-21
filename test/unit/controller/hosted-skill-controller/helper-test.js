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
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(fs, 'mkdirSync');
            sinon.stub(helper, 'downloadScriptFromS3').callsArgWith(2, TEST_ERROR);
            // call
            helper.downloadAskPrePushScript((err) => {
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| helper download Script succeeds, expect none error response', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
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
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(fs, 'mkdirSync');
            sinon.stub(helper, 'downloadScriptFromS3').callsArgWith(2, TEST_ERROR);
            // call
            helper.downloadGitCredentialHelperScript((err) => {
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| helper download Script succeeds, expect none error response', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
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
        const TEST_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'downloadScriptFromS3.json');
        const TEST_RESPONSE = `{"data": test}`;
        let TEST_STREAM;

        beforeEach(() => {
            TEST_STREAM = new PassThrough();
            TEST_STREAM.push(TEST_RESPONSE);
            TEST_STREAM.end();
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| download Script succeeds, expect none error response', (done) => {
            // setup
            sinon.stub(https, 'get').callsFake((TEST_SCRIPT_URL, callback) => {
                callback(TEST_STREAM);
                return {end: sinon.stub()};
            })
            sinon.spy(TEST_STREAM, 'pipe');
            sinon.stub(fs, 'chmodSync');
            // call
            helper.downloadScriptFromS3(TEST_SCRIPT_URL, TEST_FILE_PATH, (err) => {
                expect(err).equal(null);
                fs.removeSync(TEST_FILE_PATH);
                done();
            });
        });
    });
});
