const aws = require('aws-sdk');

const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');

module.exports = class AbstractAwsClient {
    constructor(configuration) {
        const { awsProfile, awsRegion } = configuration;
        if (!stringUtils.isNonBlankString(awsProfile) || !stringUtils.isNonBlankString(awsRegion)) {
            throw new Error('Invalid awsProfile or Invalid awsRegion');
        }
        if (awsProfile !== CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS) {
            aws.config.credentials = new aws.SharedIniFileCredentials({
                profile: awsProfile
            });
        }
        this.awsRegion = awsRegion;
        this.awsProfile = awsProfile;
        aws.config.region = this.awsRegion;
    }
};
