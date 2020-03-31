const { expect } = require('chai');
const questions = require('@src/commands/configure/questions');
const CONSTANTS = require('@src/utils/constants');

describe('Command: Configure - questions validate test', () => {
    describe('# test request AWS profile name validators', () => {
        const TEST_LIST = ['1', '2'];

        it('| input is blank string', () => {
            expect(questions.REQUEST_AWS_PROFILE_NAME(TEST_LIST)[0].validate('   ')).equal('Profile name can not be blank string.');
        });

        it('| input is not existed in profiles list', () => {
            const result = questions.REQUEST_AWS_PROFILE_NAME(TEST_LIST);
            expect(result[0].validate('1')).equal('[1] already exists in existing AWS profiles. Please try again with another name.');
        });

        it('| input is valid based on profiles list', () => {
            TEST_LIST.push(CONSTANTS.AWS_DEFAULT_PROFILE_NAME);
            const result = questions.REQUEST_AWS_PROFILE_NAME(TEST_LIST);
            expect(result[0].validate('3')).equal(true);
            expect(result[0].default).equal(null);
        });
    });

    describe('# test accessKeyID and accessSecretKey validators', () => {
        it('| invalid accessKeyID', () => {
            // call and verify
            expect(questions.REQUEST_ACCESS_SECRET_KEY_AND_ID[0].validate('')).equal('"AWS Access Key ID" cannot be empty.');
        });

        it('| valid accessKeyID', () => {
            // call and verify
            expect(questions.REQUEST_ACCESS_SECRET_KEY_AND_ID[0].validate('accessKeyID')).equal(true);
        });

        it('| invalid secretAccessKey', () => {
            // call and verify
            expect(questions.REQUEST_ACCESS_SECRET_KEY_AND_ID[1].validate('')).equal('"AWS Secret Access Key" cannot be empty.');
        });

        it('| valid secretAccessKey', () => {
            // call and verify
            expect(questions.REQUEST_ACCESS_SECRET_KEY_AND_ID[1].validate('secretAccessKey')).equal(true);
        });
    });

    describe('# test authCode validators', () => {
        it('| invalid authCode', () => {
            // call and verify
            expect(questions.REQUEST_AUTH_CODE[0].validate('')).equal('Please enter a valid Authorization Code.');
        });

        it('| valid authCode', () => {
            // call and verify
            expect(questions.REQUEST_AUTH_CODE[0].validate('authorizationCode')).equal(true);
        });
    });
});
