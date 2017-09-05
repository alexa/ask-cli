'use strict';

const initAWS = require('../../utils/init-aws');
const upload = require('../../lambda/upload');
const domainRegistry = require('../../utils/domain-registry');
const retry = require('retry');
const async = require('async');
const fs = require('fs');
const clui = require('clui');


// Public
module.exports = {
    createLambda : (skillId, skillName, createLambdaList, AWSProfile, callback) => {
        let roleName = 'ask-lambda-' + skillName.replace(/_/g, '-'); // IAM role doesn't allow underbar
        let Spinner = clui.Spinner;
        let createLambdaSpinner = new Spinner(' Creating lambda function...');
        if (createLambdaList.length === 0) {
            callback();
        } else {
            createLambdaSpinner.start();
            async.each(createLambdaList, (lambdaMetaData, asyncCallback) => {
                let aws = initAWS.initAWS(AWSProfile, lambdaMetaData.region);
                if (!aws) {
                    asyncCallback('Cannot initialize aws');
                }
                createIAMRole(aws, roleName, (err, arnData) => {
                    if (err) {
                        createLambdaSpinner.stop();
                        console.error('Create role error.\n' + err);
                        asyncCallback(err);
                    }
                    attachRolePolicy(aws, roleName, (err) => {
                        if (err) {
                            createLambdaSpinner.stop();
                            console.error('Attach inline policy error.\n' + err);
                            asyncCallback(err);
                        }
                        createZip(lambdaMetaData, (err) => {
                            if (err) {
                                createLambdaSpinner.stop();
                                console.error('Read directory error.\n' + err);
                                asyncCallback(err);
                            }
                            createLambdaFunction(aws, lambdaMetaData, arnData.Role.Arn, (err, lambdaClient) => {
                                if (err) {
                                    createLambdaSpinner.stop();
                                    console.error('Create Lambda error.\n' + err);
                                    asyncCallback(err);
                                }
                                addEventSource(skillId, lambdaClient, lambdaMetaData, (err) => {
                                    if (err) {
                                        createLambdaSpinner.stop();
                                        console.error('Add event source error.\n' + err);
                                        asyncCallback(err);
                                    }
                                    asyncCallback();
                                });
                            });
                        });
                    });
                });
            }, (err) => {
                if (err) {
                    createLambdaSpinner.stop();
                    process.exit(1); // error message will show during creation
                }
                createLambdaSpinner.stop();
                callback(createLambdaList); // createLambdaList updates on the fly
            });
        }
    }
};

// Private
function createIAMRole(aws, roleName, callback) {
    let IAM = new aws.IAM();
    let params = {
        RoleName: roleName
    };
    IAM.getRole(params, (err, data) => {
        if (!err) {
            callback(null, data);
        } else {
            let policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }
                ]
            };
            params.AssumeRolePolicyDocument = JSON.stringify(policy);
            IAM.createRole(params, (err, data) => {
                callback(err, data);
            });
        }
    });
}

function attachRolePolicy(aws, roleName, callback) {
    let IAM = new aws.IAM();
    let params = {
        PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        RoleName: roleName
    };
    IAM.attachRolePolicy(params, (err, data) => {
        callback(err, data);
    });
}

function createZip(metaData, callback) {
    upload.createZip(metaData.sourceDir, (zipPath) => {
        metaData.zipPath = zipPath;
        callback();
    });
}

function createLambdaFunction(aws, metaData, roleArn, callback) {
    let lambdaClient = new aws.Lambda();
    let params = {
        Code: {
            ZipFile: fs.readFileSync(metaData.zipPath)
        },
        FunctionName: metaData.uri,
        Handler: 'index.handler',
        MemorySize: 128,
        Role: roleArn,
        Runtime: 'nodejs6.10'
    };
    let operation = retry.operation({
        retries: 3,
        minTimeout: 2 * 1000,
        maxTimeout: 8 * 1000
    });
    operation.attempt(() => {
        lambdaClient.createFunction(params, (err, functionData) => {
            if (operation.retry(err)) {
                return;
            }
            fs.unlinkSync(metaData.zipPath);
            if (err) {
                callback(err, null);
            } else {
                metaData.arn = functionData.FunctionArn;
                callback(null, lambdaClient);
            }
        });
    });
}

function addEventSource(skillId, lambdaClient, metaData, callback) {
    let params = domainRegistry.getEventSourceParams(metaData.domain, skillId);
    params.FunctionName = metaData.arn;
    lambdaClient.addPermission(params, (err) => {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}
