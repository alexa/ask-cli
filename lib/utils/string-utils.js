const R = require('ramda');

module.exports = {
    isNonEmptyString,
    isNonBlankString,
    isLambdaFunctionName,
    filterNonAlphanumeric,
    generateTimeStamp,
    splitStringFilterAndMapTo
};

function isNonEmptyString(str) {
    return R.is(String, str) && !R.isEmpty(str);
}

function isNonBlankString(str) {
    return isNonEmptyString(str) && !!str.trim();
}

/**
 * Check if input string is a valid lambda function name
 * @param {string} str
 */
function isLambdaFunctionName(str) {
    if (!str) {
        return false;
    }
    // This regex can be used to check if the str
    // could be a valid lambda function name
    const lambdaFunctionNameRegex = /^([a-zA-Z0-9-_]+)$/;
    return lambdaFunctionNameRegex.test(str);
}

/**
 * Filter non-alphanumeric in a string and remove the character
 * @param {string} str
 */
function filterNonAlphanumeric(str) {
    if (!str) {
        return str;
    }
    return str.replace(/[^a-zA-Z0-9-]+/g, '');
}

/**
 * Generate ISO string for timestamp, for example: 2019-03-19T22:26:36.002Z -> 20190319222636002
 */
function generateTimeStamp() {
    const now = new Date();
    return now.toISOString().match(/([0-9])/g).join('');
}

/**
 * Applies the sequence of operations split, filter and map on a given string.
 */
function splitStringFilterAndMapTo(string, delimiter, filterBy, mapper) {
    let arr = [];
    if (isNonBlankString(string)) {
        arr = string.split(delimiter);
    }
    if (Object.prototype.toString.call(filterBy) === '[object Function]') {
        arr = arr.filter(filterBy);
    }
    if (Object.prototype.toString.call(mapper) === '[object Function]') {
        arr = arr.map(mapper);
    }
    return arr;
}
