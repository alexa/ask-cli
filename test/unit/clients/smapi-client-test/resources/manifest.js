const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill manifest APIs', () => {
        let httpClientStub;
        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        const TEST_MANIFEST = { manifest: 'manifest' };
        const TEST_SKILL_ID = 'skillId';
        const TEST_SKILL_STAGE = 'skillStage';
        const TEST_ETAG = 'eTag';
        const TEST_PROFILE = 'testProfile';
        const TEST_ACCESS_TOKEN = 'access_token';

        [
            {
                testCase: 'get-manifest',
                apiFunc: smapiClient.skill.manifest.getManifest,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/manifest`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
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
                    headers: {
                        'If-Match': TEST_ETAG,
                        authorization: TEST_ACCESS_TOKEN
                    },
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
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: { manifest: 'manifest' },
                    json: true
                }
            }
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
