const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const EMPTY_PAYLOAD = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    /**
     * Creates a beta test.
     * @param {string} skillId | skill id,
     * @param {string} feedbackEmail | feedback email
     * @param {function} callback | callback function from command
     */
    function createBetaTest(skillId, feedbackEmail, callback) {
        const url = `skills/${skillId}/betaTest`;
        const payload = stringUtils.isNonBlankString(feedbackEmail) ? { feedbackEmail } : EMPTY_PAYLOAD;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.CREATE_BETA_TEST,
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
     * Updates the details of a beta test. Currently only the feedback email can be updated.
     * @param {string} skillId | skill id,
     * @param {string} feedbackEmail | feedback email
     * @param {function} callback | callback function from command
     */
    function updateBetaTest(skillId, feedbackEmail, callback) {
        const url = `skills/${skillId}/betaTest`;
        const payload = stringUtils.isNonBlankString(feedbackEmail) ? { feedbackEmail } : EMPTY_PAYLOAD;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.UPDATE_BETA_TEST,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    /**
     * Obtains the beta test details for a specified skill ID.
     * @param {string} skillId | skill id
     * @param {function} callback | callback function from command
     */
    function getBetaTest(skillId, callback) {
        const url = `skills/${skillId}/betaTest`;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_BETA_TEST,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            EMPTY_PAYLOAD,
            callback
        );
    }

    /**
     * Start the beta test for the specified skill ID. This will start the clock for the test's duration,
     * as a beta test can only last 90 days, although you can then create a new beta test.
     * @param {string} skillId | skill id
     * @param {function} callback | callback function from command
     */
    function startBetaTest(skillId, callback) {
        const url = `skills/${skillId}/betaTest/start`;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.START_BETA_TEST,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            EMPTY_PAYLOAD,
            callback
        );
    }

    /**
     * Ends the beta test for the specified skill ID. By default, a beta test will conclude after 90 days.
     * You can end a beta test early with this API.
     * @param {string} skillId | skill id
     * @param {function} callback | callback function from command
     */
    function endBetaTest(skillId, callback) {
        const url = `skills/${skillId}/betaTest/end`;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.END_BETA_TEST,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            EMPTY_PAYLOAD,
            callback
        );
    }

    /**
     * List testers in a beta test of given Alexa skill
     * @param skillId [Required] | skill id
     * @param queryParams, contains nextToken | token to get next page of results and maxResults | max number of results returned, default is 50
     * @param callback | callback function from command
     */
    function listBetaTesters(skillId, queryParams, callback) {
        const url = `skills/${skillId}/betaTest/testers`;
        let queryObject = R.clone(queryParams);
        if (R.isEmpty(queryObject)) {
            queryObject = {};
        }

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_BETA_TESTERS,
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
     * Add testers to a beta test of given Alexa skill
     * @param skillId [Required] skill id
     * @param testers tester email id list
     * @param callback callback function from command
     */
    function addBetaTesters(skillId, testers, callback) {
        const url = `skills/${skillId}/betaTest/testers/add`;
        const payload = {
            testers,
        };

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.ADD_BETA_TESTERS,
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
     * Remove testers from a beta test of a given Alexa skill
     * @param skillId [Required] skill id
     * @param testers tester email id list
     * @param callback callback function from command
     */
    function removeBetaTesters(skillId, testers, callback) {
        const url = `skills/${skillId}/betaTest/testers/remove`;
        const payload = {
            testers,
        };

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.REMOVE_BETA_TESTERS,
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
     * Send reminder to testers in a beta test of a given Alexa skill
     * @param skillId [Required] skill id
     * @param testers tester email id list
     * @param callback callback function from command
     */
    function sendReminderToBetaTesters(skillId, testers, callback) {
        const url = `skills/${skillId}/betaTest/testers/sendReminder`;
        const payload = {
            testers,
        };

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.SEND_REMINDER_TO_BETA_TESTERS,
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
     * Request feedback from testers in a beta test of given Alexa skill
     * @param skillId [Required] skill id
     * @param testers tester email id list
     * @param callback callback function from command
     */
    function requestFeedbackFromBetaTesters(skillId, testers, callback) {
        const url = `skills/${skillId}/betaTest/testers/requestFeedback`;
        const payload = {
            testers,
        };

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.REQUEST_FEEDBACK_FROM_BETA_TESTERS,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    return {
        createBetaTest,
        updateBetaTest,
        getBetaTest,
        startBetaTest,
        endBetaTest,
        listBetaTesters,
        addBetaTesters,
        removeBetaTesters,
        sendReminderToBetaTesters,
        requestFeedbackFromBetaTesters
    };
};
