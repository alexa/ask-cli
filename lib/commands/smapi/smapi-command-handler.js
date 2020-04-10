const { StandardSmapiClientBuilder } = require('ask-smapi-sdk');
const os = require('os');
const path = require('path');

const AppConfig = require('@src/model/app-config');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');
const unflatten = require('@src/utils/unflatten');
const { getParamNames } = require('@src/utils/string-utils');

const { BODY_PATH_DELIMITER, ARRAY_SPLIT_DELIMITER } = require('./cli-customization-processor');
const SmapiHooks = require('./customizations/smapi-hooks');

const configFilePath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER, CONSTANTS.FILE_PATH.ASK.PROFILE_FILE);

const _mapToArgs = (params, paramsObject) => {
    const res = [];
    params.forEach(param => {
        let value = null;
        Object.keys(paramsObject).forEach(k => {
            if (k.toLowerCase() === param.toLowerCase()) {
                value = paramsObject[k];
            }
        });
        res.push(value);
    });
    return res;
};

const _mapToParams = (optionsValues, flatParamsMap, commanderToApiCustomizationMap) => {
    const res = {};
    Object.keys(optionsValues).forEach(key => {
        const apiName = commanderToApiCustomizationMap.get(key) || key;
        const param = flatParamsMap.get(apiName);
        if (param) {
            const value = param.isArray ? optionsValues[key].split(ARRAY_SPLIT_DELIMITER) : optionsValues[key];
            if (param.rootName) {
                if (!res[param.rootName]) {
                    res[param.rootName] = {};
                }
                let mergeObject = {};
                mergeObject[param.bodyPath] = value;
                mergeObject = unflatten(mergeObject, BODY_PATH_DELIMITER);
                Object.assign(res[param.rootName], mergeObject);
            } else if (param.json) {
                res[param.name] = JSON.parse(value);
            } else {
                res[param.name] = value;
            }
        }
    });
    return res;
};

/**
 * Handles smapi command request
 * @param {string} swaggerApiOperationName Swagger operation name.
 * @param {Array} swaggerParams Parameters for operation from the Swagger model.
 * @param {Map} flatParamsMap Flattened parameters.
 * @param {Map} commanderToApiCustomizationMap Map of commander options to custom options
 * for api properties.
 * @param {Object} cmdObj Commander object with passed values.
 */
const smapiCommandHandler = (swaggerApiOperationName, flatParamsMap, commanderToApiCustomizationMap, inputCmdObj) => {
    new AppConfig(configFilePath);
    const authorizationController = new AuthorizationController({
        auth_client_type: 'LWA'
    });
    const inputOpts = inputCmdObj.opts();
    const profile = profileHelper.runtimeProfile(inputOpts.profile);
    const refreshTokenConfig = {
        clientId: authorizationController.oauthClient.config.clientId,
        clientSecret: authorizationController.oauthClient.config.clientConfirmation,
        refreshToken: AppConfig.getInstance().getToken(profile).refresh_token
    };
    const client = new StandardSmapiClientBuilder()
        .withRefreshTokenConfig(refreshTokenConfig)
        .client();

    const paramsObject = _mapToParams(inputOpts, flatParamsMap, commanderToApiCustomizationMap);

    const beforeSendHook = SmapiHooks.getFunction(swaggerApiOperationName, SmapiHooks.hookEvents.BEFORE_SEND);
    if (beforeSendHook) {
        beforeSendHook(paramsObject, profile);
    }
    // TODO revisit with debug flow
    if (inputOpts.debug) {
        Messenger.getInstance().info(`Operation: ${swaggerApiOperationName}`);
        Messenger.getInstance().info('Payload:');
        Messenger.getInstance().info(jsonView.toString(paramsObject));
    }
    const params = getParamNames(client[swaggerApiOperationName]);
    const args = _mapToArgs(params, paramsObject);
    return client[swaggerApiOperationName](...args);
};

module.exports = smapiCommandHandler;
