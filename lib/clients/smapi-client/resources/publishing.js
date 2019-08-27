const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function submitSkill(skillId, callback) {
        const url = `skills/${skillId}/submit`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.SUBMIT,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function withdrawSkill(skillId, withdrawReason, withdrawMessage, callback) {
        const url = `skills/${skillId}/withdraw`;
        const payload = {
            reason: withdrawReason,
            message: withdrawMessage
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.WITHDRAW,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    /**
     * List Certifications based on the skill-id.
     * @param {string} skillId Skill ID to retrieve certifications for
     * @param {Object} queryParams Query parameters for the API
     * @param {string} queryParams.nextToken token to get more certification
     *      reviews, after you receive a response with truncated results. Set it to the value of
     *      nextToken from the truncated response you just received.
     * @param {string} queryParams.maxResults The max number of items to return in the
     *      response. Default maximum is 50.
     * @param {Function} callback
     */
    function listCertifications(skillId, queryParams, callback) {
        let queryObject = R.clone(queryParams);
        if (!queryObject) {
            queryObject = {};
        }
        const url = `skills/${skillId}/certifications`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_CERTIFICATIONS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * Get details about a specific certification review based on the skill-id.
     * @param {string} skillId Skill ID to retrieve certifications for
     * @param {string} certificationId Certification ID for Skill to retrieve certifications for
     * @param {string} acceptLanguage Language to receive localized response
     * @param {Function} callback
     */
    function getCertification(skillId, certificationId, acceptLanguage, callback) {
        const url = `skills/${skillId}/certifications/${certificationId}`;
        const headers = {};
        if (acceptLanguage) {
            headers['Accept-Language'] = acceptLanguage;
        }
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_CERTIFICATION,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            headers,
            NULL_PAYLOAD,
            callback
        );
    }

    return {
        submitSkill,
        withdrawSkill,
        listCertifications,
        getCertification
    };
};
