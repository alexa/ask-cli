'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const tools = require('../../lib/utils/tools');

describe('utils tools testing', () => {
    describe('# convert data to json object', () => {
        beforeEach(() => {
            sinon.stub(console, 'error');
        });

        afterEach(() => {
            console.error.restore();
        });

        it('| display error message when data can not be parsed', () => {
            tools.convertDataToJsonObject('invalid data');
            expect(console.error.getCall(0).args[0]).equal('Failed to parse the API response.');
        });
    });
});
