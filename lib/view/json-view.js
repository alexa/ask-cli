const CONSTANTS = require('@src/utils/constants');

module.exports = {
    toString
};

/**
 * Convert JSON object to display string
 * @param {Object} jsonObject
 * @returns formatted JSON string or serialization error
 */
function toString(jsonObject) {
    try {
        return JSON.stringify(jsonObject, null, CONSTANTS.CONFIGURATION.JSON_DISPLAY_INDENT);
    } catch (e) {
        return e.toString();
    }
}
