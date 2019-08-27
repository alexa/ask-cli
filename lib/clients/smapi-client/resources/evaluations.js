const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};

module.exports = (smapiHandle) => {
    /**
     * Profile utterance with NLU
     * @param {string} skillId | skill id
     * @param {string} stage | skill stage, default is development
     * @param {string} locale | skill locale
     * @param {string} utterance | utterance to be profiled
     * @param {string} multiTurnToken | multiturn token for dialog
     * @param {function} callback | callback function from command
     */
    function callProfileNlu(skillId, stage, locale, utterance, multiTurnToken, callback) {
        const skillStage = stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        const url = `skills/${skillId}/stages/${skillStage}/interactionModel/locales/${locale}/profileNlu`;
        const payload = {
            utterance,
        };

        if (multiTurnToken) {
            payload.multiTurnToken = multiTurnToken;
        }

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.NLU_PROFILE,
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
        callProfileNlu
    };
};
