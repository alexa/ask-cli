const { expect } = require('chai');
const { SmapiDocs } = require('@src/commands/smapi/smapi-docs');
const { makeSmapiCommander } = require('@src/commands/smapi/smapi-commander');

describe('Smapi test - Smapi Docs class', () => {
    it('| should generate view data from existing smapi commander', () => {
        const commander = makeSmapiCommander();

        const docs = new SmapiDocs(commander);

        const viewData = docs.generateViewData();

        expect(viewData.baseCommand).a('string');
        expect(viewData.smapiCommandDescription).a('string');
        expect(viewData.commands).instanceof(Array);
        expect(viewData.commands.length).above(1);
        expect(viewData.commands[0].options).instanceof(Array);
    });

    it('| should generate view data commands list from a commander', () => {
        const parentCommandName = 'ask smapi';
        const commandName = 'generate-something';
        const commandDescription = 'command description';
        const optionDescription = 'some option description';
        const optionOneFlags = '-c,--catalog-id <catalog-id>';
        const optionTwoFlags = '--profile <profile>';
        const commander = {
            _name: parentCommandName,
            commands: [
                {
                    _name: commandName,
                    _description: commandDescription,
                    options: [
                        { flags: optionOneFlags, description: optionDescription },
                        { flags: optionTwoFlags, mandatory: false }
                    ]
                }
            ]
        };

        const docs = new SmapiDocs(commander);
        const viewData = docs.generateViewData();

        const expectedCommands = [{ name: commandName,
            description: `${commandDescription}.`,
            optionsString: '[-c|--catalog-id <catalog-id>] [--profile <profile>]',
            options: [
                { name: optionOneFlags, description: `${optionDescription}.` },
                { name: optionTwoFlags, description: '' }] }];

        expect(viewData.commands).eql(expectedCommands);
    });
});
