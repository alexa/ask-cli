const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill interaction model APIs', () => {
        let httpClientStub;
        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_SKILL_STAGE = 'skillStage';
        const TEST_LOCALE = 'locale';
        const TEST_MODEL = { interactionModel: 'model' };
        const TEST_ETAG = 'eTag';
        const TEST_NEXT_TOKEN = 'nextToken';
        const TEST_MAX_RESULTS = 'maxResults';
        const TEST_SORT_DIRECTION = 'sortDirection';
        const TEST_SORT_FIELD = 'sortField';
        const TEST_PROFILE = 'testProfile';
        const TEST_ACCESS_TOKEN = 'access_token';

        [
            {
                testCase: 'get-interaction-model',
                apiFunc: smapiClient.skill.interactionModel.getInteractionModel,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'set-interaction-model',
                apiFunc: smapiClient.skill.interactionModel.setInteractionModel,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, TEST_MODEL, TEST_ETAG, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {
                        'If-Match': TEST_ETAG,
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        interactionModel: 'model'
                    },
                    json: true
                }
            },
            {
                testCase: 'set-interaction-model without eTag',
                apiFunc: smapiClient.skill.interactionModel.setInteractionModel,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, TEST_MODEL, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        interactionModel: 'model'
                    },
                    json: true
                }
            },
            {
                testCase: 'head-interaction-model',
                apiFunc: smapiClient.skill.interactionModel.headInteractionModel,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.HEAD,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-interaction-model-versions',
                apiFunc: smapiClient.skill.interactionModel.listInteractionModelVersions,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, { nextToken: TEST_NEXT_TOKEN,
                    maxResults: TEST_MAX_RESULTS,
                    sortDirection: TEST_SORT_DIRECTION,
                    sortField: TEST_SORT_FIELD }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/`
                        + `${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}/versions?`
                        + `nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}&sortDirection=${TEST_SORT_DIRECTION}&sortField=${TEST_SORT_FIELD}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-interaction-model-versions without maxResults',
                apiFunc: smapiClient.skill.interactionModel.listInteractionModelVersions,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, { nextToken: TEST_NEXT_TOKEN,
                    sortDirection: TEST_SORT_DIRECTION,
                    sortField: TEST_SORT_FIELD }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/`
                        + `${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}/versions?`
                        + `nextToken=${TEST_NEXT_TOKEN}&sortDirection=${TEST_SORT_DIRECTION}&sortField=${TEST_SORT_FIELD}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-interaction-model-versions without nextToken',
                apiFunc: smapiClient.skill.interactionModel.listInteractionModelVersions,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, { maxResults: TEST_MAX_RESULTS,
                    sortDirection: TEST_SORT_DIRECTION,
                    sortField: TEST_SORT_FIELD }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/`
                        + `${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}/versions?`
                        + `maxResults=${TEST_MAX_RESULTS}&sortDirection=${TEST_SORT_DIRECTION}&sortField=${TEST_SORT_FIELD}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-interaction-model-versions without sortDirection',
                apiFunc: smapiClient.skill.interactionModel.listInteractionModelVersions,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, { nextToken: TEST_NEXT_TOKEN,
                    maxResults: TEST_MAX_RESULTS,
                    sortField: TEST_SORT_FIELD }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/`
                        + `${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}/versions?`
                        + `nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}&sortField=${TEST_SORT_FIELD}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-interaction-model-versions without sortField',
                apiFunc: smapiClient.skill.interactionModel.listInteractionModelVersions,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, { nextToken: TEST_NEXT_TOKEN,
                    maxResults: TEST_MAX_RESULTS,
                    sortDirection: TEST_SORT_DIRECTION }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/`
                        + `${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}/versions?`
                        + `nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}&sortDirection=${TEST_SORT_DIRECTION}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-interaction-model-versions with null query parameters',
                apiFunc: smapiClient.skill.interactionModel.listInteractionModelVersions,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/`
                        + `${TEST_SKILL_STAGE}/interactionModel/locales/${TEST_LOCALE}/versions`,
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
