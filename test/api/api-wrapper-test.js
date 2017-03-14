'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const jsonRead = require('../../lib/utils/json-read');

const apiWrapper = require('../../lib/api/api-wrapper');

describe('api api-wrapper testing', () => {

    beforeEach(() => {
        sinon.stub(jsonRead, 'readFile');
        sinon.stub(jsonRead, 'getProperty');
        sinon.stub(fs, 'existsSync');
    });

    afterEach(() => {
        jsonRead.readFile.restore();
        jsonRead.getProperty.restore();
        fs.existsSync.restore();
    });

    describe('# create-skill', () => {
        it ('| quit when failing to read skill.json', (done) => {
            jsonRead.readFile.returns(null);
            apiWrapper.callCreateSkill('test', done);
            expect(fs.existsSync.called).equal(false);
            done();
        });

        it ('| warn when config file not exists', (done) => {
            jsonRead.readFile.returns(true);
            fs.existsSync.returns(false);
            sinon.stub(console, 'warn');
            apiWrapper.callCreateSkill('test', done);
            expect(console.warn.getCall(0).args[0]).equal(
                'Please make sure ~/.ask/cli_config exists.'
            );
            console.warn.restore();
            done();
        });
    });

    describe('# update-skill', () => {
        it ('| quit when failing to read skill.json', (done) => {
            sinon.stub(JSON, 'stringify');
            jsonRead.readFile.returns(null);
            apiWrapper.callCreateSkill('test', done);
            expect(JSON.stringify.called).equal(false);
            JSON.stringify.restore();
            done();
        });
    });

    describe('# update-model', () => {
        it ('| quit when failing to read model.json', (done) => {
            sinon.stub(JSON, 'stringify');
            jsonRead.readFile.returns(null);
            apiWrapper.callCreateSkill('test', done);
            expect(JSON.stringify.called).equal(false);
            JSON.stringify.restore();
            done();
        });
    });
});
