const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {
    describe('# skill test related APIs', () => {
        let httpClientStub;
        beforeEach(() => {
            httpClientStub = sinon.stub(httpClient, 'request').callsFake(noop);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead');
        });

        const TEST_SKILL_ID = 'skillId';
        const TEST_INPUT = 'input';
        const TEST_LOCALE = ' locale1  , locale2  ';
        const TEST_SIMULATION_ID = 'simulationId';
        const TEST_ENDPOINT_REGION = 'endpointRegion';
        const TEST_INVOKE_PAYLOAD = 'invokePayload';
        const FORCE_NEW_SESSION = 'FORCE_NEW_SESSION';
        const TEST_PROFILE = 'testProfile';
        const TEST_ACCESS_TOKEN = 'access_token';
        [
            {
                testCase: 'simulate-skill without force new session',
                apiFunc: smapiClient.skill.test.simulateSkill,
                parameters: [TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_INPUT, false, TEST_LOCALE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V2}/skills/${TEST_SKILL_ID}`
                        + `/stages/${CONSTANTS.SKILL.STAGE.DEVELOPMENT}/simulations`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        input: { content: TEST_INPUT },
                        device: { locale: TEST_LOCALE }
                    },
                    json: true
                }
            },
            {
                testCase: 'simulate-skill with force new session',
                apiFunc: smapiClient.skill.test.simulateSkill,
                parameters: [TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_INPUT, true, TEST_LOCALE, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V2}/skills/${TEST_SKILL_ID}`
                        + `/stages/${CONSTANTS.SKILL.STAGE.DEVELOPMENT}/simulations`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        input: { content: TEST_INPUT },
                        device: { locale: TEST_LOCALE },
                        session: { mode: FORCE_NEW_SESSION }
                    },
                    json: true
                }
            },
            {
                testCase: 'invoke-skill',
                apiFunc: smapiClient.skill.test.invokeSkill,
                parameters: [TEST_SKILL_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, TEST_INVOKE_PAYLOAD, TEST_ENDPOINT_REGION, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V2}/skills/${TEST_SKILL_ID}`
                        + `/stages/${CONSTANTS.SKILL.STAGE.DEVELOPMENT}/invocations`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.POST,
                    headers: {
                        authorization: TEST_ACCESS_TOKEN
                    },
                    body: {
                        endpointRegion: TEST_ENDPOINT_REGION,
                        skillRequest: TEST_INVOKE_PAYLOAD
                    },
                    json: true
                }
            },
            {
                testCase: 'get-simulation',
                apiFunc: smapiClient.skill.test.getSimulation,
                parameters: [TEST_SKILL_ID, TEST_SIMULATION_ID, CONSTANTS.SKILL.STAGE.DEVELOPMENT, noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/${CONSTANTS.SMAPI.VERSION.V2}/skills/${TEST_SKILL_ID}/stages/`
                    + `${CONSTANTS.SKILL.STAGE.DEVELOPMENT}/simulations/${TEST_SIMULATION_ID}`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
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
