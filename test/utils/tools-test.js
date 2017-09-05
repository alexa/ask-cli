'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const crypto = require('crypto');
const fs = require('fs');

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

        it('| should separately escape from skill definition', () => {
            sinon.stub(JSON, 'parse');
            JSON.parse.returns({skillManifest: 'skill'});
            tools.convertDataToJsonObject('data');
            expect(JSON.parse.callCount).equal(1);
            JSON.parse.restore();
        });

        it('| should separately escape from model definition', () => {
            sinon.stub(JSON, 'parse');
            JSON.parse.returns({modelDefinition: 'model'});
            tools.convertDataToJsonObject('data');
            expect(JSON.parse.callCount).equal(1);
            JSON.parse.restore();
        });

        it('| should separately escape from account linking information', () => {
            sinon.stub(JSON, 'parse');
            JSON.parse.returns({accountLinkingInfo: 'account linking'});
            tools.convertDataToJsonObject('data');
            expect(JSON.parse.callCount).equal(1);
            JSON.parse.restore();
        });
    });

    describe('# remove directory', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.sandbox.create();

            sandbox.stub(fs, 'existsSync');
            sandbox.stub(fs, 'readdirSync');
            sandbox.stub(fs, 'rmdirSync');
            sandbox.stub(fs, 'unlinkSync');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('| no remove call if directory does not exist', () => {
            tools.removeDirectory('path');
            fs.existsSync.returns(false);
            expect(fs.rmdirSync.callCount).equal(0);
        });
    });

    describe('# generate SID', () => {
        beforeEach(() => {
            sinon.stub(crypto, 'randomBytes');
        });

        afterEach(() => {
            crypto.randomBytes.restore();
        });

        it('| call 5 times of crypto in total', () => {
            crypto.randomBytes.returns('256');
            tools.generateSID();
            expect(crypto.randomBytes.callCount).equal(5);
        });
    });
});
