const { expect } = require('chai');
const sinon = require('sinon');
const AppConfig = require('@src/model/app-config');
const BeforeSendProcessor = require('@src/commands/smapi/before-send-processor');


describe('Smapi test - BeforeSendProcessor class tests', () => {
    const vendorId = 'some vendor id';
    const profile = 'test';
    const definitionRef = 'v1.someDefinition';
    const paramName = 'someParam';
    const commandName = 'some-command';
    beforeEach(() => {
        sinon.stub(AppConfig, 'getInstance').returns({
            getVendorId() {
                return vendorId;
            }
        });
    });
    it('| should add vendor id to body param', () => {
        const paramObject = {};
        const params = [{ in: 'body', name: paramName, required: true, schema: { $ref: `#/definitions/${definitionRef}` } }];
        const modelInterceptor = {
            operations: new Map([[commandName, { params }]]),
            definitions: new Map([[definitionRef, { properties: { vendorId: {} } }]])
        };

        const beforeSendProcessor = new BeforeSendProcessor(commandName, paramObject, modelInterceptor, profile);
        beforeSendProcessor.processAll();

        expect(paramObject[paramName].vendorId).eql(vendorId);
    });

    it('| should not add vendor id when no properties in reference object', () => {
        const paramObject = {};
        const params = [{ in: 'body', name: paramName, required: true, schema: { $ref: `#/definitions/${definitionRef}` } }];
        const modelInterceptor = {
            operations: new Map([[commandName, { params }]]),
            definitions: new Map([[definitionRef, { }]])
        };

        const beforeSendProcessor = new BeforeSendProcessor(commandName, paramObject, modelInterceptor, profile);
        beforeSendProcessor.processAll();

        expect(paramObject[paramName]).eql(undefined);
    });

    it('| should not add vendor id when no vendorId property in reference object', () => {
        const paramObject = {};
        const params = [{ in: 'body', name: paramName, required: true, schema: { $ref: `#/definitions/${definitionRef}` } }];
        const modelInterceptor = {
            operations: new Map([[commandName, { params }]]),
            definitions: new Map([[definitionRef, { properties: { someProperty: {} } }]])
        };

        const beforeSendProcessor = new BeforeSendProcessor(commandName, paramObject, modelInterceptor, profile);
        beforeSendProcessor.processAll();

        expect(paramObject[paramName]).eql(undefined);
    });

    it('| should add vendor id to non body param', () => {
        const paramObject = {};
        const params = [{ in: 'path', name: 'vendorId' }];
        const modelInterceptor = {
            operations: new Map([[commandName, { params }]]),
            definitions: new Map([[definitionRef, { properties: { vendorId: {} } }]])
        };

        const beforeSendProcessor = new BeforeSendProcessor(commandName, paramObject, modelInterceptor, profile);
        beforeSendProcessor.processAll();

        expect(paramObject.vendorId).eql(vendorId);
    });

    it('| should map testers emails', () => {
        const paramObject = { testersEmails: ['tester1', 'tester2'] };
        const params = [{ in: 'body', name: 'TestersRequest' }];
        const modelInterceptor = {
            operations: new Map([[commandName, { params }]]),
        };

        const beforeSendProcessor = new BeforeSendProcessor(commandName, paramObject, modelInterceptor, profile);
        beforeSendProcessor.processAll();

        const expected = { testers: [{ emailId: 'tester1' }, { emailId: 'tester2' }] };

        expect(paramObject.testersRequest).eql(expected);
        expect(paramObject.testersEmails).eql(undefined);
    });

    afterEach(() => {
        sinon.restore();
    });
});
