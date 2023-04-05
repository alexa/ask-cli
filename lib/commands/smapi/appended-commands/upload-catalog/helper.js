const fs = require("fs");
const inquirer = require("inquirer");
const prettyBytes = require("pretty-bytes");

const httpClient = require("../../../../clients/http-client");
const SpinnerView = require("../../../../view/spinner-view");
const {ParallelStream} = require("../../../../utils/stream-utility");
const CONSTANTS = require("../../../../utils/constants");

module.exports = {
  _resolvePartSize,
  _confirmOrOverwritePartSize,
  _transformUploadArrayToMap,
  _multipartsUploadToPresignedUrls,
};

function _resolvePartSize(file) {
  const fileSize = fs.statSync(file).size;
  const minAverageSize = Math.max(
    Math.ceil(fileSize / CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.MAX_PART_COUNT),
    CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.DEFAULT_PART_SIZE,
  );
  const partsNumber = Math.ceil(fileSize / minAverageSize);

  return {
    totalSize: fileSize,
    calculatedPartSize: minAverageSize,
    calculatedPartsNumber: partsNumber,
  };
}

function _confirmOrOverwritePartSize(totalSize, partSize, partsNumber, callback) {
  if (partsNumber === 1) {
    return process.nextTick(() => {
      callback(partSize, partsNumber);
    });
  }

  inquirer
    .prompt({
      type: "confirm",
      name: "isAllowed",
      message: `CLI's about to partition this ${prettyBytes(totalSize)} file to ${partsNumber} parts and upload \
in parallel.\n  Do you agree with this partition?`,
    })
    .then((answer) => {
      if (answer.isAllowed) {
        return callback(partSize, partsNumber);
      }

      const maxPartitions = Math.floor(totalSize / CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.MIN_PART_SIZE);
      inquirer
        .prompt({
          type: "input",
          name: "preferredPartsNumber",
          message: `Please tell us your preferred number of partitions (1 ~ ${maxPartitions}):`,
          validate: (input) => {
            if (!Number(input) || Number(input) <= 0 || Number(input) > maxPartitions) {
              return `Parts number should be a valid integer in the range (1 ~ ${maxPartitions}) to make sure \
each part is larger then ${CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.MIN_PART_SIZE_DISPLAY}.`;
            }
            return true;
          },
        })
        .then((ans) => {
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

/**
 * Implement the multipart upload to S3.
 * Run upload in parallel for each part by using ParallelStream.
 *
 * @param {object} uploadPartsMap Mapping between partNumber and its eTag
 * @param {string} filePath The file to upload
 * @param {integer} totalSize Total size of the file
 * @param {integer} partSize The size of each partition (the last part can be smaller then this)
 * @param {integer} partsNumber The number of partitions of the file
 * @param {callback} callback
 */
function _multipartsUploadToPresignedUrls(uploadPartsMap, filePath, totalSize, partSize, partsNumber, callback) {
  const progressSpinner = new SpinnerView();

  // Declarations of the state signals for the unordered stream upload
  const partETagsList = [];
  let partBuffer = [];
  let partBufferTotalLength = 0;
  let loadedPartCount = 0;
  let loadedSize = 0;
  let uploadedPartCount = 0;
  let uploadedSize = 0;
  const uploadTask = (chunk, enc, done) => {
    // 1. Clear the partBuffer and append the rest (by slicing a partSize buffer) to the partBuffer
    const aggregatedBuffer = Buffer.concat(partBuffer);
    const rest = aggregatedBuffer.slice(partSize);
    partBuffer = [];
    partBuffer.push(rest);
    partBufferTotalLength = rest.length;

    // 2. Upload by S3 presigned URL
    // Need to store the part number for current "thread" to avoid wrong mapping for eTag and partNumber
    const threadPartNum = ++loadedPartCount;
    progressSpinner.update(
      ` ${loadedPartCount}/${partsNumber} uploads have been requested. ` +
        `Currently ${uploadedPartCount}/${partsNumber} parts and ${prettyBytes(uploadedSize)}/${prettyBytes(
          totalSize,
        )} have been uploaded...`,
    );

    const url = uploadPartsMap.get(threadPartNum);
    if (typeof url !== "string" || !url.trim()) {
      process.nextTick(() => {
        done("[Error]: The url for the S3 presigned URL upload must not be blank.");
      });
      return;
    }

    httpClient.putByUrl(url, aggregatedBuffer, "UPLOAD_S3_PRESIGNED_URL", false, (err, response) => {
      if (err) {
        return done(err);
      }

      // 3. Update uploaded parts state.
      uploadedPartCount++;
      uploadedSize += aggregatedBuffer.byteLength;
      partETagsList.push({
        eTag: response.headers.etag,
        partNumber: threadPartNum,
      });

      progressSpinner.update(
        ` ${loadedPartCount}/${partsNumber} uploads have been requested. ` +
          `Currently ${uploadedPartCount}/${partsNumber} parts ` +
          `and ${prettyBytes(uploadedSize)}/${prettyBytes(totalSize)} have been uploaded...`,
      );
      done();
    });
  };

  const processStreamBuffer = (chunk) => {
    // Process data whenever stream buffer is readable. Accumulate part and total length for the partBuffer
    partBuffer.push(chunk);
    partBufferTotalLength += chunk.byteLength;
    loadedSize += chunk.byteLength;
  };

  const verifyAndFinish = () => {
    progressSpinner.terminate();
    if (partETagsList.length !== partsNumber) {
      callback(
        `[Error]: Multipart upload failed. There are ${partsNumber - partETagsList.length}` +
          ` part(s) over ${partsNumber} parts not uploaded. Please try again!`,
      );
      return;
    }
    for (const element of partETagsList) {
      const tmpETag = element.eTag;
      if (typeof tmpETag !== "string" || !tmpETag.trim()) {
        callback(`[Error]: Failed to get the ETag for part number ${element.partNumber}. Please try again!`);
        return;
      }
    }
    callback(null, partETagsList);
  };

  const parallelStreamOptions = {
    willTransform: () => partBufferTotalLength >= partSize || (loadedPartCount === partsNumber - 1 && loadedSize === totalSize),
    concurrency: CONSTANTS.CONFIGURATION.S3.MULTIPART_UPLOAD.CONCURRENCY,
    isObjectMode: false,
  };

  // Main stream processing
  progressSpinner.start();
  fs.createReadStream(filePath)
    .pipe(new ParallelStream(uploadTask, processStreamBuffer, verifyAndFinish, parallelStreamOptions))
    .on("error", (err) => {
      callback(err);
    });
}
