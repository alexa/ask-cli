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
            queryObject.maxResults = CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;
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

    /**
     * Get calculated metrics, insights and advanced analytics report for skills usage.
     * @param {String} skillId [required] Unique identifier of skill.
     * @param {String} startTime [required] The start time of query.
     * @param {String} endTime [required] The end time of the query. The maximum duration is one week.
     * @param {Enum} period [required] The aggregation period that is used when retrieving the metric. The values are SINGLE, PT15M, PT1H, P1D.
     * @param {Enum} metric [required] A distinct set of logic that predictably returns a set of data.
     * @param {Enum} stage [required] This parameter shows the stage of the skill. The accepted values are: live or development.
     * @param {Enum} skillType [required] The type of skill. Potential values are: custom, smartHome, or flashBriefing.
     * @param {String} intent The skill intent.
     * @param {String} locale The locale of the skill.
     * @param {String} maxResults The maximum number of results to display per page (100,000 is the maximum number of results).
     * @param {String} nextToken The continuation token returned in response to an object of the last get metrics report response.
     * @param {callback} callback callback function
     */
    function getMetrics(skillId, startTime, endTime, period, metric, stage, skillType,
        intent, locale, maxResults, nextToken, callback) {
        const queryObject = {};
        if (startTime) {
            queryObject.startTime = startTime;
        }
        if (endTime) {
            queryObject.endTime = endTime;
        }
        if (period) {
            queryObject.period = period;
        }
        if (metric) {
            queryObject.metric = metric;
        }
        if (stage) {
            queryObject.stage = stage;
        }
        if (skillType) {
            queryObject.skillType = skillType;
        }
        if (intent) {
            queryObject.intent = intent;
        }
        if (locale) {
            queryObject.locale = locale;
        }

        queryObject.maxResults = maxResults || CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;

        if (nextToken) {
            queryObject.nextToken = nextToken;
        }

        const url = `skills/${skillId}/metrics`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_METRICS,
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
        listIspForSkill,
        getMetrics
    };
};
