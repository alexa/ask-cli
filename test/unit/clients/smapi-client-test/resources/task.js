const { expect } = require('chai');
const sinon = require('sinon');
const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# task get and search APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_TASK_NAME = 'taskName';
        const TEST_TASK_VERSION = 'taskVersion';
        const TEST_SINGLE_KEYWORD = 'KEYWORD';
        const TEST_MULTIPLE_KEYWORDS = 'KEYWORD1,KEYWORD2';
        const TEST_MULTIPLE_KEYWORDS_QUERY_PARAM = 'KEYWORD1%2CKEYWORD2';
        const TEST_MULTIPLE_KEYWORDS_INCLUDING_SPACES = 'KEYWORD1,KEYWORD 2';
        const TEST_MULTIPLE_KEYWORDS_INCLUDING_SPACES_QUERY_PARAM = 'KEYWORD1%2CKEYWORD%202';
        const TEST_PROVIDER_SKILL_ID = 'providerSkillId';
        const TEST_MAX_RESULTS = 'maxResults';
        const TEST_NEXT_TOKEN = 'nextToken';

        [
            {
                testCase: 'get-task',
                apiFunc: smapiClient.task.getTask,
                parameters: [TEST_SKILL_ID, TEST_TASK_NAME, TEST_TASK_VERSION, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}`
                    + `/tasks/${TEST_TASK_NAME}/versions/${TEST_TASK_VERSION}/?skillId=${TEST_SKILL_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'search-task single keyword',
                apiFunc: smapiClient.task.searchTask,
                parameters: [TEST_SKILL_ID, TEST_SINGLE_KEYWORD, TEST_PROVIDER_SKILL_ID,
                    { maxResults: TEST_MAX_RESULTS, nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/tasks/?`
                    + `maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}&`
                    + `skillId=${TEST_SKILL_ID}&keywords=${TEST_SINGLE_KEYWORD}&providerSkillId=${TEST_PROVIDER_SKILL_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'search-task multiple keywords',
                apiFunc: smapiClient.task.searchTask,
                parameters: [TEST_SKILL_ID, TEST_MULTIPLE_KEYWORDS, TEST_PROVIDER_SKILL_ID,
                    { maxResults: TEST_MAX_RESULTS, nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/tasks/?`
                    + `maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}&`
                    + `skillId=${TEST_SKILL_ID}&keywords=${TEST_MULTIPLE_KEYWORDS_QUERY_PARAM}&providerSkillId=${TEST_PROVIDER_SKILL_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'search-task multiple keywords including spaces',
                apiFunc: smapiClient.task.searchTask,
                parameters: [TEST_SKILL_ID, TEST_MULTIPLE_KEYWORDS_INCLUDING_SPACES, TEST_PROVIDER_SKILL_ID,
                    { maxResults: TEST_MAX_RESULTS, nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V1}/tasks/?`
                    + `maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}&`
                    + `skillId=${TEST_SKILL_ID}&keywords=${TEST_MULTIPLE_KEYWORDS_INCLUDING_SPACES_QUERY_PARAM}&`
                    + `providerSkillId=${TEST_PROVIDER_SKILL_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            }
        ].forEach(({ testCase, apiFunc, parameters, expectedOptions }) => {
            it(`| call ${testCase} successfully`, (done) => {
                oauthWrapper.tokenRefreshAndRead.callsFake(noop);
                apiFunc(...parameters);
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
