'use strict';

const aws = require('aws-sdk');

const REGION_MAPPING = {
    'NA' : 'us-east-1',
    'EU' : 'eu-west-1'
};

module.exports = {
    initAWS: initAWS,
    isLambdaArn: isLambdaArn,
    setRegionWithLambda: setRegionWithLambda
};

function initAWS(aws_profile, region) {
    if (!aws_profile) {
        console.error('[Error]: AWS credentials are not found in current profile.');
        process.exit(1);
    }
    aws.config.credentials =
        new aws.SharedIniFileCredentials({
            profile: aws_profile
        });
    if (region) {
        aws.config.update({
            region: REGION_MAPPING[region]
        });
    }
    if (!aws.config.region) {
        aws.config.update({
            region: 'us-east-1'
        });
    }
    return aws;
}

function isLambdaArn(arn) {
    let lambdaArn = arn.match(/arn:aws:lambda:([a-z]{2})-([a-z]{4})([a-z]*)-\d{1}:\d*:function:/g);
    if (lambdaArn) {
        return true;
    } else {
        return false;
    }
}

function setRegionWithLambda(aws, arn) {
    let region = arn.match(/([a-z]{2})-([a-z]{4})([a-z]*)-\d{1}/g);
    aws.config.update({
        region: region[0]
    });
    return aws;
}
