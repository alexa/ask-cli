'use strict';

const initAWS = require('../utils/init-aws');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const archiver = require('archiver');
const profileHelper = require('../utils/profile-helper');

// Public
module.exports.createCommand = (commander) => {
    commander
        .command('upload')
        .usage('<-f|--function <function>> [-s|--src <source>] [-p|--profile <profile>]')
        .description('upload an existing Labmda function')
        .option('-f, --function <function>', 'upload to the specified Lambda function')
        .option('-s, --src <source>', 'upload specified source folder')
        .option('-p, --profile <profile>', 'ask cli profile')
        .action(handle);

    function handle(options) {
        if (!options.function) {
            console.warn('Please input required parameter: function');
            return;
        }
        let AWSProfile = profileHelper.getAWSProfile(profileHelper.runtimeProfile(options.profile));
        module.exports.uploadByName(options.function, options.src || process.cwd(), AWSProfile);
    }
};

module.exports.uploadByName = (func, src, AWSProfile, callback) => {
    module.exports.createZip(src, (zipFilePath) => {
        uploadToLambda(func, zipFilePath, AWSProfile, callback);
    });
};

module.exports.createZip = (src, callback) => {
    fs.access(src, (fs.constants || fs).W_OK, (err) => {
        if (err) {
            console.error('File access error. ' + err);
            process.exit(1);
        }
        if (path.extname(src) === '.zip') {
            console.log('The source file has already been compressed. Skip the zipping.');
            callback(src);
            return;
        }
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
            callback(zipFilePath);
        });
    });
};

// Private
function uploadToLambda(functionName, zipFilePath, AWSProfile, callback) {
    let aws = initAWS.initAWS(AWSProfile);
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

    lambdaClient.updateFunctionCode(params, (err) => {
        fs.unlinkSync(zipFilePath);
        if (err) {
            console.error('Upload Lambda function error.\n' + err);
            if (typeof callback === 'function' && callback) {
                callback(err);
            }
        } else {
            if (typeof callback === 'function' && callback) {
                callback();
            }
        }
    });
}
