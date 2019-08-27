const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function listVendors(callback) {
        const url = 'vendors';
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_VENDORS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    return {
        listVendors
    };
};
