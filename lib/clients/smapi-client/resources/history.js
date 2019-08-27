const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    /**
     * Get utterance transcripts for a skill
     * @param {String} skillId | skill id
     * @param {*} queryParameters | maxResults
     *                              sortDirection
     *                              sortField
     *                              nextToken
     * @param {function} callback | callback function from command
     */
    function getIntentRequestsHistory(skillId, queryParams, callback) {
        let queryObject = R.clone(queryParams);
        if (R.isEmpty(queryObject)) {
            queryObject = {};
        }
        const url = `skills/${skillId}/history/intentRequests`;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.INTENT_REQUEST_HISTORY,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    return {
        getIntentRequestsHistory
    };
};
