const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');
const retryUtils = require('@src/utils/retry-utility');
const jsonView = require('@src/view/json-view');

module.exports = {
    pollingSkillStatus,
    handleSkillStatus
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
