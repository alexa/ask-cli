const { expect } = require('chai');
const sinon = require('sinon');

const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const MAX_RESULTS = CONSTANTS.DEFAULT_LIST_MAX_RESULT;
const NEXT_TOKEN = 'NEXT_TOKEN';
const noop = () => {};

module.exports = (smapiClient) => {
    describe('# Beta Test APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_FEEDBACK_EMAIL = 'feedback@amazon.com';
        const TESTERS = [{ emailId: 'test@amazon.com' }];

        [
            {
                testCase: 'create-beta-test',
                apiFunc: smapiClient.skill.betaTest.createBetaTest,
                parameters: [TEST_SKILL_ID, TEST_FEEDBACK_EMAIL, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: {
                        feedbackEmail: TEST_FEEDBACK_EMAIL
                    },
                    json: true
                }
            },
            {
                testCase: 'update-beta-test',
                apiFunc: smapiClient.skill.betaTest.updateBetaTest,
                parameters: [TEST_SKILL_ID, TEST_FEEDBACK_EMAIL, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {},
                    body: {
                        feedbackEmail: TEST_FEEDBACK_EMAIL
                    },
                    json: true
                }
            },
            {
                testCase: 'get-beta-test',
                apiFunc: smapiClient.skill.betaTest.getBetaTest,
                parameters: [TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: {},
                    json: true
                }
            },
            {
                testCase: 'start-beta-test',
                apiFunc: smapiClient.skill.betaTest.startBetaTest,
                parameters: [TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest/start`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: {},
                    json: true
                }
            },
            {
                testCase: 'end-beta-test',
                apiFunc: smapiClient.skill.betaTest.endBetaTest,
                parameters: [TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest/end`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: {},
                    json: true
                }
            },
            {
                testCase: 'list-beta-testers',
                apiFunc: smapiClient.skill.betaTest.listBetaTesters,
                parameters: [TEST_SKILL_ID, MAX_RESULTS, NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest/testers`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'add-beta-testers',
                apiFunc: smapiClient.skill.betaTest.addBetaTesters,
                parameters: [TEST_SKILL_ID, TESTERS, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest/testers/add`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: { testers: TESTERS },
                    json: true
                }
            },
            {
                testCase: 'remove-beta-testers',
                apiFunc: smapiClient.skill.betaTest.removeBetaTesters,
                parameters: [TEST_SKILL_ID, TESTERS, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest/testers/remove`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: { testers: TESTERS },
                    json: true
                }
            },
            {
                testCase: 'send-reminder-to-beta-testers',
                apiFunc: smapiClient.skill.betaTest.sendReminderToBetaTesters,
                parameters: [TEST_SKILL_ID, TESTERS, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest/testers/sendReminder`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: { testers: TESTERS },
                    json: true
                }
            },
            {
                testCase: 'request-feedback-from-beta-testers',
                apiFunc: smapiClient.skill.betaTest.requestFeedbackFromBetaTesters,
                parameters: [TEST_SKILL_ID, TESTERS, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/skills/${TEST_SKILL_ID}/betaTest/testers/requestFeedback`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: { testers: TESTERS },
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
