const url = require('@src/utils/url-utils');

module.exports = {
    REQUEST_AUTHORIZATION_URL: {
        type: 'input',
        name: 'authorizationUrl',
        message: 'Authorization URL: ',
        validate: (input) => {
            if (!url.isHttpsUrl(input)) {
                return 'Please input valid https Url';
            }
            return true;
        }
    },
    REQUEST_CLIENT_ID: {
        type: 'input',
        name: 'clientId',
        message: 'Client ID: '
    },
    REQUEST_SCOPES: {
        type: 'input',
        name: 'scopes',
        message: 'Scopes(separate by comma): '
    },
    REQUEST_DOMAINS: {
        type: 'input',
        name: 'domains',
        message: 'Domains(separate by comma): '
    },
    CONFIRM_SKIP_ON_ENABLEMENT: {
        type: 'confirm',
        name: 'skipOnEnablement',
        message: 'Allow users to enable skill without account linking: '
    },
    SELECT_AUTHORIZATION_GRANT_TYPE: {
        type: 'list',
        name: 'type',
        message: 'Authorization Grant Type: ',
        choices: [
            'AUTH_CODE',
            'IMPLICIT'
        ]
    },
    REQUEST_ACCESS_TOKEN_URL: {
        type: 'input',
        name: 'accessTokenUrl',
        message: 'Access Token URL: ',
        validate: (input) => {
            if (!url.isHttpsUrl(input)) {
                return 'Please input valid https Url';
            }
            return true;
        }
    },
    REQUEST_CLIENT_SECRET: {
        type: 'password',
        name: 'clientSecret',
        message: 'Client Secret: ',
        validate: (input) => {
            if (!input.trim()) {
                return '"Client Secret" cannot be empty.';
            }
            return true;
        }
    },
    SELECT_ACCESS_TOKEN_SCHEME: {
        type: 'list',
        name: 'accessTokenScheme',
        message: 'Client Authentication Scheme: ',
        choices: [
            'HTTP_BASIC',
            'REQUEST_BODY_CREDENTIALS'
        ]
    },
    REQUEST_DEFAULT_TOKEN_EXPIRATION_IN_SECONDS: {
        type: 'input',
        name: 'defaultTokenExpirationInSeconds',
        message: 'Optional* Default Access Token Expiration Time In Seconds: ',
        validate: (input) => {
            try {
                // no input is ok
                if (!input.trim()) {
                    return true;
                }

                // test if input can be transformed into an integer
                const result = parseInt(input, 10);
                if (Number.isNaN(result)) {
                    return 'Token expiration time should be an integer.';
                }

                // the integer has to be greater than 0
                if (result < 0) {
                    return 'Token expiration time cannot be set to a value less than 0.';
                }
                return true;
            } catch (e) {
                // in some cases, parseInt with string will throw error instead of NaN.
                return 'defaultTokenExpirationInSeconds can only be an integer.';
            }
        }
    }
};
