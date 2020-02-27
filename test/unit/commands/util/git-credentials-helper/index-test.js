const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');

const AuthorizationController = require('@src/controllers/authorization-controller');
const GitCredentialsHelperCommand = require('@src/commands/util/git-credentials-helper');
const httpClient = require('@src/clients/http-client');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const ResourcesConfig = require('@src/model/resources-config');

describe('Commands git-credentials-helper test - command class test', () => {
    const TEST_PROFILE = 'default';
    const TEST_DEBUG = false;
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'hosted-skill-resources-config.json');

    let infoStub;
    let errorStub;
    let warnStub;

    beforeEach(() => {
        infoStub = sinon.stub();
        errorStub = sinon.stub();
        warnStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({
            info: infoStub,
            error: errorStub,
            warn: warnStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('| validate command information is set correctly', () => {
        const instance = new GitCredentialsHelperCommand(optionModel);
        expect(instance.name()).equal('git-credentials-helper');
        expect(instance.description()).equal('gets git credentials for hosted skill repository');
        expect(instance.requiredOptions()).deep.equal([]);
        expect(instance.optionalOptions()).deep.equal(['profile', 'debug']);
    });

    describe('validate command handle', () => {
        const TEST_CMD = {
            profile: TEST_PROFILE,
            debug: TEST_DEBUG
        };
        const TEST_ERROR_MESSAGE = 'ERROR';
        const ERROR = new Error(TEST_ERROR_MESSAGE);
        let instance;
        beforeEach(() => {
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            instance = new GitCredentialsHelperCommand(optionModel);
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('command handle - before get git credentials', () => {
            it('| when profile is not correct, expect throw error', (done) => {
                // setup
                profileHelper.runtimeProfile.throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('error');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - request to get git credentials', () => {
            beforeEach(() => {
                sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            });

            it('| get git credentials fails, expect throw error', (done) => {
                // setup
                sinon.stub(path, 'join').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
                sinon.stub(httpClient, 'request').callsArgWith(3, ERROR); // stub getGitCredentials request
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR_MESSAGE);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| get git credentials response with status code >= 300, expect throw error', (done) => {
                // setup
                const GET_STATUS_ERROR = {
                    statusCode: 403,
                    body: {
                        error: TEST_ERROR_MESSAGE
                    }
                };
                sinon.stub(path, 'join').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
                sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_STATUS_ERROR); // stub getGitCredentials request
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(jsonView.toString({ error: TEST_ERROR_MESSAGE }));
                    done();
                });
            });

            it('| get git credentials succeed, expect correct output', (done) => {
                // setup
                const TEST_STATUS_CODE = 200;
                const TEST_USERNAME = 'TEST_USERNAME';
                const TEST_PASSWORD = 'TEST_PASSWORD';
                const GET_STATUS_RESPONSE = {
                    statusCode: TEST_STATUS_CODE,
                    headers: {},
                    body: {
                        repositoryCredentials: {
                            username: TEST_USERNAME,
                            password: TEST_PASSWORD
                        }
                    }
                };
                sinon.stub(path, 'join').returns(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
                sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_STATUS_RESPONSE); // stub getGitCredentials request
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(Messenger.getInstance().info.args[0][0]).equal(`username=${TEST_USERNAME}
password=${TEST_PASSWORD}`);
                    done();
                });
            });
        });
    });
});
