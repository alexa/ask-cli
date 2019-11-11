const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill privateSkill APIs', () => {
        let httpClientStub;
        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_SKILL_STAGE = 'skillStage';
        const TEST_ACCOUNT_ID = 'accountId';
        const TEST_NEXT_TOKEN = 'nextToken';
        const TEST_MAX_RESULTS = 'maxResults';
        const TEST_PROFILE = 'testProfile';
        const TEST_ACCESS_TOKEN = 'access_token';

        [
            {
                testCase: 'add-private-distribution-account',
                apiFunc: smapiClient.skill.privateSkill.addPrivateDistributionAccount,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_ACCOUNT_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/privateDistributionAccounts/${TEST_ACCOUNT_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-private-distribution-accounts',
                apiFunc: smapiClient.skill.privateSkill.listPrivateDistributionAccounts,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/privateDistributionAccounts?nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-private-distribution-accounts without nextToken',
                apiFunc: smapiClient.skill.privateSkill.listPrivateDistributionAccounts,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, { maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/privateDistributionAccounts?maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-private-distribution-accounts without maxResults',
                apiFunc: smapiClient.skill.privateSkill.listPrivateDistributionAccounts,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, { nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/privateDistributionAccounts?nextToken=${TEST_NEXT_TOKEN}&maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'delete-private-distribution-account',
                apiFunc: smapiClient.skill.privateSkill.deletePrivateDistributionAccount,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_ACCOUNT_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/privateDistributionAccounts/${TEST_ACCOUNT_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
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
