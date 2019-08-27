const fs = require('fs');
const inquirer = require('inquirer');
const prettyBytes = require('pretty-bytes');

const CONSTANTS = require('@src/utils/constants');

module.exports = {
    _resolvePartSize,
    _confirmOrOverwritePartSize,
    _transformUploadArrayToMap
};

function _resolvePartSize(file) {
    const fileSize = fs.statSync(file).size;
    const minAverageSize = Math.max(Math.ceil(fileSize / CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.MAX_PART_COUNT),
        CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.DEFAULT_PART_SIZE);
    const partsNumber = Math.ceil(fileSize / minAverageSize);

    return {
        totalSize: fileSize,
        calculatedPartSize: minAverageSize,
        calculatedPartsNumber: partsNumber
    };
}

function _confirmOrOverwritePartSize(totalSize, partSize, partsNumber, callback) {
    if (partsNumber === 1) {
        return process.nextTick(() => {
            callback(partSize, partsNumber);
        });
    }

    inquirer.prompt({
        type: 'confirm',
        name: 'isAllowed',
        message: `CLI's about to partition this ${prettyBytes(totalSize)} file to ${partsNumber} parts and upload \
in parallel.\n  Do you agree with this partition?`
    }).then((answer) => {
        if (answer.isAllowed) {
            return callback(partSize, partsNumber);
        }

        const maxPartitions = Math.floor(totalSize / CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.MIN_PART_SIZE);
        inquirer.prompt({
            type: 'input',
            name: 'preferredPartsNumber',
            message: `Please tell us your preferred number of partitions (1 ~ ${maxPartitions}):`,
            validate: (input) => {
                if (!Number(input) || Number(input) <= 0 || Number(input) > maxPartitions) {
                    return `Parts number should be a valid integer in the range (1 ~ ${maxPartitions}) to make sure \
each part is larger then ${CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.MIN_PART_SIZE_DISPLAY}.`;
                }
                return true;
            }
        }).then((ans) => {
            const preferredParts = Number(ans.preferredPartsNumber);
            callback(Math.ceil(totalSize / preferredParts), preferredParts);
        });
    });
}

function _transformUploadArrayToMap(uploadPartsArray) {
    if (!uploadPartsArray || uploadPartsArray.length === 0) {
        return null;
    }

    const result = new Map();
    uploadPartsArray.forEach((cell) => {
        result.set(cell.partNumber, cell.url);
    });
    return result;
}
