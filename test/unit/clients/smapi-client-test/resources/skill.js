const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    let httpClientStub;
    const TEST_PROFILE = 'testProfile';
    const TEST_ACCESS_TOKEN = 'access_token';
    describe('# skill CRUD related APIs', () => {
        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_SKILL_STAGE = 'skillStage';
        const TEST_MANIFEST = { manifest: 'manifest' };
        const TEST_VENDOR_ID = 'vendorId';
        const TEST_NEXT_TOKEN = 'nextToken';
        const TEST_MAX_RESULTS = 'maxResults';

        [
            {
                testCase: 'create-skill',
                apiFunc: smapiClient.skill.createSkill,
                parameters: [TEST_MANIFEST, TEST_VENDOR_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        manifest: 'manifest',
                        vendorId: TEST_VENDOR_ID
                    },
                    json: true
                }
            },
            {
                testCase: 'delete-skill',
                apiFunc: smapiClient.skill.deleteSkill,
                parameters: [TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-skills',
                apiFunc: smapiClient.skill.listSkills,
                parameters: [TEST_VENDOR_ID, { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills?nextToken=${TEST_NEXT_TOKEN}&`
                    + `maxResults=${TEST_MAX_RESULTS}&vendorId=${TEST_VENDOR_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-skills without maxResults',
                apiFunc: smapiClient.skill.listSkills,
                parameters: [TEST_VENDOR_ID, { nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills?nextToken=${TEST_NEXT_TOKEN}&vendorId=${TEST_VENDOR_ID}&maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-skills without nextToken',
                apiFunc: smapiClient.skill.listSkills,
                parameters: [TEST_VENDOR_ID, { maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills?maxResults=${TEST_MAX_RESULTS}&vendorId=${TEST_VENDOR_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-skills with null query parameters',
                apiFunc: smapiClient.skill.listSkills,
                parameters: [TEST_VENDOR_ID, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills?vendorId=${TEST_VENDOR_ID}&maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-skill-status',
                apiFunc: smapiClient.skill.getSkillStatus,
                parameters: [TEST_SKILL_ID, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/status`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-skill-status with manifest resource',
                apiFunc: smapiClient.skill.getSkillStatus,
                parameters: [TEST_SKILL_ID, [CONSTANTS.SKILL.RESOURCES.MANIFEST], noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/status?resource=${CONSTANTS.SKILL.RESOURCES.MANIFEST}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-skill-status with manifest and interactionModel resource',
                apiFunc: smapiClient.skill.getSkillStatus,
                parameters: [TEST_SKILL_ID, [CONSTANTS.SKILL.RESOURCES.MANIFEST, CONSTANTS.SKILL.RESOURCES.INTERACTION_MODEL], noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/status?resource=${CONSTANTS.SKILL.RESOURCES.MANIFEST}`
                    + `&resource=${CONSTANTS.SKILL.RESOURCES.INTERACTION_MODEL}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-skill',
                apiFunc: smapiClient.skill.listIspForSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, { nextToken: TEST_NEXT_TOKEN, maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/inSkillProducts?`
                    + `nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-skill without next token',
                apiFunc: smapiClient.skill.listIspForSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, { maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/inSkillProducts?`
                    + `maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-skill without max results',
                apiFunc: smapiClient.skill.listIspForSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, { nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/inSkillProducts?`
                    + `nextToken=${TEST_NEXT_TOKEN}&maxResults=50`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-isp-for-skill without max results nor next token',
                apiFunc: smapiClient.skill.listIspForSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, {}, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/inSkillProducts?maxResults=50`,
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

    describe('# skill development lifecycle related APIs', () => {
        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_SKILL_STAGE = 'skillStage';
        const TEST_VALIDATION_ID = 'validationId';
        const TEST_LOCALES = ' locale1  , locale2  ';
        const TEST_LOCALE = 'TEST_LOCALE';
        const TEST_START_TIME = 'TEST_START_TIME';
        const TEST_END_TIME = 'TEST_END_TIME';
        const TEST_PERIOD = 'SINGLE';
        const TEST_METRIC = 'uniqueCustomers';
        const TEST_SKILL_TYPE = 'custom';
        const TEST_INTENT = 'TEST_INTENT';
        const TEST_NEXT_TOKEN = 'TEST_NEXT_TOKEN';
        const TEST_MAX_RESULTS = 'TEST_MAX_RESULTS';
        const TEST_DEFAULT_MAX_RESULTS = '50';

        [
            {
                testCase: 'enable-skill',
                apiFunc: smapiClient.skill.enableSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/enablement`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'disable-skill',
                apiFunc: smapiClient.skill.disableSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/enablement`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.DELETE,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-skill-enablement',
                apiFunc: smapiClient.skill.getSkillEnablement,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/enablement`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'validate-skill',
                apiFunc: smapiClient.skill.validateSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALES, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/validations`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: { locales: ['locale1', 'locale2'] },
                    json: true
                }
            },
            {
                testCase: 'get-validation',
                apiFunc: smapiClient.skill.getValidation,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_VALIDATION_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/validations/${TEST_VALIDATION_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-skill-credentials',
                apiFunc: smapiClient.skill.getSkillCredentials,
                parameters: [TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/credentials`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, TEST_PERIOD, TEST_METRIC, TEST_SKILL_STAGE, TEST_SKILL_TYPE,
                    TEST_INTENT, TEST_LOCALE, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}`
                    + `&locale=${TEST_LOCALE}&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without startTime',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, null, TEST_END_TIME, TEST_PERIOD, TEST_METRIC, TEST_SKILL_STAGE, TEST_SKILL_TYPE, TEST_INTENT,
                    TEST_LOCALE, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?endTime=${TEST_END_TIME}&period=${TEST_PERIOD}`
                    + `&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}&locale=${TEST_LOCALE}`
                    + `&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without endTime',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, null, TEST_PERIOD, TEST_METRIC, TEST_SKILL_STAGE, TEST_SKILL_TYPE, TEST_INTENT,
                    TEST_LOCALE, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&period=${TEST_PERIOD}`
                    + `&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}&locale=${TEST_LOCALE}`
                    + `&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without period',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, null, TEST_METRIC, TEST_SKILL_STAGE, TEST_SKILL_TYPE, TEST_INTENT,
                    TEST_LOCALE, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}&locale=${TEST_LOCALE}`
                    + `&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without metric',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, TEST_PERIOD, null, TEST_SKILL_STAGE, TEST_SKILL_TYPE,
                    TEST_INTENT, TEST_LOCALE, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&period=${TEST_PERIOD}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}&locale=${TEST_LOCALE}`
                    + `&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without stage',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, TEST_PERIOD, TEST_METRIC, null, TEST_SKILL_TYPE, TEST_INTENT,
                    TEST_LOCALE, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&period=${TEST_PERIOD}&metric=${TEST_METRIC}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}&locale=${TEST_LOCALE}`
                    + `&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without skillType',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, TEST_PERIOD, TEST_METRIC, TEST_SKILL_STAGE, null, TEST_INTENT,
                    TEST_LOCALE, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&intent=${TEST_INTENT}&locale=${TEST_LOCALE}`
                    + `&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without intent',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, TEST_PERIOD, TEST_METRIC, TEST_SKILL_STAGE, TEST_SKILL_TYPE,
                    null, TEST_LOCALE, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&locale=${TEST_LOCALE}`
                    + `&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without locale',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, TEST_PERIOD, TEST_METRIC, TEST_SKILL_STAGE, TEST_SKILL_TYPE,
                    TEST_INTENT, null, TEST_MAX_RESULTS, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}`
                    + `&maxResults=${TEST_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without maxResults',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, TEST_PERIOD, TEST_METRIC, TEST_SKILL_STAGE, TEST_SKILL_TYPE,
                    TEST_INTENT, TEST_LOCALE, null, TEST_NEXT_TOKEN, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}`
                    + `&locale=${TEST_LOCALE}&maxResults=${TEST_DEFAULT_MAX_RESULTS}&nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-metrics without nextToken',
                apiFunc: smapiClient.skill.getMetrics,
                parameters: [TEST_SKILL_ID, TEST_START_TIME, TEST_END_TIME, TEST_PERIOD, TEST_METRIC, TEST_SKILL_STAGE, TEST_SKILL_TYPE,
                    TEST_INTENT, TEST_LOCALE, TEST_MAX_RESULTS, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/metrics?startTime=${TEST_START_TIME}&endTime=${TEST_END_TIME}`
                    + `&period=${TEST_PERIOD}&metric=${TEST_METRIC}&stage=${TEST_SKILL_STAGE}&skillType=${TEST_SKILL_TYPE}&intent=${TEST_INTENT}`
                    + `&locale=${TEST_LOCALE}&maxResults=${TEST_MAX_RESULTS}`,
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
