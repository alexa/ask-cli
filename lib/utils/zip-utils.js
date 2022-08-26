const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const archiver = require('archiver');
const AdmZip = require('adm-zip');

const httpClient = require('@src/clients/http-client');
const Messenger = require('@src/view/messenger');
const CONSTANTS = require('@src/utils/constants');

module.exports = {
    createTempZip,
    unzipRemoteZipFile
};

/**
 * function used to create a temporary zip file
 * @param {string} src The file path of resource want to zip
 * @param {callback} callback { error, filePath }
 */
function createTempZip(src, outputDir, callback) {
    if (!src) {
        return callback('Zip file path must be set.');
    }

    if (!outputDir) {
        return callback('Zip file output path must be set.');
    }
    fs.access(src, (fs.constants || fs).W_OK, (err) => {
        if (err) {
            return callback(`File access error. ${err}`);
        }
        if (path.extname(src) === '.zip' || path.extname(src) === '.jar') {
            Messenger.getInstance().debug(`The source file ${src} has already been compressed. Skip the zipping`);
            return callback(null, src);
        }
        // Create the temp zip at the same level of the source file
        const zipFilePath = tmp.tmpNameSync({
            prefix: 'askcli_temp_',
            postfix: '.zip',
            dir: outputDir
        });
        const writeStream = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip');
        const stats = fs.statSync(src);

        archive.on('error', (archiveErr) => {
            callback(`Archive error. ${archiveErr}`);
        });

        archive.pipe(writeStream);
        if (stats.isFile()) {
            archive.file(src, { name: path.basename(src) });
        } else if (stats.isDirectory()) {
            archive.glob('**/*', {
                cwd: src,
                ignore: path.basename(zipFilePath)
            }, {});
        }
        archive.finalize();

        writeStream.on('close', () => {
            callback(null, zipFilePath);
        });
    });
}

/**
 * Makes an http request to a remote url to fetch a zip file and unzips the contents
 * to a local directory
 * 
 * @param {*} url - the http url for making a GET request
 * @param {*} targetPath - the local path to extract the file
 * @param {*} doDebug - to include debug messages with the http request
 * @param {*} overwrite - whether to overwrite the existing file
 * @param {*} callback - { error }
 */
function unzipRemoteZipFile(url, targetPath, doDebug, overwrite = false, callback) {
    httpClient.request({
        url,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        encoding: null
    }, 'get-zip-file', doDebug, (err, response) => {
        if (err) {
            return callback(err);
        }
        const zip = new AdmZip(response.body);
        try {
            zip.extractAllTo(targetPath, overwrite);
        } catch (unzipErr) {
            return callback(unzipErr);
        }
        callback();
    });
}
