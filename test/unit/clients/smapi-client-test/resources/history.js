const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const CONSTANTS = require('@src/utils/constants');
const AuthorizationController = require('@src/controllers/authorization-controller');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill intent request history API', () => {
        let httpClientStub;
        const TEST_SKILL_ID = 'skillId';
        const TEST_NEXT_TOKEN = 'nextToken';
        const TEST_MAX_RESULTS = 'maxResults';
        const TEST_SORT_DIRECTION = 'sortDirection';
        const TEST_SORT_FIELD = 'sortField';
        const TEST_PROFILE = 'testProfile';
        const TEST_ACCESS_TOKEN = 'access_token';

        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        [
            {
                testCase: 'intent-requests-history with null params',
                apiFunc: smapiClient.skill.history.getIntentRequestsHistory,
                parameters: [TEST_SKILL_ID, {}, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/history/intentRequests`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
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
