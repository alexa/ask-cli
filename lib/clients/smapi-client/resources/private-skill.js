const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function addPrivateDistributionAccount(skillId, stage, accountId, callback) {
        const url = `skills/${skillId}/stages/${stage}/privateDistributionAccounts/${accountId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.ADD_PRIVATE_DISTRIBUTION_ACCOUNT,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * List accounts for private skill
     * @param {*} skillId
     * @param {*} stage
     * @param {*} queryParams | nextToken
     *                        | maxResults
     * @param {*} callback
     */
    function listPrivateDistributionAccounts(skillId, stage, queryParams, callback) {
        const url = `skills/${skillId}/stages/${stage}/privateDistributionAccounts`;
        const queryObject = R.clone(queryParams);
        if (queryObject && !queryObject.maxResults) {
            queryObject.maxResults = 50;
        }
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_PRIVATE_DISTRIBUTION_ACCOUNTS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function deletePrivateDistributionAccount(skillId, stage, accountId, callback) {
        const url = `skills/${skillId}/stages/${stage}/privateDistributionAccounts/${accountId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.DELETE_PRIVATE_DISTRIBUTION_ACCOUNT,
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
        addPrivateDistributionAccount,
        listPrivateDistributionAccounts,
        deletePrivateDistributionAccount
    };
};
