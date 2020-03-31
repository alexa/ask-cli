const { expect } = require('chai');
const sinon = require('sinon');
const inquirer = require('inquirer');
const CONSTANTS = require('@src/utils/constants');
const ui = require('@src/commands/configure/ui');
const messages = require('@src/commands/configure/messages');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');

function validateInquirerConfig(stub, expectedConfig) {
    const { message, type, defaultValue, choices } = expectedConfig;
    expect(stub.message).equal(message);
    expect(stub.type).equal(type);
    if (defaultValue) {
        expect(stub.default).equal(defaultValue);
    }
    if (choices) {
        expect(stub.choices).deep.equal(choices);
    }
}

describe('Command: Configure - UI test', () => {
    const TEST_ERROR = 'error';
    describe('# confirmSettingAws check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| AWS setup confirmation by user', (done) => {
            // setup
            inquirer.prompt.resolves({ choice: 'true' });

            // call
            ui.confirmSettingAws((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Do you want to link your AWS account in order to host your Alexa skills?',
                    type: 'confirm',
                    default: true
                });

                expect(err).equal(null);
                expect(response).equal('true');
                done();
            });
        });

        it('| AWS setup confirmation by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.confirmSettingAws((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Do you want to link your AWS account in order to host your Alexa skills?',
                    type: 'confirm',
                    default: true
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# selectEnvironmentVariables check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| Use environment variables confirmation by user', (done) => {
            // setup
            inquirer.prompt.resolves({ choice: 'yes' });

            // call
            ui.selectEnvironmentVariables((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'We have detected you have AWS environment variables. Would you like to setup your profile using those?',
                    type: 'list',
                    choices: ['Yes', 'No']
                });
                expect(err).equal(null);
                expect(response).equal('yes');
                done();
            });
        });

        it('| Use environment variables confirmation by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.selectEnvironmentVariables((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'We have detected you have AWS environment variables. Would you like to setup your profile using those?',
                    type: 'list',
                    choices: ['Yes', 'No']
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# addNewCredentials check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| Aws access_key_id and secret_access_key entered by user', (done) => {
            // setup
            const accessKeyId = 'accessKeyId';
            const secretAccessKey = 'secretAccessKey';
            inquirer.prompt.resolves({
                accessKeyId,
                secretAccessKey
            });

            // call
            ui.addNewCredentials((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response.aws_access_key_id).equal(accessKeyId);
                expect(response.aws_secret_access_key).equal(secretAccessKey);
                done();
            });
        });

        it('| Aws access_key_id and secret_access_key entered by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.addNewCredentials((err, response) => {
                // verify
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# createNewOrSelectAWSProfile check', () => {
        const listOfProfiles = ['ask', 'aws', 'lambda'];

        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| create profile or use existing profile decision by user', (done) => {
            // setup
            inquirer.prompt.resolves({ chosenProfile: 'lambda' });

            // call
            ui.createNewOrSelectAWSProfile(listOfProfiles, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    type: 'list',
                    message: 'Please choose from the following existing AWS profiles or create a new one.'
                });
                expect(err).equal(null);
                expect(response).equal('lambda');
                done();
            });
        });

        it('| create profile or use existing profile decision by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.createNewOrSelectAWSProfile(listOfProfiles, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    type: 'list',
                    message: 'Please choose from the following existing AWS profiles or create a new one.'
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# createNewProfile check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| valid profile name entered by user', (done) => {
            // setup
            inquirer.prompt.resolves({ profile: 'lambda' });

            // call
            ui.createNewProfile((error, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: `Please provide a profile name or press enter to use ${CONSTANTS.ASK_DEFAULT_PROFILE_NAME} as the profile name: `,
                    type: 'input',
                    default: CONSTANTS.ASK_DEFAULT_PROFILE_NAME
                });
                expect(error).equal(null);
                expect(response).equal('lambda');
                done();
            });
        });

        it('| invalid profile name entered by user', (done) => {
            // setup
            inquirer.prompt.resolves({ profile: '  %*^@&!' });

            // call
            ui.createNewProfile((error, response) => {
                // verify
                expect(error).equal(messages.PROFILE_NAME_VALIDATION_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| profile name entered by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.createNewProfile((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: `Please provide a profile name or press enter to use ${CONSTANTS.ASK_DEFAULT_PROFILE_NAME} as the profile name: `,
                    type: 'input',
                    default: CONSTANTS.ASK_DEFAULT_PROFILE_NAME
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });


        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# chooseVendorId check', () => {
        const VENDOR_PAGE_SIZE = 50;
        const vendorInfo = [
            {
                vendorName: 'vendor_name1',
                vendorId: ' vendor_id1'
            },
            {
                vendorName: 'vendor_name2',
                vendorId: ' vendor_id2'
            }
        ];

        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| vendor selection by user', (done) => {
            // setup
            inquirer.prompt.resolves({ selectedVendor: vendorInfo[0].vendorId });

            // call
            ui.chooseVendorId(VENDOR_PAGE_SIZE, vendorInfo, (error, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    type: 'rawlist',
                    message: 'Your Amazon developer account has multiple Vendor IDs. Please choose the Vendor ID for the skills you want to manage.',
                });
                expect(error).equal(null);
                expect(response).equal('vendor_id1');
                done();
            });
        });

        it('| vendor selection by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.chooseVendorId(VENDOR_PAGE_SIZE, vendorInfo, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    type: 'rawlist',
                    message: 'Your Amazon developer account has multiple Vendor IDs. Please choose the Vendor ID for the skills you want to manage.',
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# createOrUpdateProfile check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| returns error | invalid profile name entered', (done) => {
            // setup
            const listOfProfiles = [
                'askProfile1',
                'askProfile2'
            ];
            const createNewProfile = 'Create new profile';
            inquirer.prompt.resolves({ profile: createNewProfile });
            sinon.stub(ui, 'createNewProfile').callsArgWith(0, null, 'askProfile2');


            // call
            ui.createOrUpdateProfile(listOfProfiles, (error, askProfile) => {
                // verify
                expect(error).to.equal(messages.PROFILE_NAME_VALIDATION_ERROR);
                expect(askProfile).equals(undefined);
                done();
            });
        });

        it('| returns valid profile | createNewProfile returns valid profile', (done) => {
            // setup
            const listOfProfiles = [
                'askProfile1',
                'askProfile2'
            ];
            const createNewProfile = 'Create new profile';
            inquirer.prompt.resolves({ profile: createNewProfile });
            sinon.stub(stringUtils, 'validateSyntax').returns(true);
            sinon.stub(ui, 'createNewProfile').callsArgWith(0, null, 'askProfile2');

            // call
            ui.createOrUpdateProfile(listOfProfiles, (error, askProfile) => {
                // verify
                expect(error).to.equal(null);
                expect(askProfile).equals(createNewProfile);
                done();
            });
        });

        it('| update an existing ASK profile by user', (done) => {
            // setup
            const listOfProfiles = [
                'askProfile1',
                'askProfile2',
                '#$*%#$(%$43'
            ];
            inquirer.prompt.resolves({ profile: listOfProfiles[1] });

            // call
            ui.createOrUpdateProfile(listOfProfiles, (error, response) => {
                // verify
                expect(error).to.equal(null);
                expect(response).equal('askProfile2');
                done();
            });
        });

        it('| invalid profile name read from config file', (done) => {
            // setup
            const listOfProfiles = [
                'askProfile1',
                '#$*%#$(%$43'
            ];
            inquirer.prompt.resolves({ profile: listOfProfiles[1] });

            // call
            ui.createOrUpdateProfile(listOfProfiles, (error, response) => {
                // verify
                expect(error).equal(messages.PROFILE_NAME_VALIDATION_ERROR);
                expect(response).to.equal(undefined);
                done();
            });
        });

        it('| createOrUpdateProfile and inquirer throws exception', (done) => {
            // setup
            const listOfProfiles = [
                'askProfile1',
                '#$*%#$(%$43'
            ];
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.createOrUpdateProfile(listOfProfiles, (err, response) => {
                // verify
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# requestAwsProfileName check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| Aws profile name entered by user', (done) => {
            // setup
            inquirer.prompt.resolves({ awsProfileName: 'awsProfile' });

            // call
            ui.requestAwsProfileName([], (error, response) => {
                // verify
                expect(error).to.equal(null);
                expect(response).equal('awsProfile');
                done();
            });
        });

        it('| Aws profile name entered by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.requestAwsProfileName([], (err, response) => {
                // verify
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# stringFormatter', () => {
        it('| return null if not profile list', () => {
            expect(ui.profileFormatter()).to.be.a('null');
        });

        it('| return null if profile list is empty', () => {
            expect(ui.profileFormatter([])).to.be.a('null');
        });

        it('| return formatted profile list with no aws profile', () => {
            const input = [{
                askProfile: 'ask_test',
                awsProfile: null
            }];
            const expectResult = ['[ask_test]                ** NULL **'];
            expect(ui.profileFormatter(input)).to.eql(expectResult);
        });

        it('| return formatted profile list with aws profile', () => {
            const input = [{
                askProfile: 'ask_test',
                awsProfile: 'aws_test'
            }];
            const expectResult = ['[ask_test]                "aws_test"'];
            expect(ui.profileFormatter(input)).to.eql(expectResult);
        });
    });

    describe('# getAuthCode check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| Authorization code entered by user', (done) => {
            // setup
            inquirer.prompt.resolves({ authCode: 'authorizationCode' });

            // call
            ui.getAuthCode((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    type: 'input',
                    message: 'Please enter the Authorization Code: '
                });

                expect(err).equal(null);
                expect(response).equal('authorizationCode');
                done();
            });
        });

        it('| Authorization code entered by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.getAuthCode((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    type: 'input',
                    message: 'Please enter the Authorization Code: '
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });
});
