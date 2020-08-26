const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# alexa hosted skills API', () => {
        const TEST_SKILL_ID = 'skillId';
        const TEST_REPO_URL = 'RepoUrl';
        const TEST_VENDOR_ID = 'vendorId';
        const TEST_PERMISSION_TYPE = 'permissionType';
        const TEST_PROFILE = 'testProfile';
        const TEST_ACCESS_TOKEN = 'access_token';
        const TEST_RUNTIME_FIELD = 'NodeJS';
        const TEST_RUNTIME_VALUE = 'NODE_10_X';
        const TEST_REGION_VALUE = 'US_EAST_1';
        const TEST_MANIFEST = {
            runtime: TEST_RUNTIME_FIELD,
            vendorId: TEST_VENDOR_ID,
            region: TEST_REGION_VALUE,
            manifest: {}
        };
        let httpClientStub;

        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        [
            {
                testCase: 'create-hosted-skill',
                apiFunc: smapiClient.skill.alexaHosted.createHostedSkill,
                parameters: [TEST_MANIFEST, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        vendorId: TEST_VENDOR_ID,
                        manifest: {},
                        hosting: {
                            alexaHosted: {
                                region: TEST_REGION_VALUE,
                                runtime: TEST_RUNTIME_VALUE
                            }
                        }
                    },
                    json: true
                }
            },
            {
                testCase: 'get-hosted-skill-metadata',
                apiFunc: smapiClient.skill.alexaHosted.getAlexaHostedSkillMetadata,
                parameters: [TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/alexaHosted`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-git-credentials',
                apiFunc: smapiClient.skill.alexaHosted.getGitCredentials,
                parameters: [TEST_SKILL_ID, TEST_REPO_URL, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/alexaHosted/repository/credentials/generate`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        repository: {
                            type: 'GIT',
                            url: TEST_REPO_URL
                        }
                    },
                    json: true
                }
            },
            {
                testCase: 'get-hosted-skill-permission',
                apiFunc: smapiClient.skill.alexaHosted.getHostedSkillPermission,
                parameters: [TEST_VENDOR_ID, TEST_PERMISSION_TYPE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/vendors/${TEST_VENDOR_ID}/alexaHosted/permissions/${TEST_PERMISSION_TYPE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
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
