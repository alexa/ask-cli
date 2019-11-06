const folderHash = require('folder-hash');
const sinon = require('sinon');
const { expect } = require('chai');

const hashUtils = require('@src/utils/hash-utils');

describe('Utils test - hash utility', () => {
    describe('# getHash function tests', () => {
        const TEST_DIR_PATH = 'DIR_PATH';
        const expectedOptions = {
            algo: 'sha1',
            encoding: 'base64',
            folders: {
                exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'],
                ignoreRootName: true
            },
        };

        it('| can correctly callback hash code', (done) => {
            const TEST_HASH_CODE = 'HASH_CODE';
            const TEST_RESULT = {
                hash: TEST_HASH_CODE
            };
            // setup
            sinon.stub(folderHash, 'hashElement').withArgs(TEST_DIR_PATH, expectedOptions).callsArgWith(2, null, TEST_RESULT);

            // call
            hashUtils.getHash(TEST_DIR_PATH, (error, response) => {
                // verify
                expect(error).equal(null);
                expect(response).equal(TEST_HASH_CODE);
                done();
            });
        });

        it('| can correctly callback error', (done) => {
            const TEST_ERROR = 'ERROR';
            // setup
            sinon.stub(folderHash, 'hashElement').withArgs(TEST_DIR_PATH, expectedOptions).callsArgWith(2, TEST_ERROR);

            // call
            hashUtils.getHash(TEST_DIR_PATH, (error) => {
                // verify
                expect(error).equal(TEST_ERROR);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });
});
