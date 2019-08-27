const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function invokeSkill(skillId, stage, invokePayload, endpointRegion, callback) {
        const url = `skills/${skillId}/stages/${stage}/invocations`;
        const payload = {
            endpointRegion,
            skillRequest: invokePayload
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.INVOKE_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V2,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function simulateSkill(skillId, stage, input, newSession, locale, callback) {
        const url = `skills/${skillId}/stages/${stage}/simulations`;
        const payload = {
            input: {
                content: input
            },
            device: {
                locale
            }
        };
        if (newSession) {
            payload.session = {
                mode: 'FORCE_NEW_SESSION'
            };
        }
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.SIMULATE_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V2,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function getSimulation(skillId, simulationId, stage, callback) {
        const url = `skills/${skillId}/stages/${stage}/simulations/${simulationId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_SIMULATION,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V2,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    return {
        invokeSkill,
        simulateSkill,
        getSimulation
    };
};
