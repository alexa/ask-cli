const { expect } = require('chai');
const sinon = require('sinon');
const aws = require('aws-sdk');
const path = require('path');
const proxyquire = require('proxyquire');
const fs = require('fs');

const S3Client = require('@src/clients/aws-client/s3-client');

describe('Clients test - s3 client test', () => {
    const TEST_AWS_PROFILE = 'TEST_AWS_PROFILE';
    const TEST_AWS_REGION = 'TEST_AWS_REGION';
    const TEST_CONFIGURATION = {
        awsProfile: TEST_AWS_PROFILE,
        awsRegion: TEST_AWS_REGION
    };
    const TEST_BUCKET_NAME = 'BUCKET_NAME';
    const TEST_BUCKET_KEY = 'BUCKET_KEY';
    const TEST_BUCKET_BODY = 'BUCKET_BODY';
    const TEST_HEAD_ERROR = 'HEAD_ERROR';
    const TEST_CREATE_ERROR = 'HEAD_ERROR';
    const TEST_PUTVERSION_ERROR = 'HEAD_ERROR';
    const TEST_WAITFOR_ERROR = 'WAITFOR_ERROR';
    const TEST_PUTOBJECT_ERROR = 'PUTOBJECT_ERROR';
    const TEST_GETVERSION_ERROR = 'GETVERSION_ERROR';
    const TEST_RESPONSE = 'RESPONSE';

    describe('# constructor tests', () => {
        it('| inspect correctness for constructor when awsRegion is set in configuration', () => {
            const s3Client = new S3Client(TEST_CONFIGURATION);
            expect(s3Client).to.be.instanceof(S3Client);
            expect(s3Client.awsRegion).equal(TEST_AWS_REGION);
            expect(aws.config.region).equal(TEST_AWS_REGION);
            expect(aws.config.credentials).deep.equal(new aws.SharedIniFileCredentials({ profile: TEST_AWS_PROFILE }));
        });

        it('| inspect correctness for constructor when awsRegion is null in configuration', () => {
            const configuration = {
                awsProfile: TEST_AWS_PROFILE,
                awsRegion: null
            };
            try {
                new S3Client(configuration);
            } catch (e) {
                expect(e.message).equal('Invalid awsProfile or Invalid awsRegion');
            }
        });

        it('| inspect correctness for constructor when awsProfile is blank in configuration', () => {
            const configuration = {
                awsProfile: '    ',
                awsRegion: TEST_AWS_REGION
            };
            try {
                new S3Client(configuration);
            } catch (e) {
                expect(e.message).equal('Invalid awsProfile or Invalid awsRegion');
            }
        });
    });

    describe('# function preSignedPutObject tests', () => {
        let proxyClient;
        let stubRequest;
        let putStub;
        const TEST_OPTION = {};
        beforeEach(() => {
            putStub = sinon.stub();
            stubRequest = {
                put: putStub
            };
            proxyClient = proxyquire('@src/clients/aws-client/s3-client', {
                request: stubRequest
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| input pre-signed S3 url is not string, expect error thrown ', (done) => {
            // setup
            const TEST_URL = {};
            // call
            proxyClient.preSignedPutObject(TEST_URL, TEST_OPTION, (err) => {
                // verify
                expect(err).equal('[Error]: The url for the S3 presigned URL upload must not be blank.');
                done();
            });
        });

        it('| input pre-signed S3 url is empty sting, expect error thrown ', (done) => {
            // setup
            const TEST_URL = '';
            // call
            proxyClient.preSignedPutObject(TEST_URL, TEST_OPTION, (err) => {
                // verify
                expect(err).equal('[Error]: The url for the S3 presigned URL upload must not be blank.');
                done();
            });
        });

        it('| input pre-signed S3 url is empty, expect error thrown ', (done) => {
            // setup
            const TEST_URL = 'pre-signed_S3_url';
            putStub.callsArgWith(2, null);
            // call
            proxyClient.preSignedPutObject(TEST_URL, TEST_OPTION, (err) => {
                // verify
                expect(err).equal(null);
                done();
            });
        });
    });

    describe('# function putObject tests', () => {
        it('| s3Client putObject method correctly pass params to S3 pubObject method, and callback error when pubObject callback error', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Body: TEST_BUCKET_BODY,
                Bucket: TEST_BUCKET_NAME,
                Key: TEST_BUCKET_KEY
            };
            sinon.stub(s3Client.client, 'putObject').withArgs(expectedParams, sinon.match.func).callsArgWith(1, TEST_PUTOBJECT_ERROR);
            // call
            s3Client.putObject(TEST_BUCKET_NAME, TEST_BUCKET_KEY, TEST_BUCKET_BODY, (err, response) => {
                // verify
                expect(s3Client.client.putObject.args[0][0]).deep.equal(expectedParams);
                expect(err).equal(TEST_PUTOBJECT_ERROR);
                expect(response).equal(null);
                done();
            });
        });

        it('| s3Client putObject method correctly pass params to S3 pubObject method, and callback response when S3 pubObject succeed', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Body: TEST_BUCKET_BODY,
                Bucket: TEST_BUCKET_NAME,
                Key: TEST_BUCKET_KEY
            };
            sinon.stub(s3Client.client, 'putObject').withArgs(expectedParams, sinon.match.func).callsArgWith(1, null, TEST_RESPONSE);
            // call
            s3Client.putObject(TEST_BUCKET_NAME, TEST_BUCKET_KEY, TEST_BUCKET_BODY, (error, response) => {
                // verify
                expect(s3Client.client.putObject.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(null);
                expect(response).equal(TEST_RESPONSE);
                done();
            });
        });
    });

    describe('# function waitForBucketExists tests', () => {
        it('| s3Client waitfor bucketExists event and s3client request fails, expect error callback', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME
            };
            sinon.stub(s3Client.client, 'waitFor').withArgs('bucketExists', expectedParams, sinon.match.func).callsArgWith(2, TEST_WAITFOR_ERROR);
            // call
            s3Client.waitForBucketExists(TEST_BUCKET_NAME, (error, response) => {
                // verify
                expect(error).equal(TEST_WAITFOR_ERROR);
                expect(response).equal(null);
                done();
            });
        });

        it('| s3Client waitfor bucketExists event and s3client request pass, expect callback response', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME
            };
            sinon.stub(s3Client.client, 'waitFor').withArgs('bucketExists', expectedParams, sinon.match.func).callsArgWith(2, null, TEST_RESPONSE);
            // call
            s3Client.waitForBucketExists(TEST_BUCKET_NAME, (error, response) => {
                // verify
                expect(error).equal(null);
                expect(response).equal(TEST_RESPONSE);
                done();
            });
        });
    });

    // TODO fix the unit test of this function
    describe.skip('# function putBucketVersioning tests', () => {
        it('| s3Client putBucketVersioning method correctly pass params to S3 putBucketVersioning method, '
            + 'and callback error when S3 pubBucketVersioning callback error', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const MFADelete = 'Disabled';
            const Status = 'Enabled';
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME,
                VersioningConfiguration: {
                    MFADelete,
                    Status
                }
            };
            sinon.stub(s3Client.client, 'putBucketVersioning').withArgs(expectedParams, sinon.match.func).callsArgWith(1, TEST_PUTVERSION_ERROR);
            // call
            s3Client.putBucketVersioning(TEST_BUCKET_NAME, MFADelete, Status, (error, response) => {
                // verify
                expect(s3Client.client.putBucketVersioning.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(TEST_PUTVERSION_ERROR);
                expect(response).equal(null);
                done();
            });
        });

        it('| s3Client putBucketVersioning method can correctly pass params to aws S3 putBucketVersioning method, '
            + 'and callback response when S3 putBucketVersioning is executed correctly', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME,
                VersioningConfiguration: {
                    MFADelete: 'Disabled',
                    Status: 'Enabled'
                }
            };
            sinon.stub(s3Client.client, 'putBucketVersioning').withArgs(expectedParams, sinon.match.func).callsArgWith(1, null, TEST_RESPONSE);
            // call
            s3Client.putBucketVersioning(TEST_BUCKET_NAME, 'Disabled', 'Enabled', (error, response) => {
                // verify
                expect(s3Client.client.putBucketVersioning.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(null);
                expect(response).equal(TEST_RESPONSE);
                done();
            });
        });
    });

    describe('# function createBucket tests', () => {
        it('| s3Client createBucket method can correctly pass params to aws S3 createBucket method when region is us-east-1, '
            + 'and callback error when S3 createBucket callback error', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME
            };
            sinon.stub(s3Client.client, 'createBucket').withArgs(expectedParams, sinon.match.func).callsArgWith(1, TEST_CREATE_ERROR);
            // call
            s3Client.createBucket(TEST_BUCKET_NAME, 'us-east-1', (error, response) => {
                // verify
                expect(s3Client.client.createBucket.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(TEST_CREATE_ERROR);
                expect(response).equal(null);
                done();
            });
        });

        it('| s3Client createBucket method can correctly pass params to aws S3 createBucket method when region is not us-east-1,'
            + ' and callback response when S3 createBucket is executed correctly', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME,
                CreateBucketConfiguration: {
                    LocationConstraint: TEST_AWS_REGION
                }
            };
            sinon.stub(s3Client.client, 'createBucket').withArgs(expectedParams, sinon.match.func).callsArgWith(1, null, TEST_RESPONSE);
            // call
            s3Client.createBucket(TEST_BUCKET_NAME, TEST_AWS_REGION, (error, response) => {
                // verify
                expect(s3Client.client.createBucket.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(null);
                expect(response).equal(TEST_RESPONSE);
                done();
            });
        });
    });

    describe('# function headBucket tests', () => {
        it('| s3Client headBucket method can correctly pass params to aws S3 headBucket method, '
            + 'and callback error when S3 headBucket callback error', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME
            };
            sinon.stub(s3Client.client, 'headBucket').withArgs(expectedParams, sinon.match.func).callsArgWith(1, TEST_HEAD_ERROR);
            // call
            s3Client.headBucket(TEST_BUCKET_NAME, (error, response) => {
                // verify
                expect(s3Client.client.headBucket.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(TEST_HEAD_ERROR);
                expect(response).equal(null);
                done();
            });
        });

        it('| s3Client headBucket method can correctly pass params to aws S3 headBucket method, '
            + 'and callback response when S3  headBucket is executed correctly', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME
            };
            sinon.stub(s3Client.client, 'headBucket').withArgs(expectedParams, sinon.match.func).callsArgWith(1, null, TEST_RESPONSE);
            // call
            s3Client.headBucket(TEST_BUCKET_NAME, (error, response) => {
                // verify
                expect(s3Client.client.headBucket.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(null);
                expect(response).equal(TEST_RESPONSE);
                done();
            });
        });
    });

    // TODO fix the unit test of this function
    describe.skip('# function getBucketVersioning tests', () => {
        it('| s3Client getBucketVersioning method, can correctly pass params to aws S3 getBucketVersioning method, '
            + 'and callback error when S3  getBucketVersioning callback error ', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME
            };
            sinon.stub(s3Client.client, 'getBucketVersioning').withArgs(expectedParams, sinon.match.func).callsArgWith(1, TEST_GETVERSION_ERROR);
            // call
            s3Client.getBucketVersioning(TEST_BUCKET_NAME, (error, response) => {
                // verify
                expect(s3Client.client.getBucketVersioning.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(TEST_GETVERSION_ERROR);
                expect(response).equal(null);
                done();
            });
        });

        it('| s3Client getBucketVersioning method, can correctly pass params to aws S3 getBucketVersioning method, '
            + 'and callback response when S3  getBucketVersioning is executed correctly', (done) => {
            // setup
            const s3Client = new S3Client(TEST_CONFIGURATION);
            const expectedParams = {
                Bucket: TEST_BUCKET_NAME
            };
            sinon.stub(s3Client.client, 'getBucketVersioning').withArgs(expectedParams, sinon.match.func).callsArgWith(1, null, TEST_RESPONSE);
            // call
            s3Client.getBucketVersioning(TEST_BUCKET_NAME, (error, response) => {
                // verify
                expect(s3Client.client.getBucketVersioning.args[0][0]).deep.equal(expectedParams);
                expect(error).equal(null);
                expect(response).equal(TEST_RESPONSE);
                done();
            });
        });
    });

    describe('# function createBucketIfNotExist tests', () => {
        const s3Client = new S3Client(TEST_CONFIGURATION);
        it('| when headBucket return error, provisionBucket can correctly callback error message', (done) => {
            // setup
            sinon.stub(s3Client, 'headBucket').callsArgWith(1, TEST_HEAD_ERROR);

            // call
            s3Client.createBucketIfNotExist(TEST_BUCKET_NAME, TEST_AWS_REGION, (error) => {
                // verify
                expect(error).equal(TEST_HEAD_ERROR);
                done();
            });
        });

        it('| when headBucket return response without error, directly callback with no argument', (done) => {
            // setup
            sinon.stub(s3Client, 'headBucket').callsArgWith(1, null, TEST_RESPONSE);
            sinon.stub(s3Client, 'createBucket');
            sinon.stub(s3Client, 'putBucketVersioningIfUninitialized');
            // call
            s3Client.createBucketIfNotExist(TEST_BUCKET_NAME, TEST_AWS_REGION, (error) => {
                // verify
                expect(s3Client.createBucket.calledOnce).equal(false);
                expect(error).equal(undefined);
                done();
            });
        });

        it('| when headBucket callback NotFound error, createBucketIfNotExist can handle error from createBucket', (done) => {
            // setup
            sinon.stub(s3Client, 'headBucket').callsArgWith(1, { code: 'NotFound' });
            sinon.stub(s3Client, 'createBucket').callsArgWith(2, TEST_CREATE_ERROR, null);
            // call
            s3Client.createBucketIfNotExist(TEST_BUCKET_NAME, TEST_AWS_REGION, (error) => {
                // verify
                expect(error).equal(TEST_CREATE_ERROR);
                done();
            });
        });

        it('| when waitFor return with error, callback with the error', (done) => {
            // setup
            sinon.stub(s3Client, 'headBucket').callsArgWith(1, { code: 'NotFound' });
            sinon.stub(s3Client, 'createBucket').callsArgWith(2, null, TEST_RESPONSE);
            sinon.stub(s3Client, 'waitForBucketExists').callsArgWith(1, TEST_WAITFOR_ERROR);
            sinon.stub(s3Client, 'putBucketVersioningIfUninitialized');
            // call
            s3Client.createBucketIfNotExist(TEST_BUCKET_NAME, TEST_AWS_REGION, (error) => {
                // verify
                expect(error).equal(TEST_WAITFOR_ERROR);
                done();
            });
        });

        it('| when create bucket succeeds, callback directly callback without error', (done) => {
            // setup
            sinon.stub(s3Client, 'headBucket').callsArgWith(1, { code: 'NotFound' });
            sinon.stub(s3Client, 'createBucket').callsArgWith(2, null, TEST_RESPONSE);
            sinon.stub(s3Client, 'waitForBucketExists').callsArgWith(1);
            sinon.stub(s3Client, 'putBucketVersioningIfUninitialized');
            // call
            s3Client.createBucketIfNotExist(TEST_BUCKET_NAME, TEST_AWS_REGION, (error) => {
                // verify
                expect(s3Client.createBucket.calledOnce).equal(true);
                expect(s3Client.waitForBucketExists.calledOnce).equal(true);
                expect(error).equal(undefined);
                done();
            });
        });
    });

    describe('# function provisionBucketAndPutObject tests', () => {
        const TEST_PROVISIONBUCKET_ERROR = 'PROVISIONBUCKET_ERROR';
        const TEST_LAMBDA_REGION = 'LAMBDA_REGION';
        const TEST_FILE_PATH = 'FILE_PATH';

        const s3Client = new S3Client(TEST_CONFIGURATION);

        it('| callback createErr when createBucketIfNotExist function return error', (done) => {
            // setup
            sinon.stub(s3Client, 'createBucketIfNotExist').callsArgWith(2, TEST_CREATE_ERROR);
            // call
            s3Client.provisionBucketAndPutObject(TEST_BUCKET_NAME, TEST_BUCKET_KEY, TEST_LAMBDA_REGION, TEST_FILE_PATH, (error) => {
                // verify
                expect(error).equal(TEST_CREATE_ERROR);
                done();
            });
        });

        it('| callback provisionErr when provisionBucket function return error', (done) => {
            // setup
            sinon.stub(s3Client, 'createBucketIfNotExist').callsArgWith(2);
            sinon.stub(s3Client, 'putBucketVersioningIfUninitialized').callsArgWith(1, TEST_PROVISIONBUCKET_ERROR);
            // call
            s3Client.provisionBucketAndPutObject(TEST_BUCKET_NAME, TEST_BUCKET_KEY, TEST_LAMBDA_REGION, TEST_FILE_PATH, (error) => {
                // verify
                expect(error).equal(TEST_PROVISIONBUCKET_ERROR);
                done();
            });
        });

        it('| callback putErr when putObject function return error', (done) => {
            // setup
            sinon.stub(fs, 'readFileSync');
            sinon.stub(s3Client, 'createBucketIfNotExist').callsArgWith(2);
            sinon.stub(s3Client, 'putBucketVersioningIfUninitialized').callsArgWith(1);
            sinon.stub(s3Client, 'putObject').callsArgWith(3, TEST_PUTOBJECT_ERROR);
            // call
            s3Client.provisionBucketAndPutObject(TEST_BUCKET_NAME, TEST_BUCKET_KEY, TEST_LAMBDA_REGION, TEST_FILE_PATH, (error) => {
                // verify
                expect(error).equal(TEST_PUTOBJECT_ERROR);
                done();
            });
        });

        it('| callback putResponse when putObject function is executed correctly', (done) => {
            // setup
            sinon.stub(fs, 'readFileSync');
            sinon.stub(s3Client, 'createBucketIfNotExist').callsArgWith(2);
            sinon.stub(s3Client, 'putBucketVersioningIfUninitialized').callsArgWith(1);
            sinon.stub(s3Client, 'putObject').callsArgWith(3, null, TEST_RESPONSE);
            // call
            s3Client.provisionBucketAndPutObject(TEST_BUCKET_NAME, TEST_BUCKET_KEY, TEST_LAMBDA_REGION, TEST_FILE_PATH, (error, response) => {
                // verify
                expect(error).equal(null);
                expect(response).equal(TEST_RESPONSE);
                done();
            });
        });
    });

    describe('# function putBucketVersioningIfUninitialized tests', () => {
        const s3Client = new S3Client(TEST_CONFIGURATION);

        it('| callback error when getBucketVersioning return error', (done) => {
            // setup
            sinon.stub(s3Client, 'getBucketVersioning').callsArgWith(1, TEST_GETVERSION_ERROR);
            // call
            s3Client.putBucketVersioningIfUninitialized(TEST_BUCKET_NAME, (error) => {
                // verify
                expect(error).equal(TEST_GETVERSION_ERROR);
                done();
            });
        });

        it('| callback error when getBucketVersioning return empty object and putBucketVersioning return error', (done) => {
            // setup
            sinon.stub(s3Client, 'getBucketVersioning').callsArgWith(1, null, {});
            sinon.stub(s3Client, 'putBucketVersioning').callsArgWith(3, TEST_PUTVERSION_ERROR);
            // call
            s3Client.putBucketVersioningIfUninitialized(TEST_BUCKET_NAME, (error) => {
                // verify
                expect(error).equal(TEST_PUTVERSION_ERROR);
                done();
            });
        });

        it('| callback with no argument when getBucketVersioning return empty object and putBucketVersioning is executed correctly', (done) => {
            // setup
            sinon.stub(s3Client, 'getBucketVersioning').callsArgWith(1, null, {});
            sinon.stub(s3Client, 'putBucketVersioning').callsArgWith(3, null, TEST_RESPONSE);
            // call
            s3Client.putBucketVersioningIfUninitialized(TEST_BUCKET_NAME, (error) => {
                // verify
                expect(error).equal(undefined);
                done();
            });
        });

        it('| callback with no argument when getBucketVersioning return non-empty object', (done) => {
            // setup
            sinon.stub(s3Client, 'getBucketVersioning').callsArgWith(1, null, { a: 'b' });
            sinon.stub(s3Client, 'putBucketVersioning');
            // call
            s3Client.putBucketVersioningIfUninitialized(TEST_BUCKET_NAME, (error) => {
                // verify
                expect(s3Client.putBucketVersioning.calledOnce).equal(false);
                expect(error).equal(undefined);
                done();
            });
        });
    });

    describe('# function generateBucketName tests', () => {
        const TEST_REAL_AWS_REGION = 'ap-northeast-1';
        const TEST_PROFILE_NAME = '1234567890';

        beforeEach(() => {
            sinon.useFakeTimers(Date.UTC(2016, 2, 15));
        });

        it('| when user project name is longer than 22 characters and profile name is longer than 9 characters', () => {
            sinon.stub(path, 'basename').callsFake(() => '123456789012345678901234');
            const expectedName = 'ask-1234567890123456789012-123456789-apnortheast1-1458000000000';
            expect(S3Client.generateBucketName(TEST_PROFILE_NAME, TEST_REAL_AWS_REGION)).equal(expectedName);
        });

        it('| when user project name and profile name contain special characters which are not allowed', () => {
            sinon.stub(path, 'basename').callsFake(() => ';:,/  +=*&^%$#@test-name!~-.');
            const profileName = 'foo|{}[]?<>_';
            const expectedName = 'ask-test-name-.-foo-apnortheast1-1458000000000';
            expect(S3Client.generateBucketName(profileName, TEST_REAL_AWS_REGION)).equal(expectedName);
        });

        it('| when user project name and profile name contain Capital characters', () => {
            sinon.stub(path, 'basename').callsFake(() => 'TESTPROJECTNAME');
            const profileName = 'PROFILE';
            const expectedName = 'ask-testprojectname-profile-apnortheast1-1458000000000';
            expect(S3Client.generateBucketName(profileName, TEST_REAL_AWS_REGION)).equal(expectedName);
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
