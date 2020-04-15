const { expect } = require('chai');
const sinon = require('sinon');
const { makeSmapiCommander } = require('@src/commands/smapi/smapi-commander');


describe('Smapi test - makeSmapiCommander function', () => {
    beforeEach(() => {
        sinon.stub(process, 'exit');
        sinon.stub(console, 'error');
    });

    it('| should create instance of commander', () => {
        const commander = makeSmapiCommander();

        expect(commander._name).eql('ask smapi');
        expect(commander.commands.length).gt(0);
    });

    it('| should show command not recognized for unknown command', async () => {
        const commander = makeSmapiCommander();

        commander.emit('command:*');

        expect(console.error.calledWithMatch('Command not recognized')).eql(true);
    });

    afterEach(() => {
        sinon.restore();
    });
});
