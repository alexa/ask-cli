const url = require('url');
const R = require('ramda');
const HttpsProxyAgent = require('https-proxy-agent');

const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');

const isCodeSuccessfulDefault = (responseCode) => responseCode >= 200 && responseCode < 300;

class HttpResponseError extends Error {
    constructor(response) {
        super(`Request failed with status code: ${response.statusCode}`);
        this.name = 'HttpClientResponseError';
        this.statusCode = response.statusCode;
        this.headers = response.headers;
        this.responseBody = response.body;
    }
}

module.exports = class HttpClient {
    constructor({ debug = false, isCodeSuccessful = isCodeSuccessfulDefault }) {
        this.debug = debug;
        this.isCodeSuccessful = isCodeSuccessful;
    }

    stringifyHeaders(item) {
        const headers = JSON.stringify(item.headers);
        return { ...item, headers };
    }

    logRequest(req) {
        Messenger.getInstance().debug('REQUEST:');
        Messenger.getInstance().debug(jsonView.toString(this.stringifyHeaders(req)));
    }

    logResponse(res) {
        Messenger.getInstance().debug('RESPONSE:');
        const message = this.stringifyHeaders(res);
        const requestId = res.headers['x-amzn-requestid'];
        message['request-id'] = R.defaultTo(R.path(['value'], requestId), null);
        Messenger.getInstance().debug(jsonView.toString(message));
    }

    invoke(request) {
        Messenger.getInstance().setDoDebug(this.debug);
        this.logRequest(request);

        const urlObj = url.parse(request.url);

        const clientRequestOptions = {
            hostname: urlObj.hostname,
            path: urlObj.path,
            port: urlObj.port,
            protocol: urlObj.protocol,
            auth: urlObj.auth,
            headers: request.headers,
            method: request.method,
        };

        const proxyUrl = process.env.ASK_CLI_PROXY;
        if (proxyUrl) {
            clientRequestOptions.agent = new HttpsProxyAgent(proxyUrl);
        }

        // eslint-disable-next-line global-require
        const client = clientRequestOptions.protocol === 'https:' ? require('https') : require('http');

        return new Promise((resolve, reject) => {
            const clientRequest = client.request(clientRequestOptions, (response) => {
                const chunks = [];
                response.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                response.on('end', () => {
                    const responseStr = Buffer.concat(chunks).toString();

                    const responseObj = {
                        statusCode: response.statusCode,
                        body: responseStr,
                        headers: response.headers,
                    };

                    this.logResponse(responseObj);

                    if (this.isCodeSuccessful(response.statusCode)) {
                        resolve(responseObj);
                    } else {
                        reject(new HttpResponseError(responseObj));
                    }
                });
            });

            clientRequest.on('error', (err) => {
                reject(err);
            });

            if (request.body) {
                clientRequest.write(request.body);
            }

            clientRequest.end();
        });
    }
};
