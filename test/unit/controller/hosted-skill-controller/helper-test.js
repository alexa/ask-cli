const { expect } = require('chai');
const fs = require('fs-extra');
const md5 = require('md5-file');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const Messenger = require('@src/view/messenger');

describe('Controller test - hosted skill controller - helper test', () => {
    let proxyHelper;
    let requestStubObj;
    let warnStub;
    const SCRIPT_URL = 'scriptUrl.amazonaws.com';
    const FIlEPATH = 'filePath';
    const TEST_ERROR = 'error';
    const TEST_ETAG = 'etag';
    const RETRIEVE_METADATA_RESPONSE = {
        headers: {
            etag: TEST_ETAG
        }
    }
    describe('# test helper method: checkScript', () => {

        beforeEach(() => {
            requestStubObj = sinon.stub();
            proxyHelper = proxyquire('@src/controllers/hosted-skill-controller/helper', {
                'request': requestStubObj
            });
            warnStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                warn: warnStub,
            });
        })

        afterEach(() => {
            sinon.restore();
        });

        it('| file path does not exist, download script from S3 fails, expect error thrown ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(proxyHelper, 'downloadScriptFromS3').callsArgWith(2, TEST_ERROR);
            // call
            proxyHelper.checkScript(SCRIPT_URL, FIlEPATH, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            })
        });

        it('| file path does not exist, download script from S3 succeeds, expect none error response ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(false);
            sinon.stub(proxyHelper, 'downloadScriptFromS3').callsArgWith(2, null);
            // call
            proxyHelper.checkScript(SCRIPT_URL, FIlEPATH, (err) => {
                // verify
                expect(err).equal(null);
                done();
            })
        });

        it('| file path exists, script url is not valid, expect none error response ', (done) => {
            // setup
            const INVALID_URL = 'invalid_url';
            sinon.stub(fs, 'existsSync').returns(true);

            // call
            proxyHelper.checkScript(INVALID_URL, FIlEPATH, (err) => {
                // verify
                expect(err).equal(null);
                expect(warnStub.args[0][0]).eq(`'${INVALID_URL}' is not a valid S3 object URL.`)
                done();
            })
        });

        it('| retrieve metadata Of S3 script fails, expect error thrown ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
            requestStubObj.callsArgWith(1, TEST_ERROR);
            // call
            proxyHelper.checkScript(SCRIPT_URL, FIlEPATH, (err) => {
                // verify
                expect(err.message).equal(TEST_ERROR);
                done();
            })
        });

        it('| retrieve metadata Of S3 script succeeds, no etag in the response header, expect none error response ', (done) => {
            // setup
            const INVALID_RESPONSE = {
                headers: {}
            }
            sinon.stub(fs, 'existsSync').returns(true);
            requestStubObj.callsArgWith(1, null, INVALID_RESPONSE);
            // call
            proxyHelper.checkScript(SCRIPT_URL, FIlEPATH, (err) => {
                // verify
                expect(err).equal(null);
                expect(warnStub.args[0][0]).eq(`The script '${SCRIPT_URL}' is not public or not found.`)
                done();
            })
        });

        it('| retrieve metadata Of S3 script succeeds, the etag is the same with the local one, expect none error response ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
            requestStubObj.callsArgWith(1, null, RETRIEVE_METADATA_RESPONSE);
            sinon.stub(md5, 'sync').returns(TEST_ETAG);
            // call
            proxyHelper.checkScript(SCRIPT_URL, FIlEPATH, (err) => {
                // verify
                expect(err).equal(null);
                done();
            })
        });

        it('| the retrieved etag is different from the local one, download script fromS3 fails, expect error thrown ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
            requestStubObj.callsArgWith(1, null, RETRIEVE_METADATA_RESPONSE);
            sinon.stub(md5, 'sync').returns('old_tag');
            sinon.stub(proxyHelper, 'downloadScriptFromS3').callsArgWith(2, TEST_ERROR);
            // call
            proxyHelper.checkScript(SCRIPT_URL, FIlEPATH, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            })
        });

        it('| the retrieved etag is different from the local one, download script fromS3 succeed, expect none error response ', (done) => {
            // setup
            sinon.stub(fs, 'existsSync').returns(true);
            requestStubObj.callsArgWith(1, null, RETRIEVE_METADATA_RESPONSE);
            sinon.stub(md5, 'sync').returns('old_tag');
            sinon.stub(proxyHelper, 'downloadScriptFromS3').callsArgWith(2, null);
            // call
            proxyHelper.checkScript(SCRIPT_URL, FIlEPATH, (err) => {
                // verify
                expect(err).equal(null);
                done();
            })
        });

    });
});
