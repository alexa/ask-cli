const { expect } = require('chai');
const sinon = require('sinon');

const CONSTANTS = require('@src/utils/constants');
const oauthWrapper = require('@src/utils/oauth-wrapper');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# alexa hosted skills API', () => {
        const TEST_SKILL_ID = 'skillId';
        const TEST_REPO_URL = 'RepoUrl';
        const TEST_VENDOR_ID = 'vendorId';
        const TEST_PERMISSION_TYPE = 'permissionType';
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        [
            {
                testCase: 'get-hosted-skill-metadata',
                apiFunc: smapiClient.skill.alexaHosted.getAlexaHostedSkillMetadata,
                parameters: [TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/alexaHosted`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
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
                    headers: {},
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
