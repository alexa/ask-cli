import {expect} from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import {
  S3Client as _S3Client,
  CreateBucketCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  PutBucketVersioningCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import S3Client from "../../../../lib/clients/aws-client/s3-client";

describe("Clients test - s3 client test", () => {
  const TEST_AWS_PROFILE = "TEST_AWS_PROFILE";
  const TEST_AWS_REGION = "TEST_AWS_REGION";
  const TEST_CONFIGURATION = {
    awsProfile: TEST_AWS_PROFILE,
    awsRegion: TEST_AWS_REGION,
  };
  const TEST_BUCKET_NAME = "BUCKET_NAME";
  const TEST_BUCKET_KEY = "BUCKET_KEY";
  const TEST_BUCKET_BODY = Buffer.from("BUCKET_BODY");
  const TEST_RESPONSE = "RESPONSE";
  let s3Client: S3Client, sendCommandStub: sinon.SinonStub, waitUntilBucketExistsStub: sinon.SinonStub;

  beforeEach(() => {
    sendCommandStub = sinon.stub(_S3Client.prototype, "send");
    waitUntilBucketExistsStub = sinon.stub();
    const S3Client = proxyquire("../../../../lib/clients/aws-client/s3-client", {
      "@aws-sdk/client-s3": {
        waitUntilBucketExists: waitUntilBucketExistsStub,
      },
    }).default;
    s3Client = new S3Client(TEST_CONFIGURATION);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("# constructor tests", () => {
    it("| inspect correctness for constructor when awsRegion is set in configuration", () => {
      const s3Client = new S3Client(TEST_CONFIGURATION);
      expect(s3Client).to.be.instanceof(S3Client);
      expect(s3Client.credentials).to.be.a("function");
      expect(s3Client.profile).equal(TEST_AWS_PROFILE);
      expect(s3Client.region).equal(TEST_AWS_REGION);
    });

    it("| inspect correctness for constructor when awsRegion is null in configuration", () => {
      const configuration = {
        awsProfile: TEST_AWS_PROFILE,
        awsRegion: undefined,
      };
      expect(() => new S3Client(configuration)).to.throw("Invalid awsProfile or Invalid awsRegion");
    });

    it("| inspect correctness for constructor when awsProfile is blank in configuration", () => {
      const configuration = {
        awsProfile: "    ",
        awsRegion: TEST_AWS_REGION,
      };
      expect(() => new S3Client(configuration)).to.throw("Invalid awsProfile or Invalid awsRegion");
    });
  });

  describe("# function putObject tests", () => {
    const expectedParams = {
      Body: TEST_BUCKET_BODY,
      Bucket: TEST_BUCKET_NAME,
      Key: TEST_BUCKET_KEY,
    };

    it("| putObject method correctly pass params to S3 pubObject method, and error when pubObject error", (done) => {
      // setup
      const TEST_PUTOBJECT_ERROR = new Error("PUTOBJECT_ERROR");
      sendCommandStub.rejects(TEST_PUTOBJECT_ERROR);
      // call
      s3Client.putObject(TEST_BUCKET_NAME, TEST_BUCKET_KEY, TEST_BUCKET_BODY).catch((err) => {
        // verify
        expect(err).equal(TEST_PUTOBJECT_ERROR);
        expect(sendCommandStub.args[0][0]).to.be.instanceof(PutObjectCommand);
        expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
        done();
      });
    });

    it("| putObject method correctly pass params to S3 pubObject method, and response when S3 pubObject succeed", (done) => {
      // setup
      sendCommandStub.resolves(TEST_RESPONSE);
      // call
      s3Client.putObject(TEST_BUCKET_NAME, TEST_BUCKET_KEY, TEST_BUCKET_BODY).then((res) => {
        // verify
        expect(res).equal(TEST_RESPONSE);
        expect(sendCommandStub.args[0][0]).to.be.instanceof(PutObjectCommand);
        expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
        done();
      });
    });
  });

  describe("# function waitForBucketExists tests", () => {
    const expectedParams = {
      Bucket: TEST_BUCKET_NAME,
    };

    it("| waitForBucketExists method and s3client request fails, expect error", (done) => {
      // setup
      const TEST_WAITFOR_ERROR = new Error("WAITFOR_ERROR");
      waitUntilBucketExistsStub.rejects(TEST_WAITFOR_ERROR);
      // call
      s3Client.waitForBucketExists(TEST_BUCKET_NAME).catch((err) => {
        // verify
        expect(err).equal(TEST_WAITFOR_ERROR);
        expect(waitUntilBucketExistsStub.args[0][1]).to.deep.equal(expectedParams);
        done();
      });
    });

    it("| waitForBucketExists method and s3client request pass, expect response", (done) => {
      // setup
      waitUntilBucketExistsStub.resolves(TEST_RESPONSE);
      // call
      s3Client.waitForBucketExists(TEST_BUCKET_NAME).then((res) => {
        // verify
        expect(res).equal(TEST_RESPONSE);
        done();
      });
    });
  });

  describe("# function enableBucketVersioning tests", () => {
    const expectedParams = {
      Bucket: TEST_BUCKET_NAME,
      VersioningConfiguration: {
        MFADelete: "Disabled",
        Status: "Enabled",
      },
    };

    it(
      "| enableBucketVersioning method correctly pass params to S3 putBucketVersioning method, " +
        "and error when S3 pubBucketVersioning error",
      (done) => {
        // setup
        const TEST_PUTVERSION_ERROR = new Error("HEAD_ERROR");
        sendCommandStub.rejects(TEST_PUTVERSION_ERROR);
        // call
        s3Client.enableBucketVersioning(TEST_BUCKET_NAME).catch((err) => {
          // verify
          expect(err).equal(TEST_PUTVERSION_ERROR);
          expect(sendCommandStub.args[0][0]).to.be.instanceof(PutBucketVersioningCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );

    it(
      "| enableBucketVersioning method can correctly pass params to aws S3 putBucketVersioning method, " +
        "and response when S3 putBucketVersioning is executed correctly",
      (done) => {
        // setup
        sendCommandStub.resolves(TEST_RESPONSE);
        // call
        s3Client.enableBucketVersioning(TEST_BUCKET_NAME).then((res) => {
          // verify
          expect(res).equal(TEST_RESPONSE);
          expect(sendCommandStub.args[0][0]).to.be.instanceof(PutBucketVersioningCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );
  });

  describe("# function createBucket tests", () => {
    it(
      "| createBucket method can correctly pass params to aws S3 createBucket method when region is us-east-1, " +
        "and error when S3 createBucket error",
      (done) => {
        // setup
        const expectedParams = {
          Bucket: TEST_BUCKET_NAME,
        };
        const TEST_CREATE_ERROR = new Error("HEAD_ERROR");
        sendCommandStub.rejects(TEST_CREATE_ERROR);
        // call
        s3Client.createBucket(TEST_BUCKET_NAME, "us-east-1").catch((err) => {
          // verify
          expect(err).equal(TEST_CREATE_ERROR);
          expect(sendCommandStub.args[0][0]).to.be.instanceof(CreateBucketCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );

    it(
      "| createBucket method can correctly pass params to aws S3 createBucket method when region is not us-east-1," +
        " and response when S3 createBucket is executed correctly",
      (done) => {
        // setup
        const expectedParams = {
          Bucket: TEST_BUCKET_NAME,
          CreateBucketConfiguration: {
            LocationConstraint: TEST_AWS_REGION,
          },
        };
        sendCommandStub.resolves(TEST_RESPONSE);
        // call
        s3Client.createBucket(TEST_BUCKET_NAME, TEST_AWS_REGION).then((res) => {
          // verify
          expect(res).equal(TEST_RESPONSE);
          expect(sendCommandStub.args[0][0]).to.be.instanceof(CreateBucketCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );
  });

  describe("# function bucketExits tests", () => {
    const expectedParams = {
      Bucket: TEST_BUCKET_NAME,
    };

    it(
      "| bucketExits method can correctly pass params to aws S3 headBucket method, " +
        "and return false when S3 headBucket not found error",
      (done) => {
        // setup
        const TEST_HEAD_ERROR = {
          $metadata: {
            httpStatusCode: 404,
          },
        };
        sendCommandStub.rejects(TEST_HEAD_ERROR);
        // call
        s3Client.bucketExits(TEST_BUCKET_NAME).then((res) => {
          // verify
          expect(res).to.be.false;
          expect(sendCommandStub.args[0][0]).to.be.instanceof(HeadBucketCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );

    it(
      "| bucketExits method can correctly pass params to aws S3 headBucket method, " + "and return error when S3 headBucket other error",
      (done) => {
        // setup
        const TEST_HEAD_ERROR = {
          name: "OtherError",
        };
        sendCommandStub.rejects(TEST_HEAD_ERROR);
        // call
        s3Client.bucketExits(TEST_BUCKET_NAME).catch((err) => {
          // verify
          expect(err).equal(TEST_HEAD_ERROR);
          expect(sendCommandStub.args[0][0]).to.be.instanceof(HeadBucketCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );

    it(
      "| bucketExits method can correctly pass params to aws S3 headBucket method, " +
        "and return true when S3 headBucket is executed correctly",
      (done) => {
        // setup
        sendCommandStub.resolves();
        // call
        s3Client.bucketExits(TEST_BUCKET_NAME).then((res) => {
          // verify
          expect(res).to.be.true;
          expect(sendCommandStub.args[0][0]).to.be.instanceof(HeadBucketCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );
  });

  describe("# function getBucketVersioning tests", () => {
    const expectedParams = {
      Bucket: TEST_BUCKET_NAME,
    };

    it(
      "| getBucketVersioning method, can correctly pass params to aws S3 getBucketVersioning method, " +
        "and error when S3  getBucketVersioning error ",
      (done) => {
        // setup
        const TEST_GETVERSION_ERROR = new Error("GETVERSION_ERROR");
        sendCommandStub.rejects(TEST_GETVERSION_ERROR);
        // call
        s3Client.getBucketVersioning(TEST_BUCKET_NAME).catch((err) => {
          // verify
          expect(err).equal(TEST_GETVERSION_ERROR);
          expect(sendCommandStub.args[0][0]).to.be.instanceof(GetBucketVersioningCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );

    it(
      "| getBucketVersioning method, can correctly pass params to aws S3 getBucketVersioning method, " +
        "and response when S3  getBucketVersioning is executed correctly",
      (done) => {
        // setup
        sendCommandStub.resolves(TEST_RESPONSE);
        // call
        s3Client.getBucketVersioning(TEST_BUCKET_NAME).then((res) => {
          // verify
          expect(res).equal(TEST_RESPONSE);
          expect(sendCommandStub.args[0][0]).to.be.instanceof(GetBucketVersioningCommand);
          expect(sendCommandStub.args[0][0].input).to.deep.equal(expectedParams);
          done();
        });
      },
    );
  });
});
