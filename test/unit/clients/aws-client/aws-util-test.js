const R = require('ramda');
const sinon = require('sinon');
const path = require('path');
const { expect } = require('chai');

const { getAWSProfile } = require('@src/clients/aws-client/aws-util');
const CONSTANTS = require('@src/utils/constants');

describe('# aws util tests', () => {
    const TEST_ASK_PROFILE = 'TEST_ASK_PROFILE';
    const TEST_AWS_ACCESS_KEY_ID = 'TEST_AWS_ACCESS_KEY_ID';
    const TEST_AWS_SECRET_ACCESS_KEY = 'TEST_AWS_SECRET_ACCESS_KEY';
    const TEST_AWS_PROFILE = 'TEST_AWS_PROFILE';
    const TEST_APP_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'cli_config');

    beforeEach(() => {
        sinon.restore();
    });

    afterEach(() => {
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
    });

    it('| should load aws env profile if env variables are set', () => {
        process.env.AWS_ACCESS_KEY_ID = TEST_AWS_ACCESS_KEY_ID;
        process.env.AWS_SECRET_ACCESS_KEY = TEST_AWS_SECRET_ACCESS_KEY;
        const awsProfile = getAWSProfile(TEST_ASK_PROFILE);
        expect(awsProfile).eql(CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS) 
    });

    it('| should return aws profile from cli config', () => {
        sinon.stub(path, 'join').returns(TEST_APP_CONFIG_FILE_PATH);
        sinon.stub(R, 'view').returns(TEST_AWS_PROFILE);
        const awsProfile = getAWSProfile(TEST_ASK_PROFILE);
        expect(awsProfile).eql(TEST_AWS_PROFILE);
    });

    it('| should return aws profile from cli config if secret key env var is missing', () => {
        process.env.AWS_ACCESS_KEY_ID = TEST_AWS_ACCESS_KEY_ID;
        sinon.stub(path, 'join').returns(TEST_APP_CONFIG_FILE_PATH);
        sinon.stub(R, 'view').returns(TEST_AWS_PROFILE);
        const awsProfile = getAWSProfile(TEST_ASK_PROFILE);
        expect(awsProfile).eql(TEST_AWS_PROFILE);
    });

    it('| should return aws profile from cli config if access key env var is missing', () => {
        process.env.AWS_SECRET_ACCESS_KEY = TEST_AWS_ACCESS_KEY_ID;
        sinon.stub(path, 'join').returns(TEST_APP_CONFIG_FILE_PATH);
        sinon.stub(R, 'view').returns(TEST_AWS_PROFILE);
        const awsProfile = getAWSProfile(TEST_ASK_PROFILE);
        expect(awsProfile).eql(TEST_AWS_PROFILE);
    });
});