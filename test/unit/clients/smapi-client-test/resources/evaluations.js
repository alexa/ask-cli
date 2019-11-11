const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const CONSTANTS = require('@src/utils/constants');
const AuthorizationController = require('@src/controllers/authorization-controller');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill evaluations APIs', () => {
        let httpClientStub;
        const TEST_SKILL_ID = 'skillId';
        const TEST_LOCALE = 'test';
        const TEST_STAGE = 'live';
        const TEST_UTTERANCE = 'utterance';
        const TEST_MULTI_TURN_TOKEN = 'multiTurnToken';
        const TEST_PROFILE = 'testProfile';
        const TEST_ACCESS_TOKEN = 'access_token';

        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        [
            {
                testCase: 'nlu-profile',
                apiFunc: smapiClient.skill.evaluations.callProfileNlu,
                parameters: [TEST_SKILL_ID, TEST_STAGE, TEST_LOCALE, TEST_UTTERANCE, TEST_MULTI_TURN_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_STAGE}/interactionModel/locales/${TEST_LOCALE}/profileNlu`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
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
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        utterance: TEST_UTTERANCE
                    },
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
