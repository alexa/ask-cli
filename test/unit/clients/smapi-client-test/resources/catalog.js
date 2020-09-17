const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# catalog CRUD related APIs', () => {
        let httpClientStub;
        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_CATALOG_ID = 'catalogId';
        const TEST_VENDOR_ID = 'vendorId';
        const TEST_UPLOAD_ID = 'uploadId';
        const TEST_NEXT_TOKEN = 'nextToken';
        const TEST_MAX_RESULTS = 'maxResults';
        const TEST_CATALOG_TYPE = 'type';
        const TEST_CATALOG_USAGE = 'usage';
        const TEST_CATALOG_TITLE = 'title';
        const TEST_NUMBER_OF_PARTS = 'numberOfUploadParts';
        const TEST_PART_ETAG_LIST = ['list1', 'list2'];
        const TEST_PROFILE = 'testProfile';
        const TEST_ACCESS_TOKEN = 'access_token';

        [
            {
                testCase: 'create-catalog',
                apiFunc: smapiClient.catalog.createCatalog,
                parameters: [TEST_CATALOG_TITLE, TEST_CATALOG_TYPE, TEST_CATALOG_USAGE, TEST_VENDOR_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        title: TEST_CATALOG_TITLE,
                        type: TEST_CATALOG_TYPE,
                        usage: TEST_CATALOG_USAGE,
                        vendorId: TEST_VENDOR_ID
                    },
                    json: true
                }
            },
            {
                testCase: 'get-catalog',
                apiFunc: smapiClient.catalog.getCatalog,
                parameters: [TEST_CATALOG_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalogs',
                apiFunc: smapiClient.catalog.listCatalogs,
                parameters: [TEST_VENDOR_ID, { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs?nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}&vendorId=${TEST_VENDOR_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalogs without next token',
                apiFunc: smapiClient.catalog.listCatalogs,
                parameters: [TEST_VENDOR_ID, { maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs?maxResults=${TEST_MAX_RESULTS}&vendorId=${TEST_VENDOR_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }

            },
            {
                testCase: 'list-catalogs without max results',
                apiFunc: smapiClient.catalog.listCatalogs,
                parameters: [TEST_VENDOR_ID, { nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs?nextToken=${TEST_NEXT_TOKEN}&vendorId=${TEST_VENDOR_ID}&maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalogs without max results nor next token',
                apiFunc: smapiClient.catalog.listCatalogs,
                parameters: [TEST_VENDOR_ID, {}, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs?vendorId=${TEST_VENDOR_ID}&maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalogs with null query',
                apiFunc: smapiClient.catalog.listCatalogs,
                parameters: [TEST_VENDOR_ID, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs?vendorId=${TEST_VENDOR_ID}&maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'create-catalog-upload',
                apiFunc: smapiClient.catalog.createCatalogUpload,
                parameters: [TEST_CATALOG_ID, TEST_NUMBER_OF_PARTS, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}/uploads`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        numberOfUploadParts: TEST_NUMBER_OF_PARTS
                    },
                    json: true
                }
            },
            {
                testCase: 'get-catalog-upload',
                apiFunc: smapiClient.catalog.getCatalogUpload,
                parameters: [TEST_CATALOG_ID, TEST_UPLOAD_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}/uploads/${TEST_UPLOAD_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalog-uploads',
                apiFunc: smapiClient.catalog.listCatalogUploads,
                parameters: [TEST_CATALOG_ID, { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}/uploads?nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalog-uploads without next token',
                apiFunc: smapiClient.catalog.listCatalogUploads,
                parameters: [TEST_CATALOG_ID, { maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}/uploads?maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalog-uploads without max results',
                apiFunc: smapiClient.catalog.listCatalogUploads,
                parameters: [TEST_CATALOG_ID, { nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}/uploads?nextToken=${TEST_NEXT_TOKEN}&maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalog-uploads without max results nor next token',
                apiFunc: smapiClient.catalog.listCatalogUploads,
                parameters: [TEST_CATALOG_ID, {}, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}/uploads?maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-catalog-uploads with null query',
                apiFunc: smapiClient.catalog.listCatalogUploads,
                parameters: [TEST_CATALOG_ID, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}/uploads?maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'associate-catalog-with-skill',
                apiFunc: smapiClient.catalog.associateCatalogWithSkill,
                parameters: [TEST_SKILL_ID, TEST_CATALOG_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/skills/${TEST_SKILL_ID}/catalogs/${TEST_CATALOG_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'complete-catalog-upload',
                apiFunc: smapiClient.catalog.completeCatalogUpload,
                parameters: [TEST_CATALOG_ID, TEST_UPLOAD_ID, TEST_PART_ETAG_LIST, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v0/catalogs/${TEST_CATALOG_ID}/uploads/${TEST_UPLOAD_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        partETags: TEST_PART_ETAG_LIST
                    },
                    json: true
                }
            },
        ].forEach(({ testCase, apiFunc, parameters, expectedOptions }) => {
            it(`| call ${testCase} successfully`, (done) => {
                // setup
                AuthorizationController.prototype.tokenRefreshAndRead.callsArgWith(1, null, TEST_ACCESS_TOKEN);
                // call
                apiFunc(...parameters);
                // verify
                expect(AuthorizationController.prototype.tokenRefreshAndRead.called).equal(true);
                expect(AuthorizationController.prototype.tokenRefreshAndRead.args[0][0]).equal(TEST_PROFILE);
                expect(httpClientStub.args[0][0]).deep.equal(expectedOptions);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });
};
