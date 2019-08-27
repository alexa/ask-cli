const { expect } = require('chai');
const sinon = require('sinon');

const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill publishing lifecycle related APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_WITHDRAW_REASON = 'withdrawReason';
        const TEST_WITHDRAW_MESSAGE = 'withdrawMessage';
        const TEST_NEXT_TOKEN = 'nextToken';
        const TEST_MAX_RESULTS = 'maxResults';
        const TEST_CERTIFICATION_ID = 'certificationId';
        const TEST_ACCEPT_LANGUAGE = 'acceptLanguage';

        [
            {
                testCase: 'submit-skill',
                apiFunc: smapiClient.skill.publishing.submitSkill,
                parameters: [TEST_SKILL_ID, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/submit`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'withdraw-skill',
                apiFunc: smapiClient.skill.publishing.withdrawSkill,
                parameters: [TEST_SKILL_ID, TEST_WITHDRAW_REASON, TEST_WITHDRAW_MESSAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/withdraw`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {},
                    body: {
                        reason: TEST_WITHDRAW_REASON,
                        message: TEST_WITHDRAW_MESSAGE
                    },
                    json: true
                }
            },
            {
                testCase: 'list-certifications',
                apiFunc: smapiClient.skill.publishing.listCertifications,
                parameters: [TEST_SKILL_ID, { nextToken: TEST_NEXT_TOKEN,
                    maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/certifications?`
                    + `nextToken=${TEST_NEXT_TOKEN}&maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-certifications without maxResults',
                apiFunc: smapiClient.skill.publishing.listCertifications,
                parameters: [TEST_SKILL_ID, { nextToken: TEST_NEXT_TOKEN }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/certifications?`
                    + `nextToken=${TEST_NEXT_TOKEN}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-certifications without nextToken',
                apiFunc: smapiClient.skill.publishing.listCertifications,
                parameters: [TEST_SKILL_ID, { maxResults: TEST_MAX_RESULTS }, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/certifications?`
                    + `maxResults=${TEST_MAX_RESULTS}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'list-certifications with null query parameters',
                apiFunc: smapiClient.skill.publishing.listCertifications,
                parameters: [TEST_SKILL_ID, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/certifications`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-certification',
                apiFunc: smapiClient.skill.publishing.getCertification,
                parameters: [TEST_SKILL_ID, TEST_CERTIFICATION_ID, TEST_ACCEPT_LANGUAGE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/certifications/${TEST_CERTIFICATION_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: { 'Accept-Language': TEST_ACCEPT_LANGUAGE },
                    body: null,
                    json: false
                }
            },
            {
                testCase: 'get-certification with null accept language',
                apiFunc: smapiClient.skill.publishing.getCertification,
                parameters: [TEST_SKILL_ID, TEST_CERTIFICATION_ID, null, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/skills/${TEST_SKILL_ID}/certifications/${TEST_CERTIFICATION_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: { },
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
