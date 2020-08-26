const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');

const profileHelper = require('@src/utils/profile-helper');
const AppConfig = require('@src/model/app-config');

describe('Model test - app config test', () => {
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const APP_CONFIG_PATH = path.join(FIXTURE_PATH, 'app-config.json');
    const APP_CONFIG_NO_PROFILES_PATH = path.join(FIXTURE_PATH, 'app-config-no-profiles.json');
    const YAML_APP_CONFIG_PATH = path.join(FIXTURE_PATH, 'app-config.yaml');

    describe('# inspect correctness for constructor, getInstance and dispose', () => {
        beforeEach(() => {
            sinon.stub(profileHelper, 'isEnvProfile').returns(false);
        });

        const NOT_EXISTING_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'out-of-noWhere.json');
        const INVALID_JSON_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'invalid-json.json');

        it('| initiate as a AppConfig class', () => {
            const appConfig = new AppConfig(APP_CONFIG_PATH);
            expect(appConfig).to.be.instanceof(AppConfig);
        });

        it('| make sure AppConfig class is singleton', () => {
            const config1 = new AppConfig(APP_CONFIG_PATH);
            const config2 = new AppConfig(APP_CONFIG_PATH);
            expect(config1 === config2);
        });

        it('| make sure YAML and JSON resources config can both be created well', () => {
            const yamlConfig = new AppConfig(YAML_APP_CONFIG_PATH);
            const jsonConfig = jsonfile.readFileSync(APP_CONFIG_PATH);
            expect(yamlConfig.content).deep.equal(jsonConfig);
        });

        it('| get instance function return the instance constructed before', () => {
            const appConfig = new AppConfig(APP_CONFIG_PATH);
            expect(AppConfig.getInstance() === appConfig).equal(true);
        });

        it('| dispose the instance correctly', () => {
            new AppConfig(APP_CONFIG_PATH);
            AppConfig.dispose();
            expect(AppConfig.getInstance()).equal(null);
        });

        it('| init with a file path not existing, expect correct error message thrown', () => {
            try {
                new AppConfig(NOT_EXISTING_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `File ${NOT_EXISTING_PROJECT_CONFIG_PATH} not exists.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        it('| init with a file path without access permission, expect correct error message thrown', () => {
            // setup
            fs.chmodSync(APP_CONFIG_PATH, 0o111);
            try {
                // call
                new AppConfig(APP_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                // verify
                const expectedError = `No access to read/write file ${APP_CONFIG_PATH}.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            } finally {
                // clear
                fs.chmodSync(APP_CONFIG_PATH, 0o644);
            }
        });

        it('| init with a invalid json file, expect correct error message thrown', () => {
            try {
                new AppConfig(INVALID_JSON_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `Failed to parse JSON file ${INVALID_JSON_PROJECT_CONFIG_PATH}.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        afterEach(() => {
            AppConfig.dispose();
            sinon.restore();
        });
    });

    describe('# inspect getter and setter for each field', () => {
        const TEST_PROFILE = 'testProfile';

        beforeEach(() => {
            sinon.stub(profileHelper, 'isEnvProfile').returns(false);
            new AppConfig(APP_CONFIG_PATH);
        });

        [
            {
                field: 'AwsProfile',
                profile: TEST_PROFILE,
                newValue: 'awsProfile new',
                oldValue: 'awsProfile'
            },
            {
                field: 'Token',
                profile: TEST_PROFILE,
                newValue: 'token new',
                oldValue: {
                    access_token: 'accessToken',
                    refresh_token: 'refreshToken',
                    token_type: 'bearer',
                    expires_in: 3600,
                    expires_at: 'expiresAt'
                }
            },
            {
                field: 'VendorId',
                profile: TEST_PROFILE,
                newValue: 'vendorId new',
                oldValue: 'vendorId'
            }
        ].forEach(({
            field,
            profile,
            newValue,
            oldValue
        }) => {
            it(`test get${field} function successfully`, () => {
                expect(AppConfig.getInstance()[`get${field}`](profile)).deep.equal(oldValue);
            });

            it(`test set${field} function successfully`, () => {
                AppConfig.getInstance()[`set${field}`](profile, newValue);
                expect(AppConfig.getInstance()[`get${field}`](profile)).equal(newValue);
            });
        });

        it('test getMachineId function successfully', () => {
            expect(AppConfig.getInstance().getMachineId()).deep.equal('machineId');
        });

        it('test setMachineId function successfully', () => {
            AppConfig.getInstance().setMachineId('new Machine id');
            expect(AppConfig.getInstance().getMachineId()).equal('new Machine id');
        });

        it('test getShareUsage function successfully', () => {
            expect(AppConfig.getInstance().getShareUsage()).deep.equal(false);
        });

        it('test getShareUsage when property is not set', () => {
            sinon.stub(AppConfig.prototype, 'getProperty').returns();
            expect(AppConfig.getInstance().getShareUsage()).deep.equal(true);
        });

        afterEach(() => {
            AppConfig.dispose();
            sinon.restore();
        });
    });

    describe('# inspect getter when using profile from env', () => {
        const TEST_PROFILE = 'testProfile';

        beforeEach(() => {
            process.env.ASK_ACCESS_TOKEN = 'testAccessTokenFromEnv';
            process.env.ASK_REFRESH_TOKEN = 'testRefreshTokenFromEnv';
            process.env.ASK_VENDOR_ID = 'testVendorIdFromEnv';
            sinon.stub(profileHelper, 'isEnvProfile').returns(true);
            new AppConfig();
        });

        it('| should get tokens with values from env variables', () => {
            const token = AppConfig.getInstance().getToken(TEST_PROFILE);
            expect(token.access_token).eql(process.env.ASK_ACCESS_TOKEN);
            expect(token.refresh_token).eql(process.env.ASK_REFRESH_TOKEN);
        });

        it('| should get vendor id from env variable', () => {
            const vendorId = AppConfig.getInstance().getVendorId(TEST_PROFILE);
            expect(vendorId).eql(process.env.ASK_VENDOR_ID);
        });

        afterEach(() => {
            delete process.env.ASK_ACCESS_TOKEN;
            delete process.env.ASK_REFRESH_TOKEN;
            delete process.env.ASK_VENDOR_ID;
            AppConfig.dispose();
            sinon.restore();
        });
    });

    describe('# inspect correctness of getProfilesList', () => {
        it('| test with empty profiles config file, expect empty array', () => {
            // setup
            new AppConfig(APP_CONFIG_NO_PROFILES_PATH);

            // call & verify
            expect(AppConfig.getInstance().getProfilesList().length).to.equal(0);
        });

        it('| test with valid profiles config file, expect array of objects', () => {
            // setup
            new AppConfig(APP_CONFIG_PATH);

            // call & verify
            expect(AppConfig.getInstance().getProfilesList().length).to.equal(2);
            expect(AppConfig.getInstance().getProfilesList()).to.deep.equal([{ askProfile: 'testProfile', awsProfile: 'awsProfile' },
                { askProfile: 'default', awsProfile: 'default' }]);
        });

        afterEach(() => {
            AppConfig.dispose();
        });
    });

    describe('# inspect correctness of configFileExists', () => {
        it('| returns true if config file exists', () => {
            sinon.stub(fs, 'existsSync').returns(true);

            expect(AppConfig.configFileExists()).to.equal(true);
        });

        it('| returns false if config file does not exist', () => {
            sinon.stub(fs, 'existsSync').returns(false);

            expect(AppConfig.configFileExists()).to.equal(false);
        });

        afterEach(() => {
            sinon.restore();
        });
    });
});
