const fs = require('fs');
const path = require('path');
const R = require('ramda');
const requestLib = require('request');
const prettyBytes = require('pretty-bytes');
const aws = require('aws-sdk');

const SpinnerView = require('@src/view/spinner-view');
const { ParallelStream } = require('@src/utils/stream-utility');
const CONSTANTS = require('@src/utils/constants');
const AbstractAwsClient = require('./abstract-aws-client');

/**
 * Class for S3 client
 */
module.exports = class S3Client extends AbstractAwsClient {
    constructor(configuration) {
        super(configuration);

        const httpClient = new aws.NodeHttpClient();
        const httpAgent = httpClient.getAgent(true, {
            keepAlive: false
        });
        this.client = new aws.S3({
            httpOptions: {
                agent: httpAgent
            }
        });
    }

    /**
     * Upload to a pre-signed S3 url with custom options
     * @param {string} url
     * @param {object} options
     * @param {function} callback
     */
    static preSignedPutObject(url, options, callback) {
        if (typeof url !== 'string' || !url.trim()) {
            process.nextTick(() => callback('[Error]: The url for the S3 presigned URL upload must not be blank.'));
        }
        requestLib.put(url, options, (err, response) => {
            callback(err, response);
        });
    }

    /**
     * Function used to provision bucket and upload object to it
     * @param {string} bucketName bucket name
     * @param {string} key key name, key is the unique identifier for an object within a bucket.
     * @param {string} lambdaRegion lambda region name
     * @param {string} filePath file path to content want to upload
     * @param {callback} callback { error, response }
     */
    provisionBucketAndPutObject(bucketName, key, lambdaRegion, filePath, callback) {
        this.createBucketIfNotExist(bucketName, lambdaRegion, (createErr) => {
            if (createErr) {
                return callback(createErr);
            }
            this.putBucketVersioningIfUninitialized(bucketName, (putVersionErr) => {
                if (putVersionErr) {
                    return callback(putVersionErr);
                }
                this.putObject(bucketName, key, fs.readFileSync(filePath), (putObjectErr, putResponse) => {
                    if (putObjectErr) {
                        return callback(putObjectErr);
                    }
                    callback(null, putResponse);
                });
            });
        });
    }

    /**
     * Function used to create s3 bucket with input bucket name
     * if no bucket with that name is found
     * first check whether the bucket is exist already and user has permission to access it
        If the bucket is exsit, reuse that bucket and skip creating new bucket
        If the bucket is not exsit, use the input bucket name to create a new bucket
        If other error happen, callback error message
     * @param {string} bucket bucket name
     * @param {string} region aws region name
     * @param {callback} callback { error }
     */
    createBucketIfNotExist(bucket, region, callback) {
        this.headBucket(bucket, (headErr) => {
            if (headErr) {
                if (headErr.code !== 'NotFound') {
                    return callback(headErr);
                }
                this.createBucket(bucket, region, (createErr) => {
                    if (createErr) {
                        return callback(createErr);
                    }
                    this.waitForBucketExists(bucket, (waitErr) => {
                        if (waitErr) {
                            return callback(waitErr);
                        }
                        callback();
                    });
                });
            } else {
                callback();
            }
        });
    }

    /**
     * Check if bucket versioning is initialized
     * if not, put bucket versioning
     * @param {string} bucketName bucket name
     * @param {callback} callback { error }
     */
    putBucketVersioningIfUninitialized(bucketName, callback) {
        this.getBucketVersioning(bucketName, (getVersionErr, response) => {
            if (getVersionErr) {
                return callback(getVersionErr);
            }
            // if bucket versioning is not set, cli will set it with fixed config { MFADelete: Disabled, Status: Enabled }
            // if bucket verisoning is already set, skip this step
            if (typeof response === 'object' && R.keys(response).length === 0) {
                this.putBucketVersioning(bucketName, 'Disabled', 'Enabled', (putVersionErr) => {
                    if (putVersionErr) {
                        return callback(putVersionErr);
                    }
                    callback();
                });
            } else {
                callback();
            }
        });
    }

    /**
     * Wrapper of aws sdk api
     * Function used to update s3 bucket version
     * @param {string} bucketName   bucket name
     * @param {enum} mfaDelete      Valid Values: Disabled | Enabled. Specifies whether MFA Delete is enabled in the bucket versioning configuration.
     *                              When enabled, the bucket owner must include the x-amz-mfa request header in requests
                                    to change the versioning state of a bucket and to permanently delete a versioned object.
     * @param {enum} status         Valid Values: Suspended | Enabled. Sets the versioning state of the bucket.
     * @param {callback} callback   { error, response }
     */
    putBucketVersioning(bucketName, mfaDelete, status, callback) {
        const params = {
            Bucket: bucketName,
            VersioningConfiguration: {
                MFADelete: mfaDelete,
                Status: status
            }
        };
        const request = this.client.putBucketVersioning(params);

        request.on('retry', (response) => {
            this.retryBucketVersionOperations(response);
        });
        request.on('success', (response) => {
            callback(null, response.data);
        });
        request.on('error', (error) => {
            callback(error, null);
        });

        request.send();
    }

    /**
     * Wrapper of aws sdk api
     * Function used to check whether the bucket versioning is set or not
     * @param {string} bucketName bucket name
     * @param {callback} callback { error, response }
     */
    getBucketVersioning(bucketName, callback) {
        const params = {
            Bucket: bucketName
        };
        const request = this.client.getBucketVersioning(params);

        request.on('retry', (response) => {
            this.retryBucketVersionOperations(response);
        });
        request.on('success', (response) => {
            callback(null, response.data);
        });
        request.on('error', (error) => {
            callback(error, null);
        });

        request.send();
    }

    /**
     * Wrapper of aws sdk api
     * Function used to create s3 bucket
     * @param {string} bucketName the name of bucket want to create
     * @param {string} region aws region code
     * @param {callback} callback { error, response }
     */
    createBucket(bucketName, region, callback) {
        const params = {
            Bucket: bucketName
        };
        // us-east-1 is not a supported value for LocationConstraint property at aws apis
        // should leave LocationConstraint empty when region code is us-east-1
        if (region && region !== 'us-east-1') {
            params.CreateBucketConfiguration = {
                LocationConstraint: region
            };
        }
        this.client.createBucket(params, (err, response) => {
            callback(err, !err ? response : null);
        });
    }

    /**
     * Wrapper of aws sdk api
     * Function used to determine if a bucket exists and user has permission to access it
     * @param {string} bucketName bucket name
     * @param {callback} callback { error, response }
     */
    headBucket(bucketName, callback) {
        const params = {
            Bucket: bucketName
        };
        this.client.headBucket(params, (err, response) => {
            callback(err, !err ? response : null);
        });
    }

    /**
     * Wrapper of aws sdk api
     * Function used to upload object to aws s3 bucket
     * @param {string} bucket bucket name
     * @param {string} key the name of uploaded content on s3 bucket
     * @param {Object} body the content want to upload to s3 bucket
     * @param {callback} callback { ETag, VersionId }
     */
    putObject(bucket, key, body, callback) {
        const params = {
            Body: body,
            Bucket: bucket,
            Key: key
        };
        this.client.putObject(params, (err, response) => {
            callback(err, !err ? response : null);
        });
    }

    /**
     * Wait for s3 bucket exists
     * @param {string} bucketName bucket name
     * @param {callback} callback
     */
    waitForBucketExists(bucketName, callback) {
        const params = {
            Bucket: bucketName
        };
        this.client.waitFor('bucketExists', params, (err, response) => {
            callback(err, !err ? response : null);
        });
    }

    /**
     * Function used to generate valid bucketName
     * The bucket name should follow the pattern: ask-projectName-profileName-awsRegion-timeStamp
     * a valid bucket name cannot longer than 63 characters, so cli fix the project name no longer than 22 characters
     * and fix the profile name no longer than 9 characters
     * @param {string} profile profile name
     * @param {string} awsRegion aws region code, eg: us-east-1
     */
    static generateBucketName(profile, awsRegion) {
        const projectName = path.basename(process.cwd());
        const validProjectName = projectName.toLowerCase().replace(/[^a-z0-9-.]+/g, '').substring(0, 22);
        const validProfile = profile.toLowerCase().replace(/[^a-z0-9-.]+/g, '').substring(0, 9);
        const shortRegionName = awsRegion.replace(/-/g, '');
        return `ask-${validProjectName}-${validProfile}-${shortRegionName}-${Date.now()}`;
    }

    /**
     * Implement the multipart upload to S3. Run upload in parallel for each part by using ParallelStream.
     *
     * @param {object} uploadPartsMap Mapping between partNumber and its eTag
     * @param {string} filePath The file to upload
     * @param {integer} totalSize Total size of the file
     * @param {integer} partSize The size of each partition (the last part can be smaller then this)
     * @param {integer} partsNumber The number of partitions of the file
     * @param {callback} callback
     */
    static multipartsUploadToPresignedUrls(uploadPartsMap, filePath, totalSize, partSize, partsNumber, callback) {
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
            progressSpinner.update(` ${loadedPartCount}/${partsNumber} uploads have been requested. `
            + `Currently ${uploadedPartCount}/${partsNumber} parts and ${prettyBytes(uploadedSize)}/${prettyBytes(totalSize)} have been uploaded...`);
            S3Client.preSignedPutObject(
                uploadPartsMap.get(threadPartNum),
                { body: aggregatedBuffer },
                (err, response) => {
                    if (err) {
                        return done(err);
                    }

                    // 3. Update uploaded parts state.
                    uploadedPartCount++;
                    uploadedSize += aggregatedBuffer.byteLength;
                    partETagsList.push({
                        eTag: response.headers.etag,
                        partNumber: threadPartNum
                    });

                    progressSpinner.update(` ${loadedPartCount}/${partsNumber} uploads have been requested. `
                    + `Currently ${uploadedPartCount}/${partsNumber} parts `
                    + `and ${prettyBytes(uploadedSize)}/${prettyBytes(totalSize)} have been uploaded...`);
                    done();
                }
            );
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
                callback(`[Error]: Multipart upload failed. There are ${partsNumber - partETagsList.length}`
                + ` part(s) over ${partsNumber} parts not uploaded. Please try again!`);
                return;
            }
            for (const element of partETagsList) {
                const tmpETag = element.eTag;
                if (typeof tmpETag !== 'string' || !tmpETag.trim()) {
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
            .on('error', (err) => {
                callback(err);
            });
    }

    /**
     * Retry logic to apply to GetBucketVersioning and PutBucketVersioning operations
     * to mitigate S3 eventual consistency issues following a bucket creation
     * @param {*} S3 response
     */
    retryBucketVersionOperations(response) {
        if (response.httpResponse.statusCode === 404 && response.error) {
            response.error.retryable = true;
            response.error.retryDelay = CONSTANTS.CONFIGURATION.S3.VERSIONING.NOT_FOUND_RETRY_DELAY_MS;
        }
    }
};
