const { expect } = require('chai');
const sinon = require('sinon');

const CONSTANTS = require('@src/utils/constants');
const oauthWrapper = require('@src/utils/oauth-wrapper');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill intent request history API', () => {
        const TEST_SKILL_ID = 'skillId';
        const TEST_NEXT_TOKEN = 'nextToken';
        const TEST_MAX_RESULTS = 'maxResults';
        const TEST_SORT_DIRECTION = 'sortDirection';
        const TEST_SORT_FIELD = 'sortField';

        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        [
            {
                testCase: 'intent-requests-history with null params ',
                apiFunc: smapiClient.skill.history.getIntentRequestsHistory,
                parameters: [TEST_SKILL_ID, {}, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/history/intentRequests`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'intent-requests-history',
                apiFunc: smapiClient.skill.history.getIntentRequestsHistory,
                parameters: [TEST_SKILL_ID, { maxResults: TEST_MAX_RESULTS, sortDirection: TEST_SORT_DIRECTION, sortField: TEST_SORT_FIELD, nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/history/intentRequests?maxResults=${TEST_MAX_RESULTS}&sortDirection=${TEST_SORT_DIRECTION}&sortField=${TEST_SORT_FIELD}&nextToken=${TEST_NEXT_TOKEN}`,
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
