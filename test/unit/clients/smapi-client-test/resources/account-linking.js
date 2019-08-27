'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill accountLinking APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_SKILL_STAGE = 'skillStage';
        const TEST_ACCOUNT_LINKING_INFO = 'accountLinkingInfo';

        [
            {
                testCase: 'get-account-linking',
                apiFunc: smapiClient.skill.accountLinking.getAccountLinking,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/accountLinkingClient`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'set-account-linking',
                apiFunc: smapiClient.skill.accountLinking.setAccountLinking,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_ACCOUNT_LINKING_INFO, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/accountLinkingClient`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {},
                    body: { accountLinkingRequest: TEST_ACCOUNT_LINKING_INFO },
                    json: true
                }
            },
            {
                testCase: 'delete-account-linking',
                apiFunc: smapiClient.skill.accountLinking.deleteAccountLinking,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/accountLinkingClient`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
                    headers: {},
                    body: null,
                    json: false
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
