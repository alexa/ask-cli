const { expect } = require('chai');
const sinon = require('sinon');

const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# smapi client isp APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_ISP_STAGE = 'ispStage';
        const TEST_ISP_DEFINITION = 'ispDefinition';
        const TEST_ISP_ID = 'ispId';
        const TEST_ISP_ETAG = 'ispETag';
        const TEST_VENDOR_ID = 'vendorId';
        const TEST_PRODUCT_ID_LIST = ['id1', 'id2'];
        const TEST_ISP_REFERENCE_NAME = 'ispReferenceName';
        const TEST_ISP_TYPE = 'ispType';
        const TEST_ISP_STATUS = 'ispStatus';
        const TEST_NEXT_TOKEN = 'nextToken';
        const TEST_MAX_RESULTS = 'maxResults';

        [
            {
                testCase: 'create-isp',
                apiFunc: smapiClient.isp.createIsp,
                parameters: [TEST_VENDOR_ID, TEST_ISP_DEFINITION, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: {
                        vendorId: TEST_VENDOR_ID,
                        inSkillProductDefinition: TEST_ISP_DEFINITION
                    },
                    json: true
                }
            },
            {
                testCase: 'get-isp',
                apiFunc: smapiClient.isp.getIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-isp with summary mode',
                apiFunc: smapiClient.isp.getIspSummary,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}/summary`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'update-isp',
                apiFunc: smapiClient.isp.updateIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, TEST_ISP_DEFINITION, TEST_ISP_ETAG, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: { 'If-Match': TEST_ISP_ETAG },
                    body: { inSkillProductDefinition: TEST_ISP_DEFINITION },
                    json: true
                }
            },
            {
                testCase: 'update-isp without eTag',
                apiFunc: smapiClient.isp.updateIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, TEST_ISP_DEFINITION, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {},
                    body: { inSkillProductDefinition: TEST_ISP_DEFINITION },
                    json: true
                }
            },
            {
                testCase: 'associate-isp',
                apiFunc: smapiClient.isp.associateIsp,
                parameters: [TEST_ISP_ID, TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/skills/${TEST_SKILL_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-skill',
                apiFunc: smapiClient.isp.listIspForSkill,
                parameters: [TEST_SKILL_ID, TEST_ISP_STAGE, { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_ISP_STAGE}/inSkillProducts?`
                        + `nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-vendor',
                apiFunc: smapiClient.isp.listIspForVendor,
                parameters: [TEST_VENDOR_ID, TEST_PRODUCT_ID_LIST, TEST_ISP_STAGE, TEST_ISP_REFERENCE_NAME, TEST_ISP_STATUS, TEST_ISP_TYPE, 'true',
                    { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts?nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}`
                        + `&productId=id1&productId=id2&vendorId=${TEST_VENDOR_ID}&referenceName=${TEST_ISP_REFERENCE_NAME}`
                        + `&type=${TEST_ISP_TYPE}&stage=${TEST_ISP_STAGE}&status=${TEST_ISP_STATUS}&isAssociatedWithSkill=true`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-vendor with empty isp list',
                apiFunc: smapiClient.isp.listIspForVendor,
                parameters: [TEST_VENDOR_ID, [], TEST_ISP_STAGE, TEST_ISP_REFERENCE_NAME, TEST_ISP_STATUS, TEST_ISP_TYPE, 'true',
                    { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts?nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}`
                        + `&vendorId=${TEST_VENDOR_ID}&referenceName=${TEST_ISP_REFERENCE_NAME}&type=${TEST_ISP_TYPE}`
                        + `&stage=${TEST_ISP_STAGE}&status=${TEST_ISP_STATUS}&isAssociatedWithSkill=true`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-vendor with null querry',
                apiFunc: smapiClient.isp.listIspForVendor,
                parameters: [TEST_VENDOR_ID, TEST_PRODUCT_ID_LIST, TEST_ISP_STAGE, TEST_ISP_REFERENCE_NAME, TEST_ISP_STATUS, TEST_ISP_TYPE, 'true',
                    null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts?productId=id1&productId=id2&vendorId=${TEST_VENDOR_ID}`
                        + `&referenceName=${TEST_ISP_REFERENCE_NAME}&type=${TEST_ISP_TYPE}&stage=${TEST_ISP_STAGE}`
                        + `&status=${TEST_ISP_STATUS}&isAssociatedWithSkill=true`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-vendor with all option value equal to null',
                apiFunc: smapiClient.isp.listIspForVendor,
                parameters: [TEST_VENDOR_ID, null, null, null, null, null, null, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts?vendorId=${TEST_VENDOR_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-skills-for-isp',
                apiFunc: smapiClient.isp.listSkillsForIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}/skills?`
                        + `nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-skills-for-isp without next token',
                apiFunc: smapiClient.isp.listSkillsForIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, { maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}/skills?`
                        + `maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-skills-for-isp without max results',
                apiFunc: smapiClient.isp.listSkillsForIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, { nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}/skills?nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-skills-for-isp without max results nor next token',
                apiFunc: smapiClient.isp.listSkillsForIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, {}, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}/skills`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'disassociate-isp',
                apiFunc: smapiClient.isp.disassociateIsp,
                parameters: [TEST_ISP_ID, TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/skills/${TEST_SKILL_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'delete-isp',
                apiFunc: smapiClient.isp.deleteIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, TEST_ISP_ETAG, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
                    headers: { 'If-Match': TEST_ISP_ETAG },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'delete-isp without eTag',
                apiFunc: smapiClient.isp.deleteIsp,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'reset-isp-entitlement',
                apiFunc: smapiClient.isp.resetIspEntitlement,
                parameters: [TEST_ISP_ID, TEST_ISP_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/inSkillProducts/${TEST_ISP_ID}/stages/${TEST_ISP_STAGE}/entitlement`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
                    headers: {},
                    body: null,
                    json: false
                }
            },
        ].forEach(({ testCase, apiFunc, parameters, expectedOptions }) => {
            it(`| call ${testCase} successfully`, (done) => {
                // setup
                oauthWrapper.tokenRefreshAndRead.callsFake(noop);
                // call
                apiFunc(...parameters);
                // verify
                expect(oauthWrapper.tokenRefreshAndRead.called).equal(true);
                expect(oauthWrapper.tokenRefreshAndRead.args[0][0]).deep.equal(expectedOptions);
                done();
            });
        });

        afterEach(() => {
            oauthWrapper.tokenRefreshAndRead.restore();
        });
    });
};
