const fs = require('fs-extra');
const md5 = require('md5-file');
const R = require('ramda');
const requestLib = require('request');

const CliError = require('@src/exceptions/cli-error');
const CONSTANTS = require('@src/utils/constants');
const retryUtils = require('@src/utils/retry-utility');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');

module.exports = {
    pollingSkillStatus,
    handleSkillStatus,
    checkScript,
    downloadScriptFromS3
};

const AMAZONAWS_COM = 'amazonaws.com';
const RETRY_OPTION = {
    base: 500,
    factor: 1.1,
    maxRetry: 5
};

function pollingSkillStatus(smapiClient, skillId, callback) {
    const retryConfig = {
        base: 1000,
        factor: 1.2,
        maxRetry: 30
    };
    const RESOURCE_LIST = [CONSTANTS.SKILL.RESOURCES.MANIFEST,
        CONSTANTS.HOSTED_SKILL.RESOURCES.PROVISIONING,
        CONSTANTS.SKILL.RESOURCES.INTERACTION_MODEL];
    const retryCall = (loopCallback) => {
        smapiClient.skill.getSkillStatus(skillId, RESOURCE_LIST, (statusErr, statusResponse) => {
            if (statusErr) {
                return loopCallback(statusErr);
            }
            if (statusResponse.statusCode >= 300) {
                return loopCallback(jsonView.toString(statusResponse.body));
            }
            loopCallback(null, statusResponse);
        });
    };
    const statusTracker = {
        manifest: {},
        interactionModel: {},
        hostedSkillProvisioning: {}
    };
    const shouldRetryCondition = (retryResponse) => {
        const response = retryResponse.body;
        statusTracker.manifest = R.view(R.lensPath([CONSTANTS.HOSTED_SKILL.RESOURCES.MANIFEST, 'lastUpdateRequest', 'status']), response);
        if (response[CONSTANTS.HOSTED_SKILL.RESOURCES.INTERACTION_MODEL]) {
            const locale = Object.keys(response[CONSTANTS.HOSTED_SKILL.RESOURCES.INTERACTION_MODEL])[0];
            statusTracker.interactionModel = R.view(R.lensPath([CONSTANTS.HOSTED_SKILL.RESOURCES.INTERACTION_MODEL, locale,
                'lastUpdateRequest', 'status']), response);
        }
        if (response[CONSTANTS.HOSTED_SKILL.RESOURCES.INTERACTION_MODEL]) {
            statusTracker.hostedSkillProvisioning = R.view(R.lensPath([CONSTANTS.HOSTED_SKILL.RESOURCES.PROVISIONING,
                'lastUpdateRequest', 'status']), response);
        }
        return !statusTracker.manifest || !statusTracker.interactionModel || !statusTracker.hostedSkillProvisioning
            || !(statusTracker.manifest === CONSTANTS.HOSTED_SKILL.MANIFEST_STATUS.SUCCESS
                && statusTracker.interactionModel === CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.SUCCESS
                && statusTracker.hostedSkillProvisioning === CONSTANTS.HOSTED_SKILL.PROVISIONING_STATUS.SUCCESS);
    };
    retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, err => callback(err, err ? null : statusTracker));
}

function handleSkillStatus(response, skillId, callback) {
    if (!response) {
        return callback('Response from the creation of hosted skill is not valid.');
    }
    if (response.hostedSkillProvisioning === CONSTANTS.HOSTED_SKILL.PROVISIONING_STATUS.SUCCESS
        && response.interactionModel === CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.SUCCESS
        && response.manifest === CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.SUCCESS) {
        callback(null, skillId);
    } else if (response.hostedSkillProvisioning === CONSTANTS.HOSTED_SKILL.PROVISIONING_STATUS.IN_PROGRESS
        || response.interactionModel === CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.IN_PROGRESS
        || response.manifest === CONSTANTS.HOSTED_SKILL.MANIFEST_STATUS.IN_PROGRESS) {
        callback('Timeout when checking the status of hosted-skill creation. Please try again.');
    } else {
        const errMessage = 'Check skill status failed for the following reason:\n';
        let errReason = '';
        if (response.hostedSkillProvisioning === CONSTANTS.HOSTED_SKILL.PROVISIONING_STATUS.FAILURE) {
            errReason = errReason.concat('Skill provisioning step failed.\n');
        }
        if (response.interactionModel === CONSTANTS.HOSTED_SKILL.INTERACTION_MODEL_STATUS.FAILURE) {
            errReason = errReason.concat('Skill interaction model building step failed\n');
        }
        if (response.manifest === CONSTANTS.HOSTED_SKILL.MANIFEST_STATUS.FAILURE) {
            errReason = errReason.concat('Skill manifest building step failed\n');
        }
        callback(`${errMessage}${errReason}Infrastructure provision for the hosted skill failed. Please try again.`);
    }
}

function checkScript(scriptUrl, filePath, callback) {
    if (!fs.existsSync(filePath)) {
        return this.downloadScriptFromS3(scriptUrl, filePath, (err) => callback(err || null));
    }
    isScriptUpdated(scriptUrl, filePath, (err, isUpdated) => {
        if (err) {
            return callback(err);
        }
        if (!isUpdated) {
            return callback(null);
        }
        this.downloadScriptFromS3(scriptUrl, filePath, (downloadErr) => callback(downloadErr || null));
    });
}

function isScriptUpdated(scriptUrl, filePath, callback) {
    if (scriptUrl.indexOf(AMAZONAWS_COM) === -1) {
        Messenger.getInstance().warn(`'${scriptUrl}' is not a valid S3 object URL.`);
        return callback(null, false);
    }
    retrieveMetadataOfS3Script(scriptUrl, (err, metadata) => {
        if (err) {
            return callback(err);
        }
        if (!('etag' in metadata)) {
            Messenger.getInstance().warn(`The script '${scriptUrl}' is not public or not found.`);
            return callback(null, false);
        }
        const remoteEtag = metadata.etag.replace(/"/g, '');
        const localEtag = md5.sync(filePath);
        return callback(null, remoteEtag !== localEtag);
    });
}

function retrieveMetadataOfS3Script(scriptUrl, callback) {
    const params = {
        url: scriptUrl,
        method: CONSTANTS.HTTP_REQUEST.VERB.HEAD
    };
    const retryCall = (loopCallback) => {
        requestLib(params, (error, response) => {
            if (error) {
                return loopCallback(new CliError(error));
            }
            return loopCallback(null, response.headers);
        });
    };
    const shouldRetryCondition = (retryResponse => !retryResponse);
    retryUtils.retry(RETRY_OPTION, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
}

function downloadScriptFromS3(scriptUrl, filePath, callback) {
    const params = {
        url: scriptUrl,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET
    };
    const DOWNLOADED = 'downloaded';
    const retryCall = (loopCallback) => {
        requestLib(params).pipe(fs.createWriteStream(filePath))
            .on('error', (err) => {
                loopCallback(new Error(err));
            })
            .on('finish', () => {
                fs.chmodSync(filePath, '777');
                loopCallback(null, DOWNLOADED);
            });
    };
    const shouldRetryCondition = retryResponse => retryResponse !== DOWNLOADED;
    retryUtils.retry(RETRY_OPTION, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
}
