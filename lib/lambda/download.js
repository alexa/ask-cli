'use strict';

const initAWS = require('../utils/init-aws');
const inquirer = require('inquirer');
const AdmZip = require('adm-zip');
const https = require('https');
const clui = require('clui');
const path = require('path');
const tmp = require('tmp');
const fs = require('fs');

// Public
module.exports.createCommand = (commander) => {
    commander
        .command('download')
        .description('download lambda functions')
        .option('-f, --function <function>', 'download with function name')
        .option('-d, --dest <dir>', 'set the path of downloaded project')
        .action(handle);

    function handle(options) {
        if (options.function) {
            module.exports.downloadByName(options.function, options.dest);
        } else {
            downloadByList(options.dest);
        }
    }
};

module.exports.downloadByName = (func, dest) => {
    let targetPath = dest || process.cwd();
    if (!fs.existsSync(targetPath)) {
        console.warn('Please input a valid directory to store the project.');
    } else {
        let zipFileName = tmp.tmpNameSync({
            prefix: 'asktemp_',
            postfix: '.zip',
            dir: './'
        });
        let zipFilePath = path.join(targetPath, zipFileName);
        downloadFromLambda(func, targetPath, zipFilePath);
    }
};

// Private
function downloadByList(dest) {
    let aws = initAWS.initAWS();
    if (!aws) {
        return;
    }
    let lambdaClient = new aws.Lambda();
    let param = {
        MaxItems: 50
    };
    lambdaClient.listFunctions(param, (err, data) => {
        if (err) {
            console.error('List of functions error.\n' + err);
        } else {
            let functionNameArray = data.Functions.map((func) => {
                return func.FunctionName;
            });
            inquirer.prompt([{
                type: 'rawlist',
                message: 'Select from your list of lambda functions',
                pageSize: 50,
                name: 'selectedFunction',
                choices: functionNameArray
            }]).then((answers) => {
                module.exports.downloadByName(answers.selectedFunction, dest);
            });
        }
    });
}

function downloadFromLambda(func, targetPath, zipFilePath) {
    let aws = initAWS.initAWS();
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
    let loadSpinner = new Spinner(func + ' downloading...');
    loadSpinner.start();

    lambdaClient.getFunction(params, (err, data) => {
        if (err) {
            loadSpinner.stop();
            console.error('Get lambda function error.\n' + err);
        } else {
            https.get(data.Code.Location, (response) => {
                unzipLambda(response, targetPath, zipFilePath, () => {
                    loadSpinner.stop();
                    console.log('    ' + func + ' download finished.');
                });
            });
        }
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
