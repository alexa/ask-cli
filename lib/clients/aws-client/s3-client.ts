import {
  S3Client as _S3Client,
  S3ServiceException,
  CreateBucketCommand,
  CreateBucketCommandOutput,
  GetBucketVersioningCommand,
  GetBucketVersioningCommandOutput,
  HeadBucketCommand,
  PutBucketVersioningCommand,
  PutBucketVersioningCommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput,
  waitUntilBucketExists,
} from "@aws-sdk/client-s3";
import {WaiterResult} from "@aws-sdk/util-waiter";

import CONSTANTS from "../../utils/constants";
import AbstractAwsClient, {AwsClientConfiguration} from "./abstract-aws-client";

/**
 * Class for S3 client
 */
export default class S3Client extends AbstractAwsClient {
  client: _S3Client;

  /**
   * Constructor
   * @param configuration aws client config
   */
  constructor(configuration: AwsClientConfiguration) {
    super(configuration);
    this.client = new _S3Client({
      credentials: this.credentials,
      region: this.region,
    });
  }

  /**
   * Enables s3 bucket version
   * @param bucketName   bucket name
   */
  enableBucketVersioning(bucketName: string): Promise<PutBucketVersioningCommandOutput> {
    const command = new PutBucketVersioningCommand({
      Bucket: bucketName,
      VersioningConfiguration: {
        MFADelete: "Disabled",
        Status: "Enabled",
      },
    });
    return this.client.send(command);
  }

  /**
   * Checks whether the bucket versioning is set or not
   * @param bucketName bucket name
   */
  getBucketVersioning(bucketName: string): Promise<GetBucketVersioningCommandOutput> {
    const command = new GetBucketVersioningCommand({
      Bucket: bucketName,
    });
    return this.client.send(command);
  }

  /**
   * Creates s3 bucket
   * @param bucketName bucket name
   * @param region aws region code
   */
  createBucket(bucketName: string, region: string): Promise<CreateBucketCommandOutput> {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
      // add LocationConstraint bukcet config if provided region not default location (us-east-1)
      ...(region &&
        region !== CONSTANTS.CONFIGURATION.S3.DEFAULT_LOCATION && {
          CreateBucketConfiguration: {
            LocationConstraint: region,
          },
        }),
    });
    return this.client.send(command);
  }

  /**
   * Checks if s3 bucket exists
   * @param bucketName bucket name
   */
  bucketExits(bucketName: string): Promise<boolean> {
    const command = new HeadBucketCommand({
      Bucket: bucketName,
    });
    return this.client
      .send(command)
      .then(() => true)
      .catch((err: S3ServiceException) => {
        if (err.$metadata?.httpStatusCode === 404) return false;
        throw err;
      });
  }

  /**
   * Uploads object to aws s3 bucket
   * @param bucket bucket name
   * @param key the name of uploaded content on s3 bucket
   * @param body the content want to upload to s3 bucket
   */
  putObject(bucket: string, key: string, body: Buffer): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    });
    return this.client.send(command);
  }

  /**
   * Waits for s3 bucket exists
   * @param bucketName bucket name
   */
  waitForBucketExists(bucketName: string): Promise<WaiterResult> {
    const params = {
      client: this.client,
      maxWaitTime: CONSTANTS.CONFIGURATION.S3.MAX_WAIT_TIME,
    };
    const input = {
      Bucket: bucketName,
    };
    return waitUntilBucketExists(params, input);
  }
}
