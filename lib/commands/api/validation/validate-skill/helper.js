const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SpinnerView = require('@src/view/spinner-view');
const CONSTANTS = require('@src/utils/constants');
const Retry = require('@src/utils/retry-utility');

module.exports = {
    pollingSkillValidationResult,
    _keepPollingSkillValidationResult
};

function pollingSkillValidationResult(smapiClient, skillId, validationId, stage, callback) {
    const listenSpinner = new SpinnerView();
    listenSpinner.start('Waiting for the validation response:');

    _keepPollingSkillValidationResult(smapiClient, skillId, validationId, stage, (err, response) => {
        listenSpinner.terminate();
        callback(err, response);
    });
}

function _keepPollingSkillValidationResult(smapiClient, skillId, validationId, stage, callback) {
    const retryConfig = {
        factor: CONSTANTS.CONFIGURATION.RETRY.VALIDATE_SKILL_STATUS.FACTOR,
        maxRetry: CONSTANTS.CONFIGURATION.RETRY.VALIDATE_SKILL_STATUS.MAX_RETRY,
        base: CONSTANTS.CONFIGURATION.RETRY.VALIDATE_SKILL_STATUS.MIN_TIME_OUT
    };
    const retryCall = (loopCallback) => {
        smapiClient.skill.getValidation(skillId, stage, validationId, (pollErr, pollResponse) => {
            if (pollErr) {
                return loopCallback(pollErr);
            }
            if (!pollResponse) {
                const err = new Error('[Error]: Invalid response for skill validation');
                Messenger.getInstance().error(err);
                return loopCallback(err);
            }
            if (pollResponse.statusCode >= 300) {
                return loopCallback(jsonView.toString(pollResponse.body));
            }
            loopCallback(null, pollResponse);
        });
    };

    const terminateCondition = retryResponse => !retryResponse.status || retryResponse.status === CONSTANTS.SKILL.VALIDATION_STATUS.SUCCESS
            || retryResponse.status === CONSTANTS.SKILL.VALIDATION_STATUS.FAILURE;

    Retry.retry(retryConfig, retryCall, terminateCondition, (err, res) => {
        if (err) {
            return callback(err);
        }
        if (!res.status) {
            return callback(`[Error]: Unable to get skill validation result for validation id: ${validationId}`);
        }
        return callback(null, res);
    });
}
