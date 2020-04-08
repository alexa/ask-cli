const { expect } = require('chai');
const sinon = require('sinon');

const AuthorizationController = require('@src/controllers/authorization-controller');
const helper = require('@src/commands/smapi/appended-commands/export-package/helper');
const httpClient = require('@src/clients/http-client');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client/index.js');

describe('Commands export-package - helper test', () => {
    const TEST_EXPORT_ID = 'EXPORT_ID';
    const TEST_STATUS_CODE = 200;
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const ERROR = new Error(TEST_ERROR_MESSAGE);

    describe('# pollExportStatus check', () => {
        const smapiClient = new SmapiClient({
            profile: 'TEST_PROFILE',
            doDebug: 'TEST_DEBUG'
        });
        const GET_STATUS_ERROR = {
            statusCode: 403,
            body: {
                error: TEST_ERROR_MESSAGE
            }
        };
        const GET_STATUS_RESPONSE = {
            statusCode: 200,
            headers: {},
            body: {}
        };
        beforeEach(() => {
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
        });
        afterEach(() => {
            sinon.restore();
        });

        it('| pollExportStatus fails, expect throw error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, ERROR); // stub smapi request
            // call
            helper.pollExportStatus(smapiClient, TEST_EXPORT_ID, (err, response) => {
                // verify
                expect(err.message).equal(TEST_ERROR_MESSAGE);
                expect(response).equal(null);
                done();
            });
        });

        it('| pollExportStatus with status code >= 300, expect throw error', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_STATUS_ERROR); // stub smapi request
            // call
            helper.pollExportStatus(smapiClient, TEST_EXPORT_ID, (err, response) => {
                // verify
                expect(err).equal(jsonView.toString({ error: TEST_ERROR_MESSAGE }));
                expect(response).equal(null);
                done();
            });
        });

        it('| pollExportStatus passes', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_STATUS_RESPONSE); // stub smapi request
            // call
            helper.pollExportStatus(smapiClient, TEST_EXPORT_ID, (err, response) => {
                // verify
                expect(err).equal(null);
                expect(response.statusCode).equal(TEST_STATUS_CODE);
                done();
            });
        });
    });
});
