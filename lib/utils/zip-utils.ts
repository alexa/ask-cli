import fs from 'fs';
import tmp from 'tmp';
import path from 'path';
import archiver from 'archiver';
import AdmZip from 'adm-zip';

import httpClient from '@src/clients/http-client';
import Messenger from '@src/view/messenger';
import * as CONSTANTS from '@src/utils/constants';

type ZipCallback = (error?: Error | string, filePath?: string) => void;
type UnzipCallback = (err?: Error) => void;

/**
 * function used to create a temporary zip file
 * @param {string} src The file path of resource want to zip
 * @param {callback} callback { error, filePath }
 */
function createTempZip(src: string, outputDir: string, callback: ZipCallback) {
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
            return callback(undefined, src);
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
            callback(undefined, zipFilePath);
        });
    });
}

function unzipRemoteZipFile(url: string, targetPath: string, doDebug: boolean, callback: UnzipCallback) {
    httpClient.request({
        url,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET,
        encoding: null
    }, 'get-zip-file', doDebug, (err?: Error, response?: any) => {
        if (err) {
            return callback(err);
        }
        const zip = new AdmZip(response.body);
        try {
            zip.extractAllTo(targetPath, false);
        } catch (unzipErr) {
            return callback(unzipErr);
        }
        callback();
    });
}

export default {
    createTempZip,
    unzipRemoteZipFile
};
