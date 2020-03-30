const { expect } = require('chai');
const sinon = require('sinon');
const AppConfig = require('@src/model/app-config');
const appendVendorId = require('@src/commands/smapi/customizations/hook-functions/append-vendor-id');


describe('Smapi hook functions test - appendVendorId tests', () => {
    const vendorId = 'some vendor id';
    const profile = 'test';
    beforeEach(() => {
        sinon.stub(AppConfig, 'getInstance').returns({
            getVendorId() {
                return vendorId;
            }
        });
    });
    it('| should append vendor id to createSkillRequest parameter', () => {
        const requestParameters = { createSkillRequest: {} };

        appendVendorId(requestParameters, profile);

        expect(requestParameters.createSkillRequest.vendorId).eql(vendorId);
    });

    it('| should append vendor id to createSkillRequest parameter', () => {
        const requestParameters = { createInSkillProductRequest: {} };

        appendVendorId(requestParameters, profile);

        expect(requestParameters.createInSkillProductRequest.vendorId).eql(vendorId);
    });

    it('| should append vendor id to requestParameters', () => {
        const requestParameters = { };

        appendVendorId(requestParameters, profile);

        expect(requestParameters.vendorId).eql(vendorId);
    });

    afterEach(() => {
        sinon.restore();
    });
});
