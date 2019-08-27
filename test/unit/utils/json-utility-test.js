'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const jsonUtility = require('../../../lib/utils/json-utility');
const jsonfile = require('jsonfile');


describe('utils json-utility testing', () => {
    describe('# read file', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            sandbox.stub(console, 'error');
            sandbox.stub(process, 'exit');
        });
        afterEach(() => {
            sandbox.restore();
        });

        it('| read invalid file, return error and exit', () => {
            jsonUtility.read('../fixture/jsonRead/bad.json');
            expect(console.error.getCall(0).args[0]).equal(
                'Invalid json: ../fixture/jsonRead/bad.json'
            );
            expect(process.exit.getCall(0).args[0]).equal(1);
        });

        it('| read in valid json file', () => {
            sinon.stub(jsonfile, 'readFileSync');
            jsonfile.readFileSync.returns({'test': '123'});
            let content = jsonUtility.read('../valid_file_path');
            expect(content).to.be.an('object');
            jsonfile.readFileSync.restore();
        });
    });

    describe('# write file', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            sandbox.stub(console, 'error');
            sandbox.stub(process, 'exit');
        });
        afterEach(() => {
            sandbox.restore();
        });

        it('| read invalid file, return error and exit', () => {
            jsonUtility.write('../fixture/jsonRead/bad.json');
            expect(console.error.getCall(0).args[0]).equal(
                'Invalid file, cannot write to: ../fixture/jsonRead/bad.json'
            );
            expect(process.exit.getCall(0).args[0]).equal(1);
        });

        it('| read in valid json file', () => {
            sinon.stub(jsonfile, 'writeFileSync');
            jsonUtility.write('../valid_file_path');
            expect(jsonfile.writeFileSync.calledOnce).equal(true);
            jsonfile.writeFileSync.restore();
        });
    });

    describe('# get/write/delete property in json object level', () => {
        let TEST_JSON_OBJECT;
        beforeEach(() => {
            TEST_JSON_OBJECT = {
                a: {
                    b: {
                        c: 123
                    }
                }
            };
        });

        describe('* getPropertyValueFromObject', () => {
            it('| target property not exist, function return null', () => {
                let testResult = jsonUtility.getPropertyValueFromObject(TEST_JSON_OBJECT, ['a', 'c', 'b']);
                expect(testResult).to.be.null;
            });

            it('| target property exist, return the property value', () => {
                let testResult = jsonUtility.getPropertyValueFromObject(TEST_JSON_OBJECT, ['a', 'b', 'c']);
                expect(testResult).equal(123);
            });
        });

        describe('* deletePropertyFromJsonObject', () => {
            it('| target property not exist, return false/undefinited', () => {
                let testResult1 = jsonUtility.deletePropertyFromJsonObject(TEST_JSON_OBJECT, ['a', 'b', 'd', 'e', 'f']);
                expect(testResult1).to.be.not.ok;

                let testResult2 = jsonUtility.deletePropertyFromJsonObject(TEST_JSON_OBJECT, ['a', 'c']);
                expect(testResult2).to.be.not.ok;
            });

            it('| target property exist, delete that property', () => {
                jsonUtility.deletePropertyFromJsonObject(TEST_JSON_OBJECT, ['a', 'b', 'c']);
                expect(TEST_JSON_OBJECT.a.b.c).to.be.undefined;
            });
        });

        describe('* insertObjectToObject', () => {
            let sandbox;
            beforeEach(() => {
                sandbox = sinon.sandbox.create();
                sandbox.stub(console, 'error');
                sandbox.stub(process, 'exit');
            });

            afterEach(() => {
                sandbox.restore();
            });

            it('| override property to a non-object property value before hit the last node in the target path', () => {
                jsonUtility.insertObjectToObject(TEST_JSON_OBJECT, ['a', 'b', 'c', 'd', 'e', 'f'], 321);

                expect(console.error.getCall(0).args[0]).equal('[Error]: cannot add property to non-object value.' +
                    ' Please correct your target path');
                expect(process.exit.getCall(0).args[0]).equal(1);
            });

            it('| override property to a non-object property value on the last node', () => {
                jsonUtility.insertObjectToObject(TEST_JSON_OBJECT, ['a', 'b', 'c', 'd'], 321);

                expect(console.error.getCall(0).args[0]).equal('[Error]: cannot add property to non-object value.' +
                    ' Please correct your target path');
                expect(process.exit.getCall(0).args[0]).equal(1);
            });

            it('| target property not exist, function will create property along the given path', () => {
                jsonUtility.insertObjectToObject(TEST_JSON_OBJECT, ['z'], 321);
                expect(TEST_JSON_OBJECT.z).equal(321);
            })

            it('| target property exist, override the value', () => {
                jsonUtility.insertObjectToObject(TEST_JSON_OBJECT, ['a', 'b', 'c'], 321);
                expect(TEST_JSON_OBJECT.a.b.c).equal(321);
            });
        });
    });

    describe('# get/write/delete property directly to a file', () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            sandbox.stub(jsonfile, 'readFileSync');
            sandbox.stub(jsonfile, 'writeFileSync');
            jsonfile.readFileSync.returns({'a': 1});
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('| write property from file', () => {
            jsonUtility.writeToProperty('fake_path', ['c'], {'b': 2});
            expect(jsonfile.readFileSync.calledOnce).to.be.true;
            expect(jsonfile.writeFileSync.calledOnce).to.be.true;
        });

        it('| get property from file', () => {
            jsonUtility.getProperty('fake_path', ['a']);
            expect(jsonfile.readFileSync.calledOnce).to.be.true;
        });

        it('| delete property from file', () => {
            jsonUtility.deleteProperty('fake_path', ['a']);
            expect(jsonfile.readFileSync.calledOnce).to.be.true;
            expect(jsonfile.writeFileSync.calledOnce).to.be.true;
        });
    });
});
