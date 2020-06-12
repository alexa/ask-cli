const CONSTANTS = require('@src/utils/constants');
const jsonView = require('@src/view/json-view');
const Retry = require('@src/utils/retry-utility');

module.exports = {
    pollExportStatus
};

/**
 * Wrapper for polling smapi skill package export status.
 * @param {String} exportId
 * @param {Function} callback (err, lastExportStatus)
 */
function pollExportStatus(smapiClient, exportId, callback) {
    const retryConfig = {
        base: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.MIN_TIME_OUT,
        factor: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.FACTOR,
        maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.MAX_RETRY
    };
    const retryCall = (loopCallback) => {
        smapiClient.skillPackage.getExportStatus(exportId, (pollErr, pollResponse) => {
            if (pollErr) {
                return loopCallback(pollErr);
            }
            if (pollResponse.statusCode >= 300) {
                return loopCallback(jsonView.toString(pollResponse.body));
            }
            loopCallback(null, pollResponse);
        });
    };
    const shouldRetryCondition = retryResponse => retryResponse.body.status === CONSTANTS.SKILL.PACKAGE_STATUS.IN_PROGRESS;
    Retry.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
}
