const R = require('ramda');
const querystring = require('querystring');

const CONSTANTS = require('@src/utils/constants');

const ISP_URL_BASE = 'inSkillProducts';
const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function createSkill(manifest, vendorId, callback) {
        const url = 'skills/';
        const payload = {
            vendorId,
            manifest: manifest.manifest
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.CREATE_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function deleteSkill(skillId, callback) {
        const url = `skills/${skillId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.DELETE_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.DELETE,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * List skills based on the vendor-id
     * @param {*} vendorId
     * @param {*} queryParams | nextToken
     *                        | maxResults
     * @param {*} callback
     */
    function listSkills(vendorId, queryParams, callback) {
        let queryObject = R.clone(queryParams);
        if (!queryObject) {
            queryObject = {};
        }
        queryObject.vendorId = vendorId;
        if (queryObject && !queryObject.maxResults) {
            queryObject.maxResults = CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;
        }
        const url = 'skills';
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_SKILLS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function getSkillStatus(skillId, resourcesList, callback) {
        let url = `skills/${skillId}/status`;
        if (resourcesList && resourcesList.length !== 0) {
            url += `?${querystring.stringify({ resource: resourcesList })}`;
        }
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_SKILL_STATUS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function enableSkill(skillId, stage, callback) {
        const url = `skills/${skillId}/stages/${stage}/enablement`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.ENABLE_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function disableSkill(skillId, stage, callback) {
        const url = `skills/${skillId}/stages/${stage}/enablement`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.DISABLE_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.DELETE,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function getSkillEnablement(skillId, stage, callback) {
        const url = `skills/${skillId}/stages/${stage}/enablement`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_SKILL_ENABLEMENT,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function getSkillCredentials(skillId, callback) {
        const url = `skills/${skillId}/credentials`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_SKILL_CREDENTIALS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function validateSkill(skillId, stage, locales, callback) {
        const url = `skills/${skillId}/stages/${stage}/validations`;
        const payload = {
            locales: locales.trim().split(/[\s,]+/) // comma or space deliminater regex
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.VALIDATE_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function getValidation(skillId, stage, validationId, callback) {
        const url = `skills/${skillId}/stages/${stage}/validations/${validationId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_VALIDATION,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * List ISPs based on the skill-id.
     * @param {*} skillId
     * @param {*} stage
     * @param {*} queryParams | nextToken
     *                        | maxResults
     * @param {*} callback
     */
    function listIspForSkill(skillId, stage, queryParams, callback) {
        const queryObject = R.clone(queryParams);
        if (queryObject && !queryObject.maxResults) {
            queryObject.maxResults = CONSTANTS.ISP.NUMBERS.DEFAULT_ISP_MAX_RESULTS;
        }
        const url = `skills/${skillId}/stages/${stage}/${ISP_URL_BASE}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_ISP_FOR_SKILL,
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
        createSkill,
        deleteSkill,
        listSkills,
        getSkillStatus,
        enableSkill,
        disableSkill,
        getSkillEnablement,
        getSkillCredentials,
        validateSkill,
        getValidation,
        listIspForSkill
    };
};
