const R = require('ramda');
const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    /**
     * Get details of task definition.
     * @param {String} skillId [required] skill id
     * @param {String} taskName [required] name of task
     * @param {Integer} taskVersion [required] version of task
     * @param {Function} callback callback function
     */
    function getTask(skillId, taskName, taskVersion, callback) {
        const url = `tasks/${taskName}/versions/${taskVersion}/?skillId=${skillId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_TASK,
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
     * Search for task definitions.
     * @param {String} skillId [required] skill id
     * @param {String} keywords search task keywords
     * @param {String} providerSkillId task provider skill id
     * @param {Object} queryParams  | nextToken
     *                              | maxResults
     * @param {Function} callback callback function
     */
    function searchTask(skillId, keywords, providerSkillId, queryParams, callback) {
        const queryObject = R.clone(queryParams) || {};
        queryObject.skillId = skillId;
        if (keywords) {
            queryObject.keywords = keywords;
        }
        if (providerSkillId) {
            queryObject.providerSkillId = providerSkillId;
        }
        const url = 'tasks/';
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.SEARCH_TASK,
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
        getTask,
        searchTask
    };
};
