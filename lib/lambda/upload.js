'use strict';

const initAWS = require('../utils/init-aws');
const clui = require('clui');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const archiver = require('archiver');

// Public
module.exports.createCommand = (commander) => {
    commander
        .command('upload')
        .description('Upload the specific directory to Labmda function')
        .option('-f, --function <function>', 'upload to the specified Lambda function')
        .option('-s, --src <dir>', 'upload specified source folder')
        .action(handle);

    function handle(options) {
        if (!options.function) {
            console.warn('Please input required option: function.');
            return;
        }
        module.exports.uploadByName(options.function, options.src || process.cwd());
    }
};

module.exports.uploadByName = (func, src) => {
    module.exports.createZip(src, (zipFilePath) => {
        uploadToLambda(func, zipFilePath);
    });
};

module.exports.createZip = (src, callback) => {
    fs.access(src, (fs.constants || fs).W_OK, (err) => {
        if (err) {
            console.error('File access error. ' + err);
            return;
        }
        if (path.extname(src) === '.zip') {
            console.log('The source file has already been compressed. Skip the zipping.');
            callback(src);
            return;
        }
        let Spinner = clui.Spinner;
        let zipSpinner = new Spinner(' Zipping Lambda function...');
        zipSpinner.start();

        let zipFileName = tmp.tmpNameSync({
            prefix: 'asktemp_',
            postfix: '.zip',
            dir: './'
        });
        let zipFilePath = path.join(process.cwd(), zipFileName);
        let writeStream = fs.createWriteStream(zipFilePath);
        let archive = archiver('zip');
        let stats = fs.statSync(src);

        archive.on('error', (err) => {
            console.error('Archive error. ' + err);
        });
        archive.pipe(writeStream);
        if (stats.isFile()) {
            archive.file(src, {name: path.basename(src)});
        } else if (stats.isDirectory()) {
            archive.glob('**/*', {
                cwd: src,
                ignore: zipFilePath
            }, {});
        }
        archive.finalize();

        writeStream.on('close', () => {
            zipSpinner.stop();
            console.log('    zip for ' + src  + ' finished.');
            callback(zipFilePath);
        });
    });
};

// Private
function uploadToLambda(functionName, zipFilePath) {
    let aws = initAWS.initAWS();
    if (!aws) {
        return;
    }
    if (initAWS.isLambdaArn(functionName)) {
        initAWS.setRegionWithLambda(aws, functionName);
    }
    let lambdaClient = new aws.Lambda();
    let params = {
        FunctionName: functionName,
        ZipFile: fs.readFileSync(zipFilePath)
    };
    let Spinner = clui.Spinner;
    let uploadSpinner = new Spinner(functionName + ' uploading...');
    uploadSpinner.start();
    lambdaClient.updateFunctionCode(params, (err) => {
        uploadSpinner.stop();
        fs.unlinkSync(zipFilePath);
        if (err) {
            console.error('Upload Lambda function error.\n' + err);
        } else {
            console.log('    ' + functionName + ' upload finished.');
        }

    });
}
