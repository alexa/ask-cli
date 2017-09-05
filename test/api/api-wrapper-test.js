'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const jsonRead = require('../../lib/utils/json-read');
const oauthWrapper = require('../../lib/utils/oauth-wrapper');
const fs = require('fs');
const jsonUtility = require('../../lib/utils/json-utility');

const apiWrapper = require('../../lib/api/api-wrapper');

describe('api api-wrapper testing', () => {
    let sandbox;
    let emptyCallback = () => {};
    const TEST_PROFILE = 'test';

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        sandbox.stub(jsonRead, 'readFile');
        sandbox.stub(jsonRead, 'getProperty');
        sandbox.stub(fs, 'existsSync');
        sandbox.stub(oauthWrapper, 'tokenRefreshAndRead');
        sandbox.stub(jsonUtility, 'getProperty');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('# create-skill', () => {
        it ('| quit when failing to take in skillSchema as the input', () => {
            apiWrapper.callCreateSkill(null, TEST_PROFILE, emptyCallback);
            expect(fs.existsSync.called).equal(false);
        });

        it ('| warn correctly when config file does not exist', () => {
            sandbox.stub(console, 'warn');
            fs.existsSync.returns(false);
            apiWrapper.callCreateSkill('test', TEST_PROFILE, emptyCallback);
            expect(console.warn.getCall(0).args[0]).equal(
                'Please make sure ~/.ask/cli_config exists.'
            );
        });

        it ('| quit when vendorId cannot found inside ask profile', ()=> {
            jsonUtility.getProperty.returns(null);
            apiWrapper.callCreateSkill('test', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.called).equal(false);
        });

        // it ('| will finally make a request to create skill', () => {
        //     fs.existsSync.returns(true);
        //     jsonUtility.getProperty.returns('vendorId');
        //     apiWrapper.callCreateSkill('test', TEST_PROFILE, emptyCallback);
        //     expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        // });
    });

    describe('# get-skill', () => {
        it ('| will finally make a request to get skill', () => {
            apiWrapper.callGetSkill('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# update-skill', () => {
        it ('| quit when failing to read skill.json', () => {
            sinon.stub(JSON, 'stringify');
            jsonRead.readFile.returns(null);
            apiWrapper.callCreateSkill('skill-id', TEST_PROFILE, emptyCallback);
            expect(JSON.stringify.called).equal(false);
            JSON.stringify.restore();
        });

        it ('| will finally make a request to update skill', () => {
            jsonRead.readFile.returns(true);
            apiWrapper.callUpdateSkill('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# get-model', () => {
        it ('| will finally make a request to get model', () => {
            apiWrapper.callGetModel('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# head-model', () => {
        it ('| will finally make a request to head model', () => {
            apiWrapper.callHeadModel('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# update-model', () => {
        // it ('| quit when failing to read model.json', () => {
        //     sinon.stub(JSON, 'stringify');
        //     jsonRead.readFile.returns(null);
        //     apiWrapper.callUpdateModel('skill-id', TEST_PROFILE, emptyCallback);
        //     expect(JSON.stringify.called).equal(false);
        //     JSON.stringify.restore();
        // });

        it ('| will finally make a request to update skill', () => {
            jsonRead.readFile.returns(true);
            apiWrapper.callUpdateModel('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# get-model-status', () => {
        it ('| will finally make a request to get model build status', () => {
            apiWrapper.callGetModelStatus('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# create-account-linking', () => {
        it ('| will finally make a request to create account linking', () => {
            apiWrapper.callCreateAccountLinking('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# get-account-linking', () => {
        it ('| will finally make a request to get account linking', () => {
            apiWrapper.callGetAccountLinking('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# list-vendors', () => {
        it ('| will finally make a request to get list of vendors', () => {
            apiWrapper.callListVendor('skill-id', TEST_PROFILE, emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });

    describe('# list-skills', () => {
        it ('| send list-skills request without nextToken', () => {
            // act
            apiWrapper.callListSkills(123, null, 50, TEST_PROFILE, emptyCallback);

            // assert
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
            let arg = oauthWrapper.tokenRefreshAndRead.getCall(0).args[0];
            expect(arg.method).equal('GET');
            expect(arg.url.includes('/skills?vendorId=123&maxResults=50')).equal(true);
        });

        it ('| send list-skills request with nextToken', () => {
            // act
            apiWrapper.callListSkills(123, 321, 50, TEST_PROFILE, emptyCallback);

            // assert
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
            let arg = oauthWrapper.tokenRefreshAndRead.getCall(0).args[0];
            expect(arg.method).equal('GET');
            expect(arg.url.includes('/skills?vendorId=123&nextToken=321&maxResults=50')).equal(true);
        });
    });


    describe('# simulate-skill', () => {
         it ('| verify the request params are correct with file input', (done) => {
            //set up
            sandbox.stub(fs, 'readFileSync').returns('Simulation Content');

            //act
            apiWrapper.callSimulateSkill('file', null, '12345', 'en-us', TEST_PROFILE, done);

            //assert
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
            let arg = oauthWrapper.tokenRefreshAndRead.getCall(0).args[0];
            expect(arg.method).equal('POST');
            expect(arg.url.includes('/skills/12345/simulations')).equal(true);
            expect(arg.json).equal(true);
            expect(arg.body.input.content).equal('Simulation Content');
            expect(arg.body.device.locale).equal('en-us');
            done();
        });

        it ('| verify the request params are correct with text input', (done) => {
            //act
            apiWrapper.callSimulateSkill(null, 'Simulation Content', '12345', 'en-us', TEST_PROFILE, done);

            //assert
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
            let arg = oauthWrapper.tokenRefreshAndRead.getCall(0).args[0];
            expect(arg.method).equal('POST');
            expect(arg.url.includes('/skills/12345/simulations')).equal(true);
            expect(arg.json).equal(true);
            expect(arg.body.input.content).equal('Simulation Content');
            expect(arg.body.device.locale).equal('en-us');
            done();
        });
    });

    describe('# get-simulation', () => {
        it ('| verify the request params are correct', (done) => {
            //set up
            jsonRead.readFile.returns(true);
            fs.existsSync.returns(true);
            jsonRead.getProperty.returns('vendorId');

            //act
            apiWrapper.callGetSimulation('12345', '67890', done);

            //assert
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
            let arg = oauthWrapper.tokenRefreshAndRead.getCall(0).args[0];
            expect(arg.method).equal('GET');
            expect(arg.url.includes('/skills/67890/simulations/12345')).equal(true);
            expect(arg.json).equal(false);
            expect(arg.body).equal(null);
            done();
        });
    });

    describe('# invoke-skill', () => {
        it ('| verify the request params are correct with file input', (done) => {
            let requestBody = {
              "session": {
                "sessionId": "SessionId.e12ea327-6752-4679-bf85-c65692a91c2b",
                "application": {
                  "applicationId": "amzn1.ask.skill.0c24c87b-434d-43d8-a227-8c7e52a4e819"
                },
                "attributes": {},
                "user": {
                  "userId": "amzn1.ask.account.AEZEGAFXFANE7AAAAAAZFLIBIBNJBL3LWNZHFSW2FO4ESH6YRPHZPQ6DNJ5QI6FPILBWR6UOFHYLCMLJM7K7O5WGTAUM5BGLXUJ7CRICV6B2Q6RH3WXZOBPZVQBUI4YUOWOMJCD3ULJ3J6D4C43OIJDQFANVCXKIPQH4X4CY6XGFQS4C5ADQSIHOQKPKJOU4KHE5ZF32LPI74NQ"
                },
                "new": true
              },
              "request": {
                "type": "IntentRequest",
                "requestId": "EdwRequestId.ba7aa96c-4ac2-4d6a-85f4-cf8a1f129ffd",
                "locale": "en-US",
                "timestamp": "2017-06-15T03:46:55Z",
                "intent": {
                  "name": "RecipeIntent",
                  "slots": {
                    "Item": {
                      "name": "Item",
                      "value": "map"
                    }
                  }
                }
              },
              "version": "1.0"
            };

            //set up
            jsonRead.readFile.returns(requestBody);
            fs.existsSync.returns(true);
            jsonRead.getProperty.returns('vendorId');

            //act
            apiWrapper.callInvokeSkill("file", null, '12345', 'NA', TEST_PROFILE, done);

            //assert
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
            let arg = oauthWrapper.tokenRefreshAndRead.getCall(0).args[0];
            expect(arg.method).equal('POST');
            expect(arg.url.includes('/skills/12345/invocations')).equal(true);
            expect(arg.json).equal(true);
            expect(arg.body.endpointRegion).equal('NA');
            expect(JSON.stringify(arg.body.skillRequest.body.request) === JSON.stringify(requestBody.request)).equal(true);
            done();
        });

        it ('| verify the request params are correct with json object input', (done) => {
            let requestBody = {
              "session": {
                "sessionId": "SessionId.e12ea327-6752-4679-bf85-c65692a91c2b",
                "application": {
                  "applicationId": "amzn1.ask.skill.0224c87b-437d-43d8-a227-8c7e52a4e819"
                },
                "attributes": {},
                "user": {
                  "userId": "amzn1.ask.account.AEZEGA6XAANE7TZGKWAZFAAAAAAABL3LWNZHFSW2FO4ESH6YRPHZPQ6DNJ5QI6FPILBWR6UOFHYLCMLJM7K7O5WGTAUM5BGLXUJ7CRICV6B2Q6RH3WXZOBPZVQBUI4YUOWOMJCD3ULJ3J6D4C43OIJDQFANVCXKIPQH4X4CY6XGFQS4C5ADQSIHOQKPKJOU4KHE5ZF32LPI74NQ"
                },
                "new": false
              },
              "request": {
                "type": "IntentRequest",
                "requestId": "EdwRequestId.ba7aa96c-4ac2-4d6a-85f4-cf8a1f129ffd",
                "locale": "en-US",
                "timestamp": "2017-06-15T03:46:55Z",
                "intent": {
                  "name": "RecipeIntent",
                  "slots": {
                    "Item": {
                      "name": "Item",
                      "value": "map"
                    }
                  }
                }
              },
              "version": "1.0"
            };

            //set up
            jsonRead.readFile.returns(true);
            fs.existsSync.returns(true);
            jsonRead.getProperty.returns('vendorId');

            //act
            apiWrapper.callInvokeSkill(null, requestBody, '12345', 'EU', TEST_PROFILE, done);

            //assert
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
            let arg = oauthWrapper.tokenRefreshAndRead.getCall(0).args[0];
            expect(arg.method).equal('POST');
            expect(arg.url.includes('/skills/12345/invocations')).equal(true);
            expect(arg.json).equal(true);
            expect(arg.body.endpointRegion).equal('EU');
            expect(JSON.stringify(arg.body.skillRequest.body.request) === JSON.stringify(requestBody.request)).equal(true);
            done();
        });
    });
    describe('# get-skill-status', () => {
        it ('| make a request to get skill status', () => {
            apiWrapper.callGetSkillStatus('skill-id', 'default',  emptyCallback);
            expect(oauthWrapper.tokenRefreshAndRead.calledOnce).equal(true);
        });
    });
});
