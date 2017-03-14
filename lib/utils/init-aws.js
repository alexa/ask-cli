'use strict';

const aws = require('aws-sdk');

module.exports.initAWS = () => {
    if (!aws.config.region) {
        aws.config.update({
            region: 'us-east-1'
        });
    }
    return aws;
};

module.exports.isLambdaArn = (arn) => {
    let lambdaArn = arn.match(/arn:aws:lambda:([a-z]{2})-([a-z]{4})([a-z]*)-\d{1}:\d*:function:/g);
    if (lambdaArn) {
        return true;
    } else {
        return false;
    }
};

module.exports.setRegionWithLambda = (aws, arn) => {
    let region = arn.match(/([a-z]{2})-([a-z]{4})([a-z]*)-\d{1}/g);
    aws.config.update({
        region: region[0]
    });
    return aws;
};
