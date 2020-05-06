const { expect } = require('chai');
const aws = require('aws-sdk');
const CONSTANTS = require('@src/utils/constants');

const AbstractAwsClient = require('@src/clients/aws-client/abstract-aws-client');

describe('Clients test - abstract client test', () => {
    const TEST_AWS_PROFILE = 'TEST_AWS_PROFILE';
    const TEST_AWS_REGION = 'TEST_AWS_REGION';
    let configuration;
    beforeEach(() => {
        aws.config.credentials.profile = null;
        configuration = {
            awsProfile: TEST_AWS_PROFILE,
            awsRegion: TEST_AWS_REGION
        };
    });

    describe('# constructor tests', () => {
        it('| should set region and credentials profile', () => {
            const client = new AbstractAwsClient(configuration);
            expect(client).to.be.instanceof(AbstractAwsClient);
            expect(client.awsRegion).eql(TEST_AWS_REGION);
            expect(client.awsProfile).eql(TEST_AWS_PROFILE);
            expect(aws.config.region).eql(TEST_AWS_REGION);
            expect(aws.config.credentials.profile).eql(TEST_AWS_PROFILE);
        });

        it('| should not set credentials profile since using env variables', () => {
            configuration.awsProfile = CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS;
            const client = new AbstractAwsClient(configuration);
            expect(client).to.be.instanceof(AbstractAwsClient);
            expect(client.awsRegion).eql(TEST_AWS_REGION);
            expect(client.awsProfile).eql(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS);
            expect(aws.config.region).eql(TEST_AWS_REGION);
            expect(aws.config.credentials.profile).eql(null);
        });

        it('| should throw error when aws profile is not specified ', () => {
            configuration.awsProfile = null;
            expect(() => new AbstractAwsClient(configuration)).to.throw('Invalid awsProfile or Invalid awsRegion');
        });

        it('| should throw error when aws region is not specified ', () => {
            configuration.awsRegion = null;
            expect(() => new AbstractAwsClient(configuration)).to.throw('Invalid awsProfile or Invalid awsRegion');
        });
    });
});
