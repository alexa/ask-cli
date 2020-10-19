const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');
const AuthorizationController = require('@src/controllers/authorization-controller');
const RunCommand = require('@src/commands/run');
const optionModel = require('@src/commands/option-model');
const Messenger = require('@src/view/messenger');
const ResourcesConfig = require('@src/model/resources-config');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');
const helper = require('@src/commands/run/helper');
const SmapiClient = require('@src/clients/smapi-client');

const TEST_PROFILE = 'default';
const TEST_CMD = {
    profile: TEST_PROFILE
};
const RESOURCE_CONFIG_FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj');
const INVALID_RESOURCES_CONFIG_JSON_PATH = path.join(RESOURCE_CONFIG_FIXTURE_PATH, 'random-json-config.json');
const VALID_RESOURCES_CONFIG_JSON_PATH = path.join(RESOURCE_CONFIG_FIXTURE_PATH, 'ask-resources.json');

describe('Commands Run test - command class test', () => {
    const TEST_ERROR = 'error';
    let errorStub;
    let infoStub;
    beforeEach(() => {
        errorStub = sinon.stub();
        infoStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({
            error: errorStub,
            info: infoStub
        });
        sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').yields();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('| validate command information is set correctly', () => {
        const instance = new RunCommand(optionModel);
        expect(instance.name()).eq('run');
        expect(instance.description()).eq('Starts a local instance of your project as the skill endpoint.'
            + ' Automatically re-routes development requests and responses between the Alexa service and your local instance.');
        expect(instance.requiredOptions()).deep.eq([]);
        expect(instance.optionalOptions())
            .deep.eq(['debug-port', 'wait-for-attach', 'watch', 'region', 'profile', 'debug']);
    });
    describe('# validate command handle', () => {
        let instance;

        beforeEach(() => {
            instance = new RunCommand(optionModel);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| no resources config file found', (done) => {
            // setup
            const TEST_CMD_WITH_VALUES = {};
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(path, 'join').returns('fooPath');
            // call
            instance.handle(TEST_CMD_WITH_VALUES, (err) => {
                // verify
                expect(err.message)
                    .equal('File fooPath not exists. If this is a skill project managed by v1 ask-cli, '
                        + 'please run \'ask util upgrade-project\' then try the command again.');
                done();
            });
        });

        it('| unable to fetch skillId from resources config file', (done) => {
            // setup
            const TEST_CMD_WITH_VALUES = {};
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(path, 'join').returns(INVALID_RESOURCES_CONFIG_JSON_PATH);
            // call
            instance.handle(TEST_CMD_WITH_VALUES, (err) => {
                // verify
                expect(err.message)
                    .equal(`Failed to obtain skill-id for the given profile - ${TEST_PROFILE}. Please deploy you skill project first.`);
                done();
            });
        });

        it('| error while getting access token', (done) => {
            // setup
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(path, 'join').returns(VALID_RESOURCES_CONFIG_JSON_PATH);
            sinon.stub(ResourcesConfig.prototype, 'getSkillId').returns('TestSkillId');
            sinon.stub(RunCommand.prototype, '_getAccessTokenForProfile').yields(new Error(TEST_ERROR));

            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(errorStub.args[0][0].message).eq(TEST_ERROR);
                expect(err.message).eq(TEST_ERROR);
                done();
            });
        });

        it('| error while getting debug flow', (done) => {
            // setup
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            sinon.stub(path, 'join').returns(VALID_RESOURCES_CONFIG_JSON_PATH);
            sinon.stub(ResourcesConfig.prototype, 'getSkillId').returns('TestSkillId');
            sinon.stub(RunCommand.prototype, '_getAccessTokenForProfile').yields(null, {});
            sinon.stub(RunCommand.prototype, '_getSkillRunFlow').yields(new Error(TEST_ERROR));
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(errorStub.args[0][0].message).eq(TEST_ERROR);
                expect(err.message).eq(TEST_ERROR);
                done();
            });
        });
    });
    describe('_getSkillRunFlow test', () => {
        let instance;

        beforeEach(() => {
            instance = new RunCommand(optionModel);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('run flow for non-hosted skill', () => {
            beforeEach(() => {
                sinon.stub(ResourcesConfig.prototype, 'getSkillInfraType').returns(CONSTANTS.DEPLOYER_TYPE.CFN.NAME);
            });
            afterEach(() => {
                sinon.restore();
            });
            it('| getSkillCodeFolderName error', (done) => {
                sinon.stub(helper, 'getSkillCodeFolderName').throws(new Error(TEST_ERROR));

                instance._getSkillRunFlow('fooSkillId', 'fooProfile', CONSTANTS.ALEXA.REGION.DEFAULT, false, false,
                    false, CONSTANTS.RUN.DEFAULT_DEBUG_PORT, 'fooToken', CONSTANTS.ALEXA.REGION.NA, (err) => {
                        // verify
                        expect(err.message).eq(TEST_ERROR);
                        done();
                    });
            });

            it('| no user config', (done) => {
                sinon.stub(helper, 'getSkillCodeFolderName').returns('fooSkillFolderName');
                sinon.stub(ResourcesConfig.prototype, 'getSkillInfraUserConfig').returns(undefined);

                instance._getSkillRunFlow('fooSkillId', 'fooProfile', CONSTANTS.ALEXA.REGION.DEFAULT, false, false,
                    false, CONSTANTS.RUN.DEFAULT_DEBUG_PORT, 'fooToken', CONSTANTS.ALEXA.REGION.NA, (err) => {
                        // verify
                        expect(err.message).eq('Failed to obtain userConfig from project '
                            + `resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`);
                        done();
                    });
            });

            it('| empty user config', (done) => {
                sinon.stub(helper, 'getSkillCodeFolderName').returns('fooSkillFolderName');
                sinon.stub(ResourcesConfig.prototype, 'getSkillInfraUserConfig').returns({});

                instance._getSkillRunFlow('fooSkillId', 'fooProfile', CONSTANTS.ALEXA.REGION.DEFAULT, false, false,
                    false, CONSTANTS.RUN.DEFAULT_DEBUG_PORT, 'fooToken', CONSTANTS.ALEXA.REGION.NA, (err) => {
                        // verify
                        expect(err.message).eq('Cannot read property \'includes\' of undefined');
                        done();
                    });
            });

            it('| error in getting skill flow instance', (done) => {
                sinon.stub(helper, 'getSkillCodeFolderName').returns('fooSkillFolderName');
                sinon.stub(ResourcesConfig.prototype, 'getSkillInfraUserConfig').returns({ runtime: CONSTANTS.RUNTIME.JAVA, handler: 'fooHandler' });
                sinon.stub(helper, 'getSkillFlowInstance').throws(new Error(TEST_ERROR));

                instance._getSkillRunFlow('fooSkillId', 'fooProfile', CONSTANTS.ALEXA.REGION.DEFAULT, false, false,
                    false, CONSTANTS.RUN.DEFAULT_DEBUG_PORT, 'fooToken', CONSTANTS.ALEXA.REGION.NA, (err) => {
                        // verify
                        expect(err.message).eq(TEST_ERROR);
                        done();
                    });
            });
        });
        describe('run flow for hosted skill', () => {
            beforeEach(() => {
                sinon.stub(ResourcesConfig.prototype, 'getSkillInfraType').returns(CONSTANTS.DEPLOYER_TYPE.HOSTED.NAME);
            });

            it('| error in getting hosted skill runtime', (done) => {
                sinon.stub(RunCommand.prototype, '_getHostedSkillRuntime').yields(new Error(TEST_ERROR));

                instance._getSkillRunFlow('fooSkillId', 'fooProfile', CONSTANTS.ALEXA.REGION.DEFAULT, false, false,
                    false, CONSTANTS.RUN.DEFAULT_DEBUG_PORT, 'fooToken', CONSTANTS.ALEXA.REGION.NA, (err) => {
                        // verify
                        expect(err.message).eq(TEST_ERROR);
                        done();
                    });
            });

            it('| error in getting skill flow instance', (done) => {
                sinon.stub(RunCommand.prototype, '_getHostedSkillRuntime').yields(null, 'fooRuntime');
                sinon.stub(helper, 'getSkillFlowInstance').throws(new Error(TEST_ERROR));

                instance._getSkillRunFlow('fooSkillId', 'fooProfile', CONSTANTS.ALEXA.REGION.DEFAULT, false, false,
                    false, CONSTANTS.RUN.DEFAULT_DEBUG_PORT, 'fooToken', CONSTANTS.ALEXA.REGION.NA, (err) => {
                        // verify
                        expect(err.message).eq(TEST_ERROR);
                        done();
                    });
            });
        });
    });

    describe('_getHostedSkillRuntime test', () => {
        let instance;

        beforeEach(() => {
            instance = new RunCommand(optionModel);
        });
        afterEach(() => {
            sinon.restore();
        });
        const smapiClient = new SmapiClient({
            TEST_PROFILE,
            doDebug: false
        });
        it('| getAlexaHostedSkillMetadata error', (done) => {
            sinon.stub(smapiClient.skill.alexaHosted, 'getAlexaHostedSkillMetadata').yields(new Error(TEST_ERROR));
            instance._getHostedSkillRuntime(smapiClient, 'fooSkillId', (err) => {
                expect(err.message).eq(TEST_ERROR);
                done();
            });
        });

        it('| getAlexaHostedSkillMetadata empty response', (done) => {
            sinon.stub(smapiClient.skill.alexaHosted, 'getAlexaHostedSkillMetadata').yields(null, {});
            instance._getHostedSkillRuntime(smapiClient, 'fooSkillId', (err) => {
                expect(err.message).eq('Cannot read property \'alexaHosted\' of undefined');
                done();
            });
        });

        it('| getAlexaHostedSkillMetadata empty runtime value', (done) => {
            sinon.stub(smapiClient.skill.alexaHosted, 'getAlexaHostedSkillMetadata').yields(null, {
                body: {
                    alexaHosted: {
                        runtime: ''
                    }
                }
            });
            instance._getHostedSkillRuntime(smapiClient, 'fooSkillId', (err) => {
                expect(err.message).eq('Unable to determine runtime of the hosted skill - fooSkillId');
                done();
            });
        });
    });
});
