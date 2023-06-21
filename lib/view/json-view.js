const CONSTANTS = require("../utils/constants");

module.exports = {
  toString,
};

/**
 * Convert JSON object to display string
 * @param {Object} jsonObject
 * @returns formatted JSON string or serialization error
 */
function toString(jsonObject) {
  try {
    if (typeof jsonObject === 'string') {
      return jsonObject;
    }
    // handle issue when Error object serialized to {}
    if (jsonObject instanceof Error) {
      jsonObject = {message: jsonObject.message, stack: jsonObject.stack, detail: jsonObject};
    }
    return JSON.stringify(jsonObject, null, CONSTANTS.CONFIGURATION.JSON_DISPLAY_INDENT);
  } catch (e) {
    return e.toString();
  }
}
