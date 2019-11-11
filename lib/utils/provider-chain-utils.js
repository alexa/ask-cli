const stringUtils = require('@src/utils/string-utils');

module.exports = {
    resolveProviderChain
};

/**
 * Utility function to return first non-blank value.
 * @param {Array} array of values with top priority first.
 * @returns first non-blank string.
 *
 * The check 'item !== undefined' is put in place to handle environment variables.
 * When environment variables are accessed, if they aren't set, the resultant value is
 * returned as 'undefined' (as a string) instead of undefined (as an object).
 */
function resolveProviderChain(chain) {
    for (const item of chain) {
        if (stringUtils.isNonBlankString(item) && item !== 'undefined') {
            return item;
        }
    }
    return null;
}
