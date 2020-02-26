const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');

describe('View test - cli repl view test', () => {
    const TEST_MESSAGE = 'TEST_MESSAGE';
    let infoStub;
    let removeListenersStub;
    let defineCommandStub;
    let onStub;
    let replStub;
    let closeStub;

    beforeEach(() => {
        infoStub = sinon.stub();
        removeListenersStub = sinon.stub();
        defineCommandStub = sinon.stub();
        onStub = sinon.stub();
        closeStub = sinon.stub();
        replStub = {
            start: () => ({
                removeAllListeners: removeListenersStub,
                commands: {
                    help: 'help'
                },
                defineCommand: defineCommandStub,
                on: onStub,
                close: closeStub
            })
        };
        sinon.stub(Messenger, 'getInstance').returns({
            info: infoStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('# inspect correctness of the constructor', () => {
        it('| initialize CliReplView with custom prompt', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });

            // call
            new ProxyCliReplView({ prompt: TEST_MESSAGE });

            // verify
            expect(removeListenersStub.callCount).equal(3);
            expect(defineCommandStub.callCount).equal(1);
            expect(onStub.callCount).equal(1);
        });

        it('| initialize with custom headers array', () => {
            // setup
            const header = TEST_MESSAGE;
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });

            // call
            const cliReplView = new ProxyCliReplView({ header });

            // verify
            expect(cliReplView.header).equal(header);
        });

        it('| initialize with custom eval function', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const evalFunc = (cmd, context, filename, callback) => {
                callback(null, 'Hello');
            };

            // call
            const cliReplView = new ProxyCliReplView({ evalFunc });

            // verify
            expect(cliReplView.eval).equal(evalFunc);
        });

        it('| initialize with custom footer array', () => {
            // setup
            const footer = TEST_MESSAGE;
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });

            // call
            const cliReplView = new ProxyCliReplView({ footer });

            // verify
            expect(cliReplView.footer).equal(footer);
        });

        it('| throw error if configuration is undefined', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            try {
                // call
                new ProxyCliReplView();
            } catch (err) {
                // verify
                expect(err).to.match(new RegExp('Cannot have an undefined configuration.'));
            }
        });

        it('| throw error if invalid prompt is passed', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const prompt = 1234;
            try {
                // call
                new ProxyCliReplView({ prompt });
            } catch (err) {
                // verify
                expect(err).to.match(new RegExp('Prompt must be a non-empty string.'));
            }
        });
    });

    describe('# inspect correctness of methods', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| printHeaderFooter call with default options okay.', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const cliReplView = new ProxyCliReplView({});

            // call
            cliReplView.printHeaderFooter(cliReplView.header);

            // verify
            expect(infoStub.callCount).equal(0);
        });

        it('| printHeaderFooter call with custom header option okay.', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const cliReplView = new ProxyCliReplView({ header: TEST_MESSAGE });

            // call
            cliReplView.printHeaderFooter(cliReplView.header);

            // verify
            expect(infoStub.callCount).equal(2);
        });

        it('| printHeaderFooter call with invalid header does print.', () => {
            // setup
            const header = () => {};
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const cliReplView = new ProxyCliReplView({ header });

            // call
            cliReplView.printHeaderFooter(cliReplView.header);

            // verify
            expect(infoStub.callCount).equal(0);
        });

        it('| registerCommand successful', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const cliReplView = new ProxyCliReplView({});
            const command = { help: TEST_MESSAGE, action: () => {} };

            // call
            cliReplView.registerSpecialCommand(TEST_MESSAGE, command.help, command.action);

            // verify
            expect(defineCommandStub.callCount).equal(2);
            expect(defineCommandStub.args[0][0]).equal('quit');
            expect(defineCommandStub.args[0][1].help).equal('Quit repl session.');
            expect(defineCommandStub.args[1][0]).equal(TEST_MESSAGE);
        });

        it('| test close method', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const cliReplView = new ProxyCliReplView({});
            const spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');

            // call
            cliReplView.startProgressSpinner(TEST_MESSAGE);
            cliReplView.close();

            // verify
            expect(spinnerStartStub.calledOnce).equal(true);
            expect(closeStub.calledOnce).equal(true);
        });

        it('| test registerQuitFunction method', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const spinnerTerminateStub = sinon.stub(SpinnerView.prototype, 'terminate');
            const cliReplView = new ProxyCliReplView({});
            replStub.start().on.callsArgWith(1, '');
            const closeEventListener = sinon.stub();

            // call
            cliReplView.registerQuitCommand(closeEventListener);

            // verify
            expect(onStub.callCount).equal(2);
            expect(removeListenersStub.callCount).equal(4);
            expect(defineCommandStub.callCount).equal(2);
            expect(defineCommandStub.args[0][1].help).equal('Quit repl session.');
            expect(defineCommandStub.args[1][0]).equal('quit');
            expect(closeEventListener.callCount).equal(1);
            expect(spinnerTerminateStub.callCount).equal(1);
        });

        it('| test clearSpecialCommands method', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const cliReplView = new ProxyCliReplView({});

            // call
            cliReplView.clearSpecialCommands();

            // verify
            expect(removeListenersStub.callCount).equal(4);
            expect(removeListenersStub.args[0][0]).equal('SIGINT');
            expect(removeListenersStub.args[1][0]).equal('close');
        });
    });

    describe('# inspect correctness of spinner view wrapper methods', () => {
        it('| updateProgressSpinner okay.', () => {
            // setup
            const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const cliReplView = new ProxyCliReplView({});
            const spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');
            const spinnerUpdateStub = sinon.stub(SpinnerView.prototype, 'update');

            // call
            cliReplView.startProgressSpinner(TEST_MESSAGE);
            cliReplView.updateProgressSpinner(UPDATE_MESSAGE);

            // verify
            expect(spinnerStartStub.calledOnce).equal(true);
            expect(spinnerStartStub.args[0][0]).equal(TEST_MESSAGE);
            expect(spinnerUpdateStub.calledOnce).equal(true);
            expect(spinnerUpdateStub.args[0][0]).equal(UPDATE_MESSAGE);
        });

        it('| terminateProgressSpinner okay.', () => {
            // setup
            const ProxyCliReplView = proxyquire('@src/view/cli-repl-view', {
                repl: replStub
            });
            const cliReplView = new ProxyCliReplView({});

            // call
            const spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');
            const spinnerTerminateStub = sinon.stub(SpinnerView.prototype, 'terminate');
            cliReplView.startProgressSpinner(TEST_MESSAGE);
            cliReplView.terminateProgressSpinner();

            // verify
            expect(spinnerStartStub.callCount).equal(1);
            expect(spinnerStartStub.args[0][0]).equal(TEST_MESSAGE);
            expect(spinnerTerminateStub.callCount).equal(1);
        });
    });
});
