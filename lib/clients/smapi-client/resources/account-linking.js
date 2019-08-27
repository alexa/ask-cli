const CONSTANTS = require('@src/utils/constants');

const ACCOUNT_LINKING_URL_BASE = 'accountLinkingClient';

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function setAccountLinking(skillId, stage, accountLinkingInfo, callback) {
        const url = `skills/${skillId}/stages/${stage}/${ACCOUNT_LINKING_URL_BASE}`;
        const payload = {
            accountLinkingRequest: accountLinkingInfo
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.SET_ACCOUNT_LINKING,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function getAccountLinking(skillId, stage, callback) {
        const url = `skills/${skillId}/stages/${stage}/${ACCOUNT_LINKING_URL_BASE}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_ACCOUNT_LINKING,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function deleteAccountLinking(skillId, stage, callback) {
        const url = `skills/${skillId}/stages/${stage}/${ACCOUNT_LINKING_URL_BASE}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.DELETE_ACCOUNT_LINKING,
            CONSTANTS.HTTP_REQUEST.VERB.DELETE,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    return {
        setAccountLinking,
        getAccountLinking,
        deleteAccountLinking
    };
};
