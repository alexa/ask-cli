const { expect } = require('chai');
const sinon = require('sinon');
const SmapiHooks = require('@src/commands/smapi/customizations/smapi-hooks');


describe('Smapi customization test - SmapiHooks class tests', () => {
    it('| should return object with hook events', () => {
        const events = SmapiHooks.hookEvents;

        expect(events).be.an('object');
    });

    it('| should return hook function', () => {
        const hookEvent = 'testHook';
        sinon.stub(Map.prototype, 'get')
            .onFirstCall()
            .returns(new Map([[hookEvent, () => {}]]))
            .onSecondCall()
            .returns(() => {});

        const hookFunction = SmapiHooks.getFunction('testOperation', hookEvent);

        expect(hookFunction).be.an('Function');
    });

    it('| should return null when there is no operation defined', () => {
        sinon.stub(Map.prototype, 'get');

        const hookFunction = SmapiHooks.getFunction('testOperation', 'testHook');

        expect(hookFunction).eql(null);
    });

    it('| should return null when there is no event defined', () => {
        const hookEvent = 'testHook';
        sinon.stub(Map.prototype, 'get')
            .onFirstCall()
            .returns(new Map([[hookEvent, () => {}]]));

        const hookFunction = SmapiHooks.getFunction('testOperation', 'testHook');

        expect(hookFunction).eql(null);
    });

    afterEach(() => {
        sinon.restore();
    });
});
