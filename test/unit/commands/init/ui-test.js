const { expect } = require('chai');
const sinon = require('sinon');
const inquirer = require('inquirer');
const ui = require('@src/commands/init/ui');
const messages = require('@src/commands/init/messages');
const profileHelper = require('@src/utils/profile-helper');

describe('Command: Init - UI test', () => {
    describe('# confirmSettingAws check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| AWS setup confirmation by user', () => {
            // setup
            inquirer.prompt.resolves({ choice: 'true' });

            // call
            ui.confirmSettingAws((response) => {
                // verify
                expect(response).equal('true');
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
        });
    });

    describe('# selectEnvironmentVariables check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| Use environment variables confirmation by user', () => {
            // setup
            inquirer.prompt.resolves({ choice: 'true' });

            // call
            ui.selectEnvironmentVariables((response) => {
                // verify
                expect(response).equal('true');
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
        });
    });

    describe('# addNewCredentials check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| Aws access_key_id and secret_access_key entered by user', () => {
            // setup
            const accessKeyId = 'accessKeyId';
            const secretAccessKey = 'secretAccessKey';
            inquirer.prompt.resolves({
                accessKeyId,
                secretAccessKey
            });

            // call
            ui.addNewCredentials((response) => {
                // verify
                expect(response.aws_access_key_id).equal(accessKeyId);
                expect(response.aws_secret_access_key).equal(secretAccessKey);
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
        });
    });

    describe('# confirmOverwritingProfile check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| confirmation of overwriting profile by user', () => {
            // setup
            inquirer.prompt.resolves({ overwrite: 'true' });

            // call
            ui.confirmOverwritingProfile('random_profile', (response) => {
                // verify
                expect(response).equal('true');
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
        });
    });

    describe('# createNewOrSelectAWSProfile check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| create profile or use existing profile decision by user', () => {
            // setup
            const listOfProfiles = ['ask', 'aws', 'lambda'];
            inquirer.prompt.resolves({ chosenProfile: 'lambda' });

            // call
            ui.createNewOrSelectAWSProfile(listOfProfiles, (response) => {
                // verify
                expect(response).equal('lambda');
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
        });
    });

    describe('# createNewProfile check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| valid profile name entered by user', () => {
            // setup
            inquirer.prompt.resolves({ profile: 'lambda' });

            // call
            ui.createNewProfile((error, response) => {
                // verify
                expect(error).equal(null);
                expect(response).equal('lambda');
            });
        });

        it('| invalid profile name entered by user', () => {
            // setup
            sinon.stub(profileHelper, 'askProfileSyntaxValidation').returns(false);
            inquirer.prompt.resolves({ profile: '  %*^@&!' });

            // call
            ui.createNewProfile((error, response) => {
                // verify
                expect(error).equal(messages.PROFILE_NAME_VALIDATION_ERROR);
                expect(response).equal(undefined);
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# chooseVendorId check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| vendor selection by user', () => {
            // setup
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
            inquirer.prompt.resolves({ selectedVendor: vendorInfo[0].vendorId });

            // call
            ui.chooseVendorId(VENDOR_PAGE_SIZE, vendorInfo, (response) => {
                // verify
                expect(response).equal('vendor_id1');
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
            sinon.restore();
        });
    });

    describe('# createOrUpdateProfile check', () => {
        const LIST_PAGE_SIZE = 50;
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
            sinon.stub(profileHelper, 'askProfileSyntaxValidation');
        });

        it('| create a new ASK profile', () => {
            // setup
            const listOfProfiles = [
                'askProfile1',
                'askProfile2'
            ];
            const createNewProfile = 'Create new profile';
            profileHelper.askProfileSyntaxValidation.withArgs(sinon.match.string).returns(true);
            inquirer.prompt.resolves({ profile: createNewProfile });

            // call
            ui.createOrUpdateProfile(LIST_PAGE_SIZE, listOfProfiles, (error) => {
                // verify
                expect(error).to.equal(null);
            });
        });

        it('| update an existing ASK profile by user', () => {
            // setup
            const listOfProfiles = [
                'askProfile1',
                'askProfile2',
                '#$*%#$(%$43'
            ];
            profileHelper.askProfileSyntaxValidation.withArgs(sinon.match.string).returns(true);
            inquirer.prompt.resolves({ profile: listOfProfiles[1] });

            // call
            ui.createOrUpdateProfile(LIST_PAGE_SIZE, listOfProfiles, (error, response) => {
                // verify
                expect(error).to.equal(null);
                expect(response).equal('askProfile2');
            });
        });

        it('| invalid profile name read from config file', (done) => {
            // setup
            const listOfProfiles = [
                'askProfile1',
                '#$*%#$(%$43'
            ];
            profileHelper.askProfileSyntaxValidation.withArgs(sinon.match.string).returns(false);
            inquirer.prompt.resolves({ profile: listOfProfiles[1] });

            // call
            ui.createOrUpdateProfile(LIST_PAGE_SIZE, listOfProfiles, (error, response) => {
                // verify
                expect(error).equal(messages.PROFILE_NAME_VALIDATION_ERROR);
                expect(response).to.equal(undefined);
                done();
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
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
            ui.requestAwsProfileName([], (response) => {
                // verify
                expect(response).equal('awsProfile');
                done();
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
        });
    });
});
