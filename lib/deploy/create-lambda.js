'use strict';

const initAWS = require('../utils/init-aws');
const domainRegistry = require('../utils/domain-registry');
const upload = require('../lambda/upload');
const clui = require('clui');
const path = require('path');
const retry = require('retry');
const async = require('async');
const fs = require('fs');

// Public
module.exports = {
    create: (skillName, skillId, skillInfo, createList, writeCallback) => {
        let aws = initAWS.initAWS();
        if (!aws) {
            return;
        }
        let roleName = 'ask-lambda-' + skillName.replace(/_/g, '-'); // IAM role doesn't allow underbar
        console.log('Creating Lambda function...');

        let Spinner = clui.Spinner;
        let createRoleSpinner = new Spinner(' Creating IAM role...');
        createRoleSpinner.start();
        createIAMRole(aws, roleName, (err, arnData) => {
            if (err) {
                createRoleSpinner.stop();
                console.error('Create role error.\n' + err);
                return;
            }
            attachRolePolicy(aws, roleName, (err) => {
                createRoleSpinner.stop();
                if (err) {
                    console.error('Attach inline policy error.\n' + err);
                    return;
                }
                console.log('    IAM role for ' + roleName + ' created.');
                prepareForUpload(createList, (err, domainZipPair) => {
                    if (err) {
                        console.error('Read directory error.\n' + err);
                        return;
                    }
                    let createLambdaSpinner = new Spinner(' Creating Lambda function...');
                    createLambdaSpinner.start();
                    createLambdaFunction(aws, skillName, skillId, domainZipPair, arnData.Role.Arn, (err, skillInfoToCreate) => {
                        createLambdaSpinner.stop();
                        if (err) {
                            console.error('Create Lambda error.\n' + err);
                            return;
                        }
                        Object.keys(skillInfoToCreate).forEach((domain) => {
                            console.log('    Lambda ARN: ' + skillInfoToCreate[domain].url);
                        });
                        console.log();
                        writeCallback(skillInfoToCreate);
                    });
                });
            });
        });
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

function prepareForUpload(createList, callback) {
    let domainZipPair = [];
    async.each(createList, (domain, prepareCallback) => {
        let lambdaPath = path.join(process.cwd(), 'lambda', domain);
        upload.createZip(lambdaPath, (zipPath) => {
            domainZipPair.push({
                domain: domain,
                zip: zipPath
            });
            prepareCallback();
        });
    }, () => {
        callback(null, domainZipPair);
    });
}

function createLambdaFunction(aws, skillName, skillId, domainZipPair, roleArn, callback) {
    let lambdaClient = new aws.Lambda();
    let skillInfoToCreate = {};
    async.each(domainZipPair, (pair, createLambdaCallback) => {
        let params = {
            Code: {
                ZipFile: fs.readFileSync(pair.zip)
            },
            FunctionName: 'ask-' + pair.domain + '-' + skillName,
            Handler: 'index.handler',
            MemorySize: 128,
            Role: roleArn,
            Runtime: 'nodejs4.3'
        };
        let operation = retry.operation({
            retries: 3,
            minTimeout: 1 * 1000,
            maxTimeout: 8 * 1000
        });
        operation.attempt(() => {
            lambdaClient.createFunction(params, (err, functionData) => {
                if (operation.retry(err)) {
                    return;
                }
                fs.unlinkSync(pair.zip);
                if (err) {
                    callback(err, null);
                } else {
                    skillInfoToCreate[pair.domain] = {
                        url: functionData.FunctionArn,
                        name: functionData.FunctionName
                    };
                    createLambdaCallback();
                }
            });
        });
    }, () => {
        addEventSource(lambdaClient, skillId, skillInfoToCreate, callback);
    });
}

function addEventSource(lambdaClient, skillId, skillInfoToCreate, callback) {
    async.each(Object.keys(skillInfoToCreate), (domain, eventSourceCallBack) => {
        let params = domainRegistry.getEventSourceParams(domain);
        params.FunctionName = skillInfoToCreate[domain].name;
        lambdaClient.addPermission(params, (err) => {
            if (err) {
                eventSourceCallBack(err);
            } else {
                eventSourceCallBack(false);
            }
        });
    }, (error) => {
        if (error) {
            callback(error, null);
        } else {
            callback(null, skillInfoToCreate);
        }
    });
}
