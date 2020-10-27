const crypto = require('crypto');
const folderHash = require('folder-hash');
const fs = require('fs');

module.exports = {
    getHash,
    getFileHash
};

/**
 * Function used to generate hashcode of input folder/file
 * @param {*} sourcePath folder/file path
 * @param {*} callback { error, hashCode }
 */
function getHash(sourcePath, callback) {
    const options = {
        algo: 'sha1',
        encoding: 'base64',
        folders: {
            exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'],
            ignoreRootName: true
        },
    };

    folderHash.hashElement(sourcePath, options, (error, result) => {
        callback(error, error ? null : result.hash);
    });
}
/**
 * Returns hash of a file
 * @param{String} filePath
 */
function getFileHash(filePath) {
    const sum = crypto.createHash('sha256');
    sum.update(fs.readFileSync(filePath));
    return sum.digest('hex');
}
