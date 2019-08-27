const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function getInteractionModel(skillId, stage, locale, callback) {
        const url = `skills/${skillId}/stages/${stage}/interactionModel/locales/${locale}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_INTERACTION_MODEL,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function setInteractionModel(skillId, stage, locale, modelSchema, eTag, callback) {
        const url = `skills/${skillId}/stages/${stage}/interactionModel/locales/${locale}`;
        const payload = {
            interactionModel: modelSchema.interactionModel
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.SET_INTERACTION_MODEL,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            eTag ? { 'If-Match': eTag } : {},
            payload,
            callback
        );
    }

    function headInteractionModel(skillId, stage, locale, callback) {
        const url = `skills/${skillId}/stages/${stage}/interactionModel/locales/${locale}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.HEAD_INTERACTION_MODEL,
            CONSTANTS.HTTP_REQUEST.VERB.HEAD,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * List Interaction Model Versions for the skill.
     * @param {string} skillId Skill ID to retrieve interaction model versions for
     * @param {string} stage Skill stage to retrieve interaction model versions for
     * @param {string} locale Skill locale to retrieve interaction model versions for
     * @param {Object} queryParams Query parameters for the API
     * @param {string} queryParams.nextToken token to get more model versions
     *      , after you receive a response with truncated results. Set it to the value of
     *      nextToken from the truncated response you just received.
     * @param {string} queryParams.maxResults The max number of items to return in the
     *      response. Default maximum is 50.
     * @param {string} queryParams.sortDirection Sets the sorting direction of the versions
     *      returned in the response.
     * @param {string} queryParams.sortField Sets the field that the sorting is applied to.
     * @param {Function} callback
     */
    function listInteractionModelVersions(skillId, stage, locale, queryParams, callback) {
        let queryObject = R.clone(queryParams);
        if (!queryObject) {
            queryObject = {};
        }
        const url = `skills/${skillId}/stages/${stage}/interactionModel/locales/${locale}/versions`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_INTERACTION_MODEL_VERSIONS,
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
        getInteractionModel,
        setInteractionModel,
        headInteractionModel,
        listInteractionModelVersions
    };
};
