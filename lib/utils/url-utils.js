const validUrl = require('valid-url');
const path = require('path');
const url = require('url');

module.exports = {
    isValidUrl,
    isLambdaArn,
    isHttpsUrl,
    isUrlOfficialTemplate,
    isUrlWithJsonExtension
};

function isValidUrl(urlString) {
    return typeof urlString === 'string' && !!validUrl.isUri(urlString);
}

function isLambdaArn(urlString) {
    if (!isValidUrl(urlString)) {
        return false;
    }
    const lambdaRegex = new RegExp([
        'arn:aws:lambda:[a-z]+-[a-z]+-[0-9]:[0-9]{12}:',
        'function:[a-zA-Z0-9-_]+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?',
        '(:[a-zA-Z0-9-_]+)?'
    ].join(''));
    return lambdaRegex.test(urlString);
}

function isHttpsUrl(urlString) {
    if (!isValidUrl(urlString)) {
        return false;
    }
    return url.parse(urlString).protocol === 'https:';
}

function isUrlOfficialTemplate(inputUrl) {
    if (!isValidUrl(inputUrl)) {
        return false;
    }
    const urlSource = url.parse(inputUrl).pathname.split('/')[1];
    return urlSource === 'alexa';
}

function isUrlWithJsonExtension(inputUrl) {
    if (!isValidUrl(inputUrl)) {
        return false;
    }
    const urlType = path.extname(inputUrl);
    return urlType === '.json';
}
