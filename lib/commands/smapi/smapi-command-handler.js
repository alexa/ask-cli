const { CustomSmapiClientBuilder } = require('ask-smapi-sdk');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const R = require('ramda');

const AppConfig = require('@src/model/app-config');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');
const { resolveProviderChain } = require('@src/utils/provider-chain-utils');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');
const unflatten = require('@src/utils/unflatten');
const { getParamNames, standardize } = require('@src/utils/string-utils');

const BeforeSendProcessor = require('./before-send-processor');
const { BODY_PATH_DELIMITER, ARRAY_SPLIT_DELIMITER } = require('./cli-customization-processor');

const configFilePath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER, CONSTANTS.FILE_PATH.ASK.PROFILE_FILE);

const _mapToArgs = (params, paramsObject) => {
    const res = [];
    params.forEach(param => {
        let value = null;
        Object.keys(paramsObject).forEach(k => {
            if (standardize(k) === standardize(param)) {
                value = paramsObject[k];
            }
        });
        res.push(value);
    });
    return res;
};

const _loadJson = (value) => {
    const filePrefix = 'file:';
    let json;
    if (value.startsWith(filePrefix)) {
        const filePath = value.split(filePrefix).pop();
        json = fs.readJSONSync(filePath);
    } else {
        json = JSON.parse(value);
    }
    return json;
};

const _loadValue = (param, value) => (param.json ? _loadJson(value) : value);

const _mapToParams = (optionsValues, flatParamsMap, commanderToApiCustomizationMap) => {
    const res = {};
    Object.keys(optionsValues).forEach(key => {
        const apiName = commanderToApiCustomizationMap.get(key) || key;
        const param = flatParamsMap.get(standardize(apiName));
        if (param) {
            let value = optionsValues[key];
            value = param.isArray ? value.split(ARRAY_SPLIT_DELIMITER) : value;
            value = param.isNumber ? Number(value) : value;
            value = param.isBoolean ? Boolean(value) : value;
            if (param.rootName) {
                if (!res[param.rootName]) {
                    res[param.rootName] = {};
                }
                let mergeObject = {};
                mergeObject[param.bodyPath] = _loadValue(param, value);
                mergeObject = unflatten(mergeObject, BODY_PATH_DELIMITER);
                res[param.rootName] = R.mergeDeepRight(res[param.rootName], mergeObject);
            } else {
                res[param.name] = _loadValue(param, value);
            }
        }
    });
    return res;
};

const _sdkFunctionName = (swaggerApiOperationName) => `call${swaggerApiOperationName.charAt(0).toUpperCase() + swaggerApiOperationName.slice(1)}`;

/**
 * Handles smapi command request
 * @param {string} swaggerApiOperationName Swagger operation name.
 * @param {Array} swaggerParams Parameters for operation from the Swagger model.
 * @param {Map} flatParamsMap Flattened parameters.
 * @param {Map} commanderToApiCustomizationMap Map of commander options to custom options
 * for api properties.
 * @param {Boolean} doDebug
 * @param {Object} cmdObj Commander object with passed values.
 */
const smapiCommandHandler = (swaggerApiOperationName, flatParamsMap, commanderToApiCustomizationMap, inputCmdObj, modelIntrospector) => {
    new AppConfig(configFilePath);
    const inputOpts = inputCmdObj.opts();
    const authorizationController = new AuthorizationController({
        auth_client_type: 'LWA',
        doDebug: inputOpts.debug
    });
    const profile = profileHelper.runtimeProfile(inputOpts.profile);
    const refreshTokenConfig = {
        clientId: authorizationController.oauthClient.config.clientId,
        clientSecret: authorizationController.oauthClient.config.clientConfirmation,
        refreshToken: AppConfig.getInstance().getToken(profile).refresh_token
    };
    const authEndpoint = resolveProviderChain([process.env.ASK_LWA_TOKEN_HOST, CONSTANTS.LWA.DEFAULT_TOKEN_HOST]);
    const smapiEndpoint = resolveProviderChain([process.env.ASK_SMAPI_SERVER_BASE_URL, CONSTANTS.SMAPI.ENDPOINT]);

    const client = new CustomSmapiClientBuilder()
        .withAuthEndpoint(authEndpoint)
        .withApiEndpoint(smapiEndpoint)
        .withRefreshTokenConfig(refreshTokenConfig)
        .client();

    const paramsObject = _mapToParams(inputOpts, flatParamsMap, commanderToApiCustomizationMap);

    const beforeSendProcessor = new BeforeSendProcessor(inputCmdObj._name, paramsObject, modelIntrospector, profile);
    beforeSendProcessor.processAll();

    const functionName = _sdkFunctionName(swaggerApiOperationName);
    const params = getParamNames(client[functionName]);
    const args = _mapToArgs(params, paramsObject);

    if (inputOpts.debug) {
        const payload = {};
        params.forEach((k, i) => {
            payload[k] = args[i];
        });
        Messenger.getInstance().info(`Operation: ${swaggerApiOperationName}`);
        Messenger.getInstance().info('Payload:');
        Messenger.getInstance().info(`${jsonView.toString(payload)}\n`);
    }

    return client[functionName](...args)
        .then(response => {
            const { body, headers, statusCode } = response;
            let result = '';
            if (inputOpts.debug) {
                Messenger.getInstance().info(`Status code: ${statusCode}`);
                Messenger.getInstance().info(`Response headers: ${jsonView.toString(headers)}`);
                Messenger.getInstance().info(`Response body: ${jsonView.toString(body)}`);
            } else {
                result = body && Object.keys(body).length ? jsonView.toString(body) : 'Command executed successfully!';
            }
            return result;
        });
};

module.exports = smapiCommandHandler;
