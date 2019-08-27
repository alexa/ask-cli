const { expect } = require('chai');
const sinon = require('sinon');

const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill CRUD related APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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
                    headers: {},
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

    describe('# skill development lifecycle related APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_SKILL_STAGE = 'skillStage';
        const TEST_VALIDATION_ID = 'validationId';
        const TEST_LOCALE = ' locale1  , locale2  ';

        [
            {
                testCase: 'enable-skill',
                apiFunc: smapiClient.skill.enableSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/enablement`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.PUT,
                    headers: {},
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
                    headers: {},
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
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'validate-skill',
                apiFunc: smapiClient.skill.validateSkill,
                parameters: [TEST_SKILL_ID, TEST_SKILL_STAGE, TEST_LOCALE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/stages/${TEST_SKILL_STAGE}/validations`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
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
                    headers: {},
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
