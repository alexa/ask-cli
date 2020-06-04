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
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'hosted-proj', 'ask-resources.json');

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
            const repository = {
                repository: {
                    type: 'GIT',
                    url: 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/5555555-4444-3333-2222-1111111111'
                }
            };
            ResourcesConfig.getInstance().setSkillInfraDeployState(TEST_PROFILE, repository);
        });

        describe('command handle - before get git credentials', () => {
            it('| when called from git and operation is not get, expect error out', (done) => {
                // setup
                const remaining = ['not supported operation'];
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    const expectedErr = `The ask-cli git credentials helper doesn't support operation "${remaining[0]}".`;
                    expect(err).equal(expectedErr);
                    expect(errorStub.args[0][0]).equal(expectedErr);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                }, remaining);
            });

            it('| when called from git and operation is store, expect do nothing', (done) => {
                // setup
                const remaining = ['store'];
                // call
                instance.handle(TEST_CMD, () => {
                    // verify
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                }, remaining);
            });

            it('| when called from git and operation is erase, expect do nothing', (done) => {
                // setup
                const remaining = ['erase'];
                // call
                instance.handle(TEST_CMD, () => {
                    // verify
                    expect(errorStub.callCount).equal(0);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                }, remaining);
            });

            it('| when profile is not correct, expect throw error', (done) => {
                // setup
                profileHelper.runtimeProfile.throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, () => {
                    // verify
                    expect(errorStub.args[0][0].message).equal('error');
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
                instance.handle(TEST_CMD, () => {
                    // verify
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR_MESSAGE);
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
                instance.handle(TEST_CMD, () => {
                    // verify
                    expect(errorStub.args[0][0]).equal(jsonView.toString({ error: TEST_ERROR_MESSAGE }));
                    done();
                });
            });

            it('| get git credentials succeed, expect correct output', (done) => {
                // setup
                const TEST_STATUS_CODE = 200;
                const TEST_USERNAME = 'TEST_USERNAME';
                const TEST_PASSWORD = 'TEST_PASSWORD';
                const GET_METADATA_RESPONSE = {
                    statusCode: TEST_STATUS_CODE,
                    headers: {},
                    body: {
                        alexaHosted: {
                            repository: {
                                url: 'test'
                            }
                        }
                    }
                };
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

                sinon.stub(httpClient, 'request')
                    .onFirstCall()
                    .yields(null, GET_METADATA_RESPONSE)
                    .onSecondCall()
                    .yields(null, GET_STATUS_RESPONSE);

                // call
                instance.handle(TEST_CMD, () => {
                    // verify
                    expect(infoStub.args[0][0]).equal(`username=${TEST_USERNAME}\npassword=${TEST_PASSWORD}`);
                    done();
                });
            });
        });
    });
});
