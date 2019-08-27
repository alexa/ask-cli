'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill manifest APIs', () => {

        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        const TEST_MANIFEST = { manifest: 'manifest' };
        const TEST_SKILL_ID = 'skillId';
        const TEST_SKILL_STAGE = 'skillStage';
        const TEST_ETAG = 'eTag';

        [
            {
                testCase: 'get-manifest',
                apiFunc: smapiClient.skill.manifest.getManifest,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/manifest`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'update-manifest',
                apiFunc: smapiClient.skill.manifest.updateManifest,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_MANIFEST, TEST_ETAG, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/manifest`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: { "If-Match": TEST_ETAG },
                    body: { manifest: 'manifest' },
                    json: true
                }
            },
            {
                testCase: 'update-manifest without eTag',
                apiFunc: smapiClient.skill.manifest.updateManifest,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_MANIFEST, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/manifest`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {},
                    body: { manifest: 'manifest' },
                    json: true
                }
            }
        ].forEach(({ testCase, apiFunc, parameters, expectedOptions }) => {
            it (`| call ${testCase} successfully`, (done) => {
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
