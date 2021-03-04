const { defaultTo } = require('ramda');
const { CustomSmapiClientBuilder } = require('ask-smapi-sdk');

const DynamicConfig = require('@src/utils/dynamic-config');
const HttpClient = require('@src/clients/http-client-promise');

class CustomApiClient {
    constructor({ debug }) {
        this.httpClient = new HttpClient({ debug });
    }

    arrayToObjectHeader(header) {
        const reducer = (obj, item) => {
            obj[item.key] = defaultTo(obj[item.key], []);
            obj[item.key].push(item.value);

            return obj;
        };

        return header.reduce(reducer, {});
    }

    objectToArrayHeader(header) {
        const arrayHeader = [];
        Object.keys(header).forEach((key) => {
            const headerArray = Array.isArray(header[key]) ? header[key] : [header[key]];
            for (const value of headerArray) {
                arrayHeader.push({ key, value });
            }
        });

        return arrayHeader;
    }

    invoke(request) {
        request.headers = this.arrayToObjectHeader(request.headers);
        return this.httpClient.invoke(request)
            .then(res => {
                res.headers = this.objectToArrayHeader(res.headers);
                return res;
            });
    }
}

/**
 * @param {Object} config Configuration object
 * @param {string} config.accessToken LWA access token
 * @param {boolean} config.debug debug flag
 */
const makeSmapiClient = ({ accessToken, debug = false }) => {
    const accessTokenConfig = {
        clientId: DynamicConfig.lwaClientId,
        clientSecret: DynamicConfig.lwaClientConfirmation,
        accessToken
    };
    const authEndpoint = DynamicConfig.lwaTokenHost;
    const smapiEndpoint = DynamicConfig.smapiBaseUrl;

    const apiClient = new CustomApiClient({ debug });
    const client = new CustomSmapiClientBuilder()
        .withAuthEndpoint(authEndpoint)
        .withApiEndpoint(smapiEndpoint)
        .withApiClient(apiClient)
        .withAccessTokenConfig(accessTokenConfig)
        .withCustomUserAgent(DynamicConfig.userAgent)
        .client();

    return client;
};

module.exports = {
    makeSmapiClient
};
