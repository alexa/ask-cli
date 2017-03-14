'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const jsonRead = require('../../lib/utils/json-read');


describe('utils json-read testing', () => {
    describe('# read file', () => {
        beforeEach(() => {
            sinon.stub(console, 'error');
        });

        afterEach(() => {
            console.error.restore();
        });

        it('| try to read a invalid json file', () => {
            jsonRead.readFile('../fixture/jsonRead/bad.json');
            expect(console.error.getCall(0).args[0]).equal(
                'Invalid json: ../fixture/jsonRead/bad.json'
            );
        });
    });

    describe('# read property from json file', () => {
        let testObject;

        before(() => {
            testObject = {
                "skillDefinition": {
                    "customInteractionModelInfo": {
                        "invocationNameByLocale": {
                            "en-US": "hello world"
                        },
                        "endpointsByRegion": {
                            "NA": {
                                "isDefaultRegion": true
                            }
                        }
                    }
                }
            };
        });

        it('| return null when try to get a not existed property', () => {
            sinon.stub(console, 'log');
            expect(jsonRead.getProperty(testObject, '.invalid.path')).equal(null);
            console.log.restore();
        });

        it('| return correct property for the following example', () => {
            let track = '.skillDefinition.customInteractionModelInfo.endpointsByRegion.NA.isDefaultRegion';
            expect(jsonRead.getProperty(testObject, track)).equal(true);
        });
    });
});
