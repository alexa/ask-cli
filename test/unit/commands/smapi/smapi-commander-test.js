const { expect } = require('chai');
const sinon = require('sinon');
const { makeSmapiCommander } = require('@src/commands/smapi/smapi-commander');
const handler = require('@src/commands/smapi/smapi-command-handler');

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

    it('| should execute a command successfully', () => {
        sinon.stub(handler, 'smapiCommandHandler').resolves('some data');
        const commander = makeSmapiCommander();

        return commander.parseAsync(['', '', 'list-skills-for-vendor'])
            .then(res => expect(res[0]).eql('some data'));
    });

    it('| should propagate error if handler fails', () => {
        sinon.stub(handler, 'smapiCommandHandler').rejects(new Error('some error'));
        const commander = makeSmapiCommander();

        return commander.parseAsync(['', '', 'list-skills-for-vendor'])
            .then(res => expect(res).eql(undefined))
            .catch(err => expect(err.message).eql('some error'));
    });

    afterEach(() => {
        sinon.restore();
    });
});
