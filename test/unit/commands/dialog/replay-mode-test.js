const { expect } = require('chai');
const sinon = require('sinon');

const InteractiveMode = require('@src/commands/dialog/interactive-mode');
const ReplayMode = require('@src/commands/dialog/replay-mode');
const DialogController = require('@src/controllers/dialog-controller');
const DialogReplView = require('@src/view/dialog-repl-view');

describe('# Command: Dialog - Replay Mode test ', () => {
    const TEST_ERROR = 'error';
    const dialogReplViewPrototype = Object.getPrototypeOf(DialogReplView);

    afterEach(() => {
        Object.setPrototypeOf(DialogReplView, dialogReplViewPrototype);
        sinon.restore();
    });

    it('| test replay mode start, dialog repl view creation throws error', () => {
        // setup
        const dialogReplViewStub = sinon.stub().throws(new Error(TEST_ERROR));
        Object.setPrototypeOf(DialogReplView, dialogReplViewStub);
        const replayMode = new ReplayMode({});

        // call
        replayMode.start((error) => {
            // verify
            expect(error.message).equal(TEST_ERROR);
        });
    });

    it('test replay mode start, setupSpecialCommands throws error', () => {
        // setup
        const dialogReplViewStub = sinon.stub().callsFake();
        Object.setPrototypeOf(DialogReplView, dialogReplViewStub);
        sinon.stub(DialogController.prototype, 'setupSpecialCommands').callsArgWith(1, TEST_ERROR);
        const replayMode = new ReplayMode({
            userInputs: ['hello']
        });

        // call
        replayMode.start((error) => {
            // verify
            expect(error).equal(TEST_ERROR);
        });
    });

    describe('# test _evaluateInput', () => {
        let replayCallbackStub;

        beforeEach(() => {
            replayCallbackStub = sinon.stub();
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| continue in replay mode', () => {
            // setup
            const replayMode = new ReplayMode({
                userInputs: ['hello']
            });
            const inputStream = [];
            sinon.stub(DialogController.prototype, 'evaluateUtterance').callsArgWith(2, '');

            // call
            replayMode._evaluateInput({}, {}, inputStream, replayCallbackStub, () => {});

            // verify
            expect(inputStream[0]).equal('hello\n');
            expect(replayCallbackStub.calledOnce).equal(true);
        });

        it('| switch to interactive mode', () => {
            // setup
            const config = {
                userInputs: []
            };
            const replayMode = new ReplayMode(config);
            const clearSpecialCommandsStub = sinon.stub();
            const replViewCloseStub = sinon.stub();
            const replViewStub = {
                clearSpecialCommands: clearSpecialCommandsStub,
                close: replViewCloseStub
            };
            const inputStream = [];
            sinon.stub(DialogController.prototype, 'evaluateUtterance').callsArgWith(2, '');
            const interactiveStartStub = sinon.stub(InteractiveMode.prototype, 'start');
            // call
            replayMode._evaluateInput({}, replViewStub, inputStream, replayCallbackStub, () => {});

            // verify
            expect(inputStream.length).equal(0);
            expect(clearSpecialCommandsStub.calledOnce).equal(true);
            expect(replViewCloseStub.calledOnce).equal(true);
            expect(config.header).equal('Switching to interactive dialog.\n'
            + 'To automatically quit after replay, append \'.quit\' to the userInput of your replay file.\n');
            expect(interactiveStartStub.calledOnce).equal(true);
        });
    });
});
