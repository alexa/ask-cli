'use strict';

const template = require('../utils/template');
const initAWS = require('../utils/init-aws');
const tools = require('../utils/tools');
const upload = require('../lambda/upload');
const installNodeModule = require('../new/install-node-module');
const Spinner = require('clui').Spinner;
const path = require('path');
const retry = require('retry');
const fs = require('fs');

// Public
module.exports = {
    create: (skillName, skillType, skillId, writeCallback) => {
        let aws = initAWS.initAWS();
        if (!aws) {
            return;
        }
        if (['smarthome', 'custom'].indexOf(skillType) === -1) {
            writeCallback();
            return;
        }
        console.log('Creating Lambda function...');
        let roleName = 'ask-lambda-' + skillName.replace(/_/g, '-'); // IAM role doesn't allow underbar
        let createLambdaSpinner = new Spinner(' Creating Lambda function...');
        createLambdaSpinner.start();
        createIAMRole(aws, roleName, (err, arnData) => {
            if (err) {
                createLambdaSpinner.stop();
                console.error('Get policy error.\n' + err);
                return;
            }
            attachRolePolicy(aws, roleName, (err) => {
                if (err) {
                    createLambdaSpinner.stop();
                    console.error('Attach inline policy error.\n' + err);
                    return;
                }
                createLambdaFunction(skillName, skillId, skillType, aws, arnData.Role.Arn, (err, lambdaData) => {
                    createLambdaSpinner.stop();
                    if (err) {
                        console.error('Create Lambda error.\n' + err);
                        return;
                    }
                    console.log('    Lambda ARN: ' + lambdaData.FunctionArn + '\n');
                    writeCallback(lambdaData);
                });
            });
        });
    }
};

// Private
function createIAMRole(aws, roleName, callback) {
    let IAM = new aws.IAM();
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
    let params = {
        AssumeRolePolicyDocument: JSON.stringify(policy),
        RoleName: roleName
    };
    IAM.createRole(params, (err, data) => {
        callback(err, data);
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

function createLambdaFunction(skillName, skillId, skillType, aws, roleArn, callback) {
    let lambdaPath = path.join(process.cwd(), 'lambda', skillType);
    addTemplateWhenEmpty(lambdaPath, () => {
        let lambdaClient = new aws.Lambda();
        upload.createZip((lambdaPath), (zipPath) => {
            let params = {
                Code: {
                    ZipFile: fs.readFileSync(zipPath)
                },
                FunctionName: 'ask-' + skillType + '-' + skillName,
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
                    fs.unlinkSync(zipPath);
                    if (err) {
                        callback(err, null);
                    } else {
                        addEventSource(lambdaClient, skillId, skillType, functionData, callback);
                    }
                });
            });
        });
    });
}

function addEventSource(lambdaClient, skillId, skillType, functionData, callback) {
    let params = {
        Action: 'lambda:InvokeFunction',
        FunctionName: functionData.FunctionName,
        StatementId: tools.generateSID()
    };
    if (skillType === 'custom') {
        params.Principal = 'alexa-appkit.amazon.com';
    } else if (skillType === 'smarthome') {
        params.Principal = 'alexa-connectedhome.amazon.com';
        params.EventSourceToken = skillId;
    }
    lambdaClient.addPermission(params, (err) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, functionData);
        }
    });
}

function addTemplateWhenEmpty(lambdaPath, callback) {
    fs.readdir(lambdaPath, (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        if (data.length === 0) {
            template.copyLambda(lambdaPath);
            installNodeModule.install(lambdaPath, false, () => {
                callback();
            });
        } else {
            callback();
        }
    });

}
