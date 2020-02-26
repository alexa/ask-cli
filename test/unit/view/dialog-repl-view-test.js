const { expect } = require('chai');
const sinon = require('sinon');

const DialogReplView = require('@src/view/dialog-repl-view');
const Messenger = require('@src/view/messenger');

describe('View test - dialog repl view test', () => {
    const TEST_MESSAGE = 'TEST_MESSAGE';

    describe('# inspect correctness of the constructor', () => {
        const infoStub = sinon.stub();
        beforeEach(() => {
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| throw exception for initialization with non-String headers arg', () => {
            // setup
            const header = 123;
            try {
                // call
                new DialogReplView({ header });
            } catch (err) {
                // verify
                expect(err).to.match(new RegExp('TypeError: arg.split is not a function'));
            }
        });

        it('| throw exception for initialization with empty configuration', () => {
            // setup
            try {
                // call
                new DialogReplView();
            } catch (err) {
                // verify
                expect(err).to.match(new RegExp('TypeError: arg.split is not a function'));
            }
        });

        it('| test prettifyHeaderFooter returns correct string', () => {
            // setup
            const header = TEST_MESSAGE;
            const dialogReplView = new DialogReplView({ header });
            process.stdout.columns = 20;

            // call
            const prettifiedHeader = dialogReplView.prettifyHeaderFooter(header).trim();

            // verify
            expect(prettifiedHeader.length).equal(20);
        });

        it('| test prettifyHeaderFooter returns correct string when terminal is too small', () => {
            // setup
            const header = TEST_MESSAGE;
            const dialogReplView = new DialogReplView({ header });
            process.stdout.columns = 10;

            // call & verify
            expect(dialogReplView.prettifyHeaderFooter(header).trim().length).equal(20);
        });

        it('| test record special command registered without error', () => {
            // setup
            const dialogReplView = new DialogReplView({});

            // call
            dialogReplView.registerRecordCommand(() => {});

            // verify
            expect(dialogReplView.replServer.commands.record.help).deep.equal(
                'Record input utterances to a replay file of a specified name.'
            );
            expect(dialogReplView.replServer.commands.record.action).to.be.a('Function');
        });
    });
});
