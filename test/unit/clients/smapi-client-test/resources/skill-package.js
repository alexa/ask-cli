const expect = require('chai').expect;
const sinon = require('sinon');

const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# smapi client skill package APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_VENDOR_ID = 'vendorId';
        const TEST_SKILL_STAGE = 'stage';
        const TEST_LOCATION = 'packageLocation';
        const TEST_IMPORT_ID = 'importId';
        const TEST_EXPORT_ID = 'exportId';

        [
            {
                testCase: 'create-upload',
                apiFunc: smapiClient.skillPackage.createUpload,
                parameters: [noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/uploads`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'import-package with skillId only',
                apiFunc: smapiClient.skillPackage.importPackage,
                parameters: [TEST_SKILL_ID, null, TEST_LOCATION, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/imports`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: { location: TEST_LOCATION },
                    json: true
                }
            },
            {
                testCase: 'import-package with vendorId only',
                apiFunc: smapiClient.skillPackage.importPackage,
                parameters: [null, TEST_VENDOR_ID, TEST_LOCATION, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/imports`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: { location: TEST_LOCATION, vendorId: TEST_VENDOR_ID },
                    json: true
                }
            },
            {
                testCase: 'get-import-status',
                apiFunc: smapiClient.skillPackage.getImportStatus,
                parameters: [TEST_IMPORT_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/imports/${TEST_IMPORT_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'export-package',
                apiFunc: smapiClient.skillPackage.exportPackage,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/exports`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-export-status',
                apiFunc: smapiClient.skillPackage.getExportStatus,
                parameters: [TEST_EXPORT_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/exports/${TEST_EXPORT_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
        ].forEach(({ testCase, apiFunc, parameters, expectedOptions }) => {
            it (`| call ${testCase} successfully`, () => {
                // setup
                oauthWrapper.tokenRefreshAndRead.callsFake(noop);
                // call
                apiFunc(...parameters);
                // verify
                expect(oauthWrapper.tokenRefreshAndRead.called).equal(true);
                expect(oauthWrapper.tokenRefreshAndRead.args[0][0]).deep.equal(expectedOptions);
            });
        });

        afterEach(() => {
            oauthWrapper.tokenRefreshAndRead.restore();
        });
    });
};
