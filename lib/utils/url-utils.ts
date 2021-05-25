import validUrl from 'valid-url';
import path from 'path';
import { URL } from 'url';

function isValidUrl(urlString: string) {
    return typeof urlString === 'string' && !!validUrl.isUri(urlString);
}

function isLambdaArn(urlString: string) {
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

function isHttpsUrl(urlString: string) {
    if (!isValidUrl(urlString)) {
        return false;
    }

    const url = new URL(urlString);

    return url.protocol === 'https:';
}

function isUrlOfficialTemplate(inputUrl: string) {
    if (!isValidUrl(inputUrl)) {
        return false;
    }

    const url = new URL(inputUrl);
    const source = url.pathname.split('/')[1];
    return source === 'alexa';
}

function isUrlWithJsonExtension(inputUrl: string) {
    if (!isValidUrl(inputUrl)) {
        return false;
    }
    const urlType = path.extname(inputUrl);
    return urlType === '.json';
}

export default {
    isValidUrl,
    isLambdaArn,
    isHttpsUrl,
    isUrlOfficialTemplate,
    isUrlWithJsonExtension
};
