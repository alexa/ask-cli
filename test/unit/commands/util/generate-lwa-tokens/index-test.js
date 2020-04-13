const { expect } = require('chai');
const sinon = require('sinon');

const AuthorizationController = require('@src/controllers/authorization-controller');
const configureUi = require('@src/commands/configure/ui');
const GenerateLwaTokensCommand = require('@src/commands/util/generate-lwa-tokens');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');

describe('Commands generate-lwa-tokens test - command class test', () => {
    const TEST_DEBUG = false;

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
        const instance = new GenerateLwaTokensCommand(optionModel);
        expect(instance.name()).equal('generate-lwa-tokens');
        expect(instance.description()).equal('generate Login with Amazon tokens from any LWA client');
        expect(instance.requiredOptions()).deep.equal([]);
        expect(instance.optionalOptions()).deep.equal(['client-id', 'client-confirmation', 'scopes', 'no-browser', 'debug']);
    });

    describe('validate command handle', () => {
        const TEST_CLIENT_ID = 'client id';
        const TEST_CLIENT_CONFIRMATION = 'client confirmation';
        const TEST_SCOPES = 'scopes1 scopes2';
        const TEST_ERROR = 'error';
        const TEST_AUTHORIZE_URL = 'authorize url';
        const TEST_AUTH_CODE = 'auth code';
        const TEST_ACCESS_TOKEN = {
            access_token: 'AToken'
        };
        let instance;

        beforeEach(() => {
            sinon.stub(configureUi, 'getAuthCode');
            sinon.stub(AuthorizationController.prototype, 'getAuthorizeUrl');
            sinon.stub(AuthorizationController.prototype, 'getAccessTokenUsingAuthCode');
            sinon.stub(AuthorizationController.prototype, 'getTokensByListeningOnPort');
            instance = new GenerateLwaTokensCommand(optionModel);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('command handle - no browser approach', () => {
            it('| ui get authCode fails with error, expect error displayed', (done) => {
                // setup
                const TEST_CMD = {
                    browser: false,
                    debug: TEST_DEBUG
                };
                AuthorizationController.prototype.getAuthorizeUrl.returns(TEST_AUTHORIZE_URL);
                configureUi.getAuthCode.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(1);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| lwa controller fails to get accessToken with the input authCode, expect error displayed', (done) => {
                // setup
                const TEST_CMD = {
                    browser: false,
                    debug: TEST_DEBUG
                };
                AuthorizationController.prototype.getAuthorizeUrl.returns(TEST_AUTHORIZE_URL);
                configureUi.getAuthCode.callsArgWith(0, null, TEST_AUTH_CODE);
                AuthorizationController.prototype.getAccessTokenUsingAuthCode.callsArgWith(1, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(1);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| no-browser flow succeeds, expect ui displays properly', (done) => {
                // setup
                const TEST_CMD = {
                    clientId: TEST_CLIENT_ID,
                    clientConfirmation: TEST_CLIENT_CONFIRMATION,
                    scopes: TEST_SCOPES,
                    browser: false,
                    debug: TEST_DEBUG
                };
                AuthorizationController.prototype.getAuthorizeUrl.returns(TEST_AUTHORIZE_URL);
                configureUi.getAuthCode.callsArgWith(0, null, TEST_AUTH_CODE);
                AuthorizationController.prototype.getAccessTokenUsingAuthCode.callsArgWith(1, null, TEST_ACCESS_TOKEN);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal(`Paste the following url to your browser:\n    ${TEST_AUTHORIZE_URL}`);
                    expect(infoStub.args[1][0]).equal('\nThe LWA tokens result:');
                    expect(infoStub.args[2][0]).equal(jsonView.toString(TEST_ACCESS_TOKEN));
                    expect(errorStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - use browser approach', () => {
            it('| lwa controller fails to get token by listening, expect error displayed', (done) => {
                // setup
                const TEST_CMD = {
                    debug: TEST_DEBUG
                };
                AuthorizationController.prototype.getTokensByListeningOnPort.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| flow with browser succeeds, expect ui displays token info properly', (done) => {
                // setup
                const TEST_CMD = {
                    clientId: TEST_CLIENT_ID,
                    clientConfirmation: TEST_CLIENT_CONFIRMATION,
                    scopes: TEST_SCOPES,
                    debug: TEST_DEBUG
                };
                AuthorizationController.prototype.getTokensByListeningOnPort.callsArgWith(0, null, TEST_ACCESS_TOKEN);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('The LWA tokens result:');
                    expect(infoStub.args[1][0]).equal(jsonView.toString(TEST_ACCESS_TOKEN));
                    expect(errorStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });
    });
});
