const async = require('async');

module.exports = {
    retry
};

/**
 * Retry logic for the ASK CLI.
 * The function computes a retry interval based on retry configurations - base, factor and an optional maxRetry.
 * The function can be used for polling as well as retry scenarios.
 * @param retryConfig: Captures the retry configuration - base, factor, pollcount and maxRetry.
 * @param retryCall: Calling function defines a retry call that is invoked in each retry attempt.
 * @param shouldRetryCondition - The calling function can define a shouldRetryCondition function: return true to keep retry and false to stop
 * @param callback - The callback function returns either error or error and response from the last retry.
 * leads to the termination of the while loop in the retry logic.
 */
function retry(retryConfig, retryCall, shouldRetryCondition, callback) {
    let lastResponse;
    if (!retryConfig) {
        return callback('[Error]: Invalid retry configuration. Retry configuration with values - base, factor and maxRetry needs to be specified');
    }
    if (!retryConfig.base || retryConfig.base < 0) {
        return callback('[Error]: Invalid retry configuration: base. Base is a required configuration and its value needs to be greater than 0');
    }
    if (!retryConfig.factor || retryConfig.factor < 0) {
        return callback('[Error]: Invalid retry configuration: factor. Factor is a required configuration and its value needs to be greater than 0');
    }
    if (!retryConfig.maxRetry) {
        return callback('[Error]: Invalid retry configuration: maxRetry. '
            + 'MaxRetry is a required configuration and its value needs to be greater than 0');
    }
    if (!(Number.isInteger(retryConfig.maxRetry) && retryConfig.maxRetry > 0)) {
        return callback('[Error]: Invalid retry configuration: maxRetry. Value needs to be an integer and greater than 0');
    }
    let pollCount = -1;
    async.doWhilst(
        (loopCallback) => {
            let retryInterval = retryConfig.base * (Math.pow(retryConfig.factor, pollCount++));
            // The very first call is not a retry and hence should not be penalised with a timeout.
            if (pollCount === 0) {
                retryInterval = 0;
            }
            setTimeout(
                () => {
                    retryCall((err, res) => {
                        lastResponse = res;
                        loopCallback(err, err ? null : res);
                    });
                },
                retryInterval
            );
        },
        () => {
            if (!retryConfig.maxRetry || retryConfig.maxRetry > pollCount) {
                return shouldRetryCondition(lastResponse);
            }
            return false;
        },
        (err, res) => {
            if (retryConfig.maxRetry && retryConfig.maxRetry <= pollCount) {
                return callback('[Error]: Retry attempt exceeded.', res);
            }
            callback(err, err ? null : res);
        }
    );
}
