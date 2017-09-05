'use strict';

const initAWS = require('../../utils/init-aws');

module.exports = {
    retrieveLambdaFunction: retrieveLambdaFunction
};

function retrieveLambdaFunction(functionName, region, AWSProfile, callback) {
    let aws = initAWS.initAWS(AWSProfile, region);
    if (!aws) {
        return;
    }
    getLambdaFunction(aws, functionName, (err, data) => {
        if (err) {
            callback();
        } else {
            callback(data.Configuration.FunctionArn);
        }
    });
}

// Private
function getLambdaFunction(aws, functionName, callback) {
    let params = {
        FunctionName: functionName
    };
    let lambdaClient = new aws.Lambda();
    lambdaClient.getFunction(params, (err, data) => {
        callback(err, data);
    });
}
