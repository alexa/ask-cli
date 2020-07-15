const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const AuthorizationController = require('@src/controllers/authorization-controller');
const DialogCommand = require('@src/commands/dialog');
const helper = require('@src/commands/dialog/helper');
const httpClient = require('@src/clients/http-client');
const InteractiveMode = require('@src/commands/dialog/interactive-mode');
const optionModel = require('@src/commands/option-model');
const ResourcesConfig = require('@src/model/resources-config');
const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');

describe('Commands Dialog test - command class test', () => {
    const TEST_ERROR = 'error';
    const DIALOG_FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'dialog');
    const RESOURCE_CONFIG_FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj');
    const DIALOG_REPLAY_FILE_JSON_PATH = path.join(DIALOG_FIXTURE_PATH, 'dialog-replay-file.json');
    const INVALID_DIALOG_REPLAY_FILE_JSON_PATH = path.join(DIALOG_FIXTURE_PATH, 'invalid-dialog-replay-file.json');
    const INVALID_RESOURCES_CONFIG_JSON_PATH = path.join(RESOURCE_CONFIG_FIXTURE_PATH, 'random-json-config.json');
    const VALID_RESOURCES_CONFIG_JSON_PATH = path.join(RESOURCE_CONFIG_FIXTURE_PATH, 'ask-resources.json');
    const VALID_MANIFEST_JSON_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'manifest.json');
    const TEST_PROFILE = 'default';
    const TEST_CMD = {
        profile: TEST_PROFILE
    };

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
        const instance = new DialogCommand(optionModel);
        expect(instance.name()).eq('dialog');
        expect(instance.description()).eq('simulate your skill via an interactive dialog with Alexa');
        expect(instance.requiredOptions()).deep.eq([]);
        expect(instance.optionalOptions()).deep.eq(['skill-id', 'locale', 'stage', 'replay', 'save-skill-io', 'profile', 'debug']);
    });

    describe('# validate command handle', () => {
        let instance;
        let spinnerStartStub;
        let spinnerTerminateStub;

        beforeEach(() => {
            spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');
            spinnerTerminateStub = sinon.stub(SpinnerView.prototype, 'terminate');
            instance = new DialogCommand(optionModel);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| error while creating dialogMode', (done) => {
            // setup
            sinon.stub(DialogCommand.prototype, '_getDialogConfig').yields(new Error(TEST_ERROR));

            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(errorStub.args[0][0].message).eq(TEST_ERROR);
                expect(err.message).eq(TEST_ERROR);
                done();
            });
        });

        it('| error while validating dialog arguments', (done) => {
            // setup
            sinon.stub(DialogCommand.prototype, '_getDialogConfig').yields();
            sinon.stub(DialogCommand.prototype, '_dialogModeFactory');
            sinon.stub(helper, 'validateDialogArgs').callsArgWith(1, TEST_ERROR);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).eq(TEST_ERROR);
                expect(spinnerStartStub.calledOnce).eq(true);
                expect(spinnerStartStub.args[0][0]).eq('Checking if skill is ready to simulate...');
                expect(spinnerTerminateStub.calledOnce).eq(true);
                expect(spinnerTerminateStub.args[0][0]).eq(SpinnerView.TERMINATE_STYLE.FAIL);
                expect(spinnerTerminateStub.args[0][1]).eq('Failed to validate command options');
                expect(errorStub.args[0][0]).eq(TEST_ERROR);
                done();
            });
        });

        it('| dialogMode returns error', (done) => {
            // setup
            sinon.stub(DialogCommand.prototype, '_getDialogConfig').yields(null, {});
            sinon.stub(InteractiveMode.prototype, 'start').callsArgWith(0, TEST_ERROR);
            sinon.stub(helper, 'validateDialogArgs').callsArgWith(1, null);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).eq(TEST_ERROR);
                expect(spinnerStartStub.calledOnce).eq(true);
                expect(spinnerStartStub.args[0][0]).eq('Checking if skill is ready to simulate...');
                expect(spinnerTerminateStub.calledOnce).eq(true);
                expect(errorStub.args[0][0]).eq(TEST_ERROR);
                done();
            });
        });

        it('| dialog command successfully completes execution', (done) => {
            // setup
            sinon.stub(DialogCommand.prototype, '_getDialogConfig').yields(null, {});
            sinon.stub(InteractiveMode.prototype, 'start').callsArgWith(0, null);
            sinon.stub(helper, 'validateDialogArgs').callsArgWith(1, null);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).eq(undefined);
                expect(spinnerStartStub.calledOnce).eq(true);
                expect(spinnerStartStub.args[0][0]).eq('Checking if skill is ready to simulate...');
                expect(spinnerTerminateStub.calledOnce).eq(true);
                done();
            });
        });
    });

    describe('# test _getDialogConfig', () => {
        let instance;
        let manifest;

        beforeEach(() => {
            instance = new DialogCommand(optionModel);
            manifest = { publishingInformation: { locales: { us: {} } } };
        });

        describe('# test with replay option', () => {
            it('| empty skillId throws error', (done) => {
                // setup
                const TEST_CMD_WITH_VALUES = {
                    stage: 'development',
                    replay: INVALID_DIALOG_REPLAY_FILE_JSON_PATH
                };
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(httpClient, 'request').yields(null, { statusCode: 200, body: { manifest } });
                // call
                instance.handle(TEST_CMD_WITH_VALUES, (err) => {
                    // verify
                    expect(err.message).eq('Replay file must contain skillId');
                    done();
                });
            });

            it('| empty locale throws error', (done) => {
                // setup
                const TEST_CMD_WITH_VALUES = {
                    stage: '',
                    replay: INVALID_DIALOG_REPLAY_FILE_JSON_PATH
                };
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(httpClient, 'request').yields(null, { statusCode: 200, body: { manifest } });
                const stringUtilsStub = sinon.stub(stringUtils, 'isNonBlankString');
                stringUtilsStub.onCall(0).returns('skillId');
                // call
                instance.handle(TEST_CMD_WITH_VALUES, (err) => {
                    // verify
                    expect(err.message).eq('Replay file must contain locale');
                    done();
                });
            });

            it('| invalid user inputs throws error', (done) => {
                // setup
                const TEST_CMD_WITH_VALUES = {
                    stage: '',
                    replay: INVALID_DIALOG_REPLAY_FILE_JSON_PATH
                };
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(httpClient, 'request').yields(null, { statusCode: 200, body: { manifest } });
                const stringUtilsStub = sinon.stub(stringUtils, 'isNonBlankString');
                stringUtilsStub.onCall(0).returns('skillId');
                stringUtilsStub.onCall(1).returns('locale');
                // call
                instance.handle(TEST_CMD_WITH_VALUES, (err) => {
                    // verify
                    expect(err.message).eq("Replay file's userInput cannot contain empty string.");
                    done();
                });
            });

            it('| returns valid config', (done) => {
                // setup
                const TEST_CMD_WITH_VALUES = {
                    stage: '',
                    replay: DIALOG_REPLAY_FILE_JSON_PATH
                };
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(httpClient, 'request').yields(null, { statusCode: 200, body: { manifest } });
                // call
                instance._getDialogConfig(TEST_CMD_WITH_VALUES, (err, config) => {
                    // verify
                    expect(config.debug).equal(false);
                    expect(config.locale).equal('en-US');
                    expect(config.profile).equal('default');
                    expect(config.replay).equal(DIALOG_REPLAY_FILE_JSON_PATH);
                    expect(config.skillId).equal('amzn1.ask.skill.1234567890');
                    expect(config.stage).equal('development');
                    expect(config.userInputs).deep.equal(['hello', 'world']);
                    done();
                });
            });

            it('| returns return error when smapi get manifest call fails', (done) => {
                // setup
                const TEST_CMD_WITH_VALUES = {
                    stage: '',
                    replay: DIALOG_REPLAY_FILE_JSON_PATH
                };
                const smapiError = 'error';
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(httpClient, 'request').yields(smapiError);
                // call
                instance._getDialogConfig(TEST_CMD_WITH_VALUES, (err) => {
                    // verify
                    expect(err).eq(smapiError);
                    done();
                });
            });

            it('| returns return error when smapi get manifest call returns failure http status code', (done) => {
                // setup
                const TEST_CMD_WITH_VALUES = {
                    stage: '',
                    replay: DIALOG_REPLAY_FILE_JSON_PATH
                };
                const smapiError = 'error';
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(httpClient, 'request').yields(null, { statusCode: 400, body: { message: smapiError } });
                // call
                instance._getDialogConfig(TEST_CMD_WITH_VALUES, (err) => {
                    // verify
                    expect(err).eq(jsonView.toString({ message: smapiError }));
                    done();
                });
            });
        });

        describe('# test with default (interactive) option', () => {

            it('| no resources config file found', (done) => {
                // setup
                const TEST_CMD_WITH_VALUES = {};
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(path, 'join').returns(INVALID_RESOURCES_CONFIG_JSON_PATH);
                sinon.stub(ResourcesConfig.prototype, 'getSkillId').throws(new Error());
                // call
                instance.handle(TEST_CMD_WITH_VALUES, (err) => {
                    // verify
                    expect(err.message).equal('Failed to read project resource file. Please run the command within a ask-cli project.');
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
                    expect(err.message).equal(`Failed to obtain skill-id from project resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}`);
                    done();
                });
            });

            it('| check valid values are returned in interactive mode', (done) => {
                // setup
                const TEST_CMD_WITH_VALUES = {};
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(httpClient, 'request').yields(null, { statusCode: 200, body: { manifest } });
                const pathJoinStub = sinon.stub(path, 'join');
                pathJoinStub.withArgs(
                    process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG
                ).returns(VALID_RESOURCES_CONFIG_JSON_PATH);
                pathJoinStub.withArgs(
                    './skillPackage', CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST
                ).returns(VALID_MANIFEST_JSON_PATH);
                path.join.callThrough();
                process.env.ASK_DEFAULT_DEVICE_LOCALE = 'en-US';
                // call
                instance._getDialogConfig(TEST_CMD_WITH_VALUES, (err, config) => {
                // verify
                    expect(config.debug).equal(false);
                    expect(config.locale).equal('en-US');
                    expect(config.profile).equal('default');
                    expect(config.replay).equal(undefined);
                    expect(config.skillId).equal('amzn1.ask.skill.1234567890');
                    expect(config.stage).equal('development');
                    expect(config.userInputs).equal(undefined);
                    done();
                });
            });

            it('| check locale defaults to first value from manifest', (done) => {
                // setup
                const [expectedLocale] = Object.keys(manifest.publishingInformation.locales);
                const TEST_CMD_WITH_VALUES = {};
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(httpClient, 'request').yields(null, { statusCode: 200, body: { manifest } });
                const pathJoinStub = sinon.stub(path, 'join');
                pathJoinStub.withArgs(
                    process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG
                ).returns(VALID_RESOURCES_CONFIG_JSON_PATH);
                path.join.callThrough();

                // call
                instance._getDialogConfig(TEST_CMD_WITH_VALUES, (err, config) => {
                // verify
                    expect(config.debug).equal(false);
                    expect(infoStub.args[0][0]).eq(`Defaulting locale to the first value from the skill manifest: ${expectedLocale}`);
                    expect(config.locale).equal(expectedLocale);
                    expect(config.profile).equal('default');
                    expect(config.replay).equal(undefined);
                    expect(config.skillId).equal('amzn1.ask.skill.1234567890');
                    expect(config.stage).equal('development');
                    expect(config.userInputs).equal(undefined);
                    done();
                });
            });

            afterEach(() => {
                sinon.restore();
                delete process.env.ASK_DEFAULT_DEVICE_LOCALE;
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# test _validateUserInputs', () => {
        let instance;

        beforeEach(() => {
            instance = new DialogCommand(optionModel);
        });

        it('| all valid inputs', () => {
            // setup
            const userInputs = [' open hello world ', 'help'];

            // call
            const validatedInputs = instance._validateUserInputs(userInputs);

            // verify
            expect(validatedInputs).deep.equal(['open hello world', 'help']);
        });
    });
});
