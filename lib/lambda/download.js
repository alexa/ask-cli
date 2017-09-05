'use strict';

const initAWS = require('../utils/init-aws');
const inquirer = require('inquirer');
const AdmZip = require('adm-zip');
const https = require('https');
const async = require('async');
const sugar = require('sugar');
const clui = require('clui');
const path = require('path');
const tmp = require('tmp');
const fs = require('fs');
const profileHelper = require('../utils/profile-helper');

const LAMBDA_DISPLAY_SIZE = 25;
const LAMBDA_LIST_REQUEST_MAX = 50;

// Public
module.exports.createCommand = (commander) => {
    commander
        .command('download')
        .usage('[-f|--function <function>] [-d|--dest <dest>] [-p|--profile <profile>]')
        .description('download an existing Lambda function')
        .option('-f, --function <function>', 'download with function name')
        .option('-d, --dest <dest>', 'set the path of downloaded project')
        .option('-p, --profile <profile>', 'ask cli profile')
        .action(handle);

    function handle(options) {
        let AWSProfile = profileHelper.getAWSProfile(profileHelper.runtimeProfile(options.profile));
        if (options.function) {
            module.exports.downloadByName(options.function, options.dest, AWSProfile);
        } else {
            downloadByList(options.dest, AWSProfile);
        }
    }
};

module.exports.downloadByName = (func, dest, profile, callback) => {
    let targetPath = dest || process.cwd();
    if (!fs.existsSync(targetPath)) {
        console.warn('Please input a valid directory to store the project.');
        return;
    }
    let zipFileName = tmp.tmpNameSync({
        prefix: 'asktemp_',
        postfix: '.zip',
        dir: './'
    });
    let zipFilePath = path.join(targetPath, zipFileName);
    downloadFromLambda(func, targetPath, zipFilePath, profile, callback);
};

// Private
function downloadByList(dest, profile) {
    let aws = initAWS.initAWS(profile);
    if (!aws) {
        return;
    }
    getListOfFunctions(aws, (err, lambdaList) => {
        if (err) {
            console.error('List of functions error.\n' + err);
            return;
        }
        inquirer.prompt([{
            type: 'list',
            message: 'Select from your list of lambda functions (Sorted by LastModified)',
            pageSize: LAMBDA_DISPLAY_SIZE,
            name: 'selectedFunction',
            choices: lambdaList
        }]).then((answers) => {
            module.exports.downloadByName(answers.selectedFunction, dest, profile);
        });
    });
}

function downloadFromLambda(func, targetPath, zipFilePath, profile, callback) {
    let aws = initAWS.initAWS(profile);
    if (!aws) {
        return;
    }
    if (initAWS.isLambdaArn(func)) {
        initAWS.setRegionWithLambda(aws, func);
    }
    let lambdaClient = new aws.Lambda();
    let params = {
        FunctionName: func
    };
    let Spinner = clui.Spinner;
    let loadSpinner = new Spinner('Lambda downloading...');
    loadSpinner.start();

    lambdaClient.getFunction(params, (err, data) => {
        if (err) {
            loadSpinner.stop();
            console.error('Get Lambda function error.\n' + err);
            return;
        }
        https.get(data.Code.Location, (response) => {
            unzipLambda(response, targetPath, zipFilePath, () => {
                loadSpinner.stop();
                console.log('    ' + func + ' download finished.');
                if (typeof callback === 'function' && callback) {
                    callback();
                }
            });
        });
    });
}

function unzipLambda(response, targetPath, zipFilePath, callback) {
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
    }
    let zipWriteStream = fs.createWriteStream(zipFilePath);
    let stream = response.pipe(zipWriteStream);
    stream.on('close', () => {
        let zip = new AdmZip(zipFilePath);
        zip.extractAllTo(targetPath, true);
        fs.unlinkSync(zipFilePath);
        callback();
    });
}

function getListOfFunctions(aws, callback) {
    let pageMarker = '';
    let dataStore = [];
    let lambdaClient = new aws.Lambda();
    let param = {
        MaxItems: LAMBDA_LIST_REQUEST_MAX
    };

    async.doWhilst(
        (loopCallback) => {
            lambdaClient.listFunctions(param, (err, data) => {
                if (err) {
                    loopCallback(err, null);
                    return;
                }
                dataStore = dataStore.concat(defineListFormat(data));
                pageMarker = data.NextMarker;
                loopCallback(null, dataStore);
            });
        },
        () => {
            param.Marker = pageMarker;
            return pageMarker !== null;
        },
        (err, data) => {
            callback(err, sortListByLastModified(data));
        }
    );
}

function defineListFormat(data) {
    let functionNameArray = data.Functions.map((func) => {
        return {
            FunctionName: func.FunctionName,
            LastModified: func.LastModified
        };
    });
    return functionNameArray;
}

function sortListByLastModified(list) {
    let sortedList = list.sort((one, another) => {
        let dateOne = new sugar.Date(one.LastModified).raw.getTime();
        let dateAnother = new sugar.Date(another.LastModified).raw.getTime();
        return dateAnother - dateOne;
    });
    let result = sortedList.map((element) => {
        return element.FunctionName;
    });
    return result;
}
