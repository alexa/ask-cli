const { expect } = require('chai');
const sinon = require('sinon');

const InteractiveMode = require('@src/commands/dialog/interactive-mode');
const DialogController = require('@src/controllers/dialog-controller');
const DialogReplView = require('@src/view/dialog-repl-view');

describe('# Command: Dialog - Interactive Mode test ', () => {
    const TEST_ERROR = 'error';
    const dialogReplViewPrototype = Object.getPrototypeOf(DialogReplView);

    afterEach(() => {
        Object.setPrototypeOf(DialogReplView, dialogReplViewPrototype);
        sinon.restore();
    });

    it('| test interactive mode start, dialog repl view creation throws error', () => {
        // setup
        const dialogReplViewStub = sinon.stub().throws(new Error(TEST_ERROR));
        Object.setPrototypeOf(DialogReplView, dialogReplViewStub);
        const interactiveMode = new InteractiveMode({});
        // call
        interactiveMode.start((error) => {
            // verify
            expect(error.message).equal(TEST_ERROR);
        });
    });

    it('| test interactive mode start, setupSpecialCommands throws error', () => {
        // setup
        const dialogReplViewStub = sinon.stub();
        Object.setPrototypeOf(DialogReplView, dialogReplViewStub);
        sinon.stub(DialogController.prototype, 'setupSpecialCommands').callsArgWith(1, TEST_ERROR);
        const interactiveMode = new InteractiveMode({});
        // call
        interactiveMode.start((error) => {
            // verify
            expect(error).equal(TEST_ERROR);
        });
    });
});
