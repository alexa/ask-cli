import * as CONSTANTS from '@src/utils/constants';

/**
 * Convert JSON object to display string
 * @param {Object} jsonObject
 * @returns formatted JSON string or serialization error
 */
export function toString(jsonObject: any) {
    try {
        // handle issue when Error object serialized to {}
        if (jsonObject instanceof Error) {
            jsonObject = { message: jsonObject.message, stack: jsonObject.stack, detail: jsonObject };
        }
        return JSON.stringify(jsonObject, null, CONSTANTS.CONFIGURATION.JSON_DISPLAY_INDENT);
    } catch (e) {
        return e.toString();
    }
}

export default {
    toString
};
