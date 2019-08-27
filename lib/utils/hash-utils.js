const folderHash = require('folder-hash');

module.exports = {
    getHash
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
