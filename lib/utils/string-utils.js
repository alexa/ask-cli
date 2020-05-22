const R = require('ramda');
const CONSTANTS = require('@src/utils/constants');

module.exports = {
    getParamNames,
    camelCase,
    kebabCase,
    standardize,
    canParseAsJson,
    isNonEmptyString,
    isNonBlankString,
    isLambdaFunctionName,
    filterNonAlphanumeric,
    splitStringFilterAndMapTo,
    validateSyntax
};

function getParamNames(func) {
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const ARGUMENT_NAMES = /([^\s,]+)/g;
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null) result = [];
    return result;
}

function camelCase(str) {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
        .replace(/\s+/g, '')
        .replace(/-/g, '');
}

function kebabCase(str) {
    return str
    && str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.toLowerCase())
        .join('-');
}

function standardize(str) {
    return filterNonAlphanumeric(camelCase(str).toLowerCase());
}

function canParseAsJson(value) {
    try {
        JSON.parse(value);
        return true;
    } catch (err) {
        return false;
    }
}
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

/**
 *
 * @param {String} name | type of regex to be matched against.
 * @param {String} value | value to be tested.
 * returns true if the value adheres with the regex pattern.
 */
function validateSyntax(name, value) {
    return isNonBlankString(value) ? CONSTANTS.REGEX_VALIDATIONS[name].test(value) : false;
}
