const { expect } = require('chai');
const sinon = require('sinon');

const AutocompleteCommand = require('@src/commands/autocomplete');
const Helper = require('@src/commands/autocomplete/helper');
const Messenger = require('@src/view/messenger');

describe('Commands autocomplete - index test', () => {
    const commanders = [];
    let infoStub;

    beforeEach(() => {
        infoStub = sinon.stub(Messenger.getInstance(), 'info');
    });

    it('should set up autocomplete', () => {
        const autoCompleteCommander = AutocompleteCommand.makeAutoCompleteCommander(commanders);

        expect(autoCompleteCommander.name()).eq('autocomplete');
        expect(autoCompleteCommander.description()).eq('sets up ask cli terminal auto completion');
        expect(autoCompleteCommander.commands.map(c => c.name())).eql(['setup', 'cleanup', 'reload']);
    });

    it('should trigger autocomplete set up', () => {
        const setUpAutoCompleteStub = sinon.stub(Helper.prototype, 'setUpAutoComplete');
        const autoCompleteCommander = AutocompleteCommand.makeAutoCompleteCommander(commanders);

        autoCompleteCommander.parse(['', '', 'setup']);

        expect(setUpAutoCompleteStub.callCount).eq(1);
        expect(infoStub.args[0][0]).eq('Successfully set up auto completion. Please, reload the terminal.');
    });

    it('should trigger autocomplete reload', () => {
        const reloadAutoCompleteHintsStub = sinon.stub(Helper.prototype, 'reloadAutoCompleteHints');
        const autoCompleteCommander = AutocompleteCommand.makeAutoCompleteCommander(commanders);

        autoCompleteCommander.parse(['', '', 'reload']);

        expect(reloadAutoCompleteHintsStub.callCount).eq(1);
        expect(infoStub.args[0][0]).eq('Successfully regenerated the hints file.');
    });

    it('should trigger autocomplete clean up', () => {
        const cleanUpAutoCompleteStub = sinon.stub(Helper.prototype, 'cleanUpAutoComplete');
        const autoCompleteCommander = AutocompleteCommand.makeAutoCompleteCommander(commanders);

        autoCompleteCommander.parse(['', '', 'cleanup']);

        expect(cleanUpAutoCompleteStub.callCount).eq(1);
        expect(infoStub.args[0][0]).eq('Successfully removed auto completion. Please, reload the terminal.');
    });

    it('should initialize auto complete', () => {
        const initAutoCompleteStub = sinon.stub(Helper.prototype, 'initAutoComplete');
        AutocompleteCommand.initAutoComplete();

        expect(initAutoCompleteStub.callCount).eq(1);
    });

    afterEach(() => {
        sinon.restore();
    });
});
