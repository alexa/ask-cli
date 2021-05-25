import crypto from 'crypto';
import folderHash, { HashElementOptions } from 'folder-hash';
import fs from 'fs';

export type HashCallback = (error?: Error, hash?: string) => any

/**
 * Function used to generate hashcode of input folder/file
 * @param {*} sourcePath folder/file path
 * @param {*} callback { error, hashCode }
 */
function getHash(sourcePath: string, callback: HashCallback) {
    const options: HashElementOptions = {
        algo: 'sha1',
        encoding: 'base64',
        folders: {
            exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'],
            ignoreRootName: true
        },
    };

    folderHash.hashElement(sourcePath, '', options, (error, result) => {
        callback(error, (error || !result) ? undefined : result.hash);
    });
}
/**
 * Returns hash of a file
 * @param{String} filePath
 */
function getFileHash(filePath: string) {
    const sum = crypto.createHash('sha256');
    sum.update(fs.readFileSync(filePath));
    return sum.digest('hex');
}

export default {
    getHash,
    getFileHash
};
