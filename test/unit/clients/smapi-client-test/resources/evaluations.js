const { expect } = require('chai');
const sinon = require('sinon');

const CONSTANTS = require('@src/utils/constants');
const oauthWrapper = require('@src/utils/oauth-wrapper');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill evaluations APIs', () => {
        const TEST_SKILL_ID = 'skillId';
        const TEST_LOCALE = 'test';
        const TEST_STAGE = 'live';
        const TEST_UTTERANCE = 'utterance';
        const TEST_MULTI_TURN_TOKEN = 'multiTurnToken';

        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        [
            {
                testCase: 'nlu-profile',
                apiFunc: smapiClient.skill.evaluations.callProfileNlu,
                parameters: [TEST_SKILL_ID, TEST_STAGE, TEST_LOCALE, TEST_UTTERANCE, TEST_MULTI_TURN_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_STAGE}/interactionModel/locales/${TEST_LOCALE}/profileNlu`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: {
                        utterance: TEST_UTTERANCE,
                        multiTurnToken: TEST_MULTI_TURN_TOKEN
                    },
                    json: true
                }
            },
            {
                testCase: 'nlu-profile without multiTurnToken',
                apiFunc: smapiClient.skill.evaluations.callProfileNlu,
                parameters: [TEST_SKILL_ID, TEST_STAGE, TEST_LOCALE, TEST_UTTERANCE, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_STAGE}/interactionModel/locales/${TEST_LOCALE}/profileNlu`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: {
                        utterance: TEST_UTTERANCE
                    },
                    json: true
                }
            }
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
