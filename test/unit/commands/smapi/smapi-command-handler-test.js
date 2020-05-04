const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const { CustomSmapiClientBuilder } = require('ask-smapi-sdk');
const AppConfig = require('@src/model/app-config');
const { ARRAY_SPLIT_DELIMITER } = require('@src/commands/smapi/cli-customization-processor');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const BeforeSendProcessor = require('@src/commands/smapi/before-send-processor');
const AuthorizationController = require('@src/controllers/authorization-controller');
const profileHelper = require('@src/utils/profile-helper');
const smapiCommandHandler = require('@src/commands/smapi/smapi-command-handler');


describe('Smapi test - smapiCommandHandler function', () => {
    const apiOperationName = 'someApiOperation';
    const sdkFunctionName = 'callSomeApiOperation';
    const commandName = 'some-api-operation';
    const skillId = 'some skill id';
    const someNumber = '20';
    const someBoolean = 'true';
    const jsonValue = { test: 'test' };
    const arrayValue = ['test', 'test1', 'test2'];
    const arrayValueStr = arrayValue.join(ARRAY_SPLIT_DELIMITER);
    const fakeResponse = {
        body: { someProperty: 'x' },
        headers: [{
            key: 'x',
            value: 'y'
        },
        {
            key: 'z',
            value: 'b'
        }],
        statusCode: 200
    };

    const flatParamsMap = new Map([
        ['skillid', { name: 'skillId' }],
        ['somejson', { name: 'someJson', json: true }],
        ['somearray', { name: 'someArray', isArray: true }],
        ['somenumber', { rootName: 'simulationsApiRequest', bodyPath: 'input>>>someNumber', isNumber: true }],
        ['someboolean', { rootName: 'simulationsApiRequest', bodyPath: 'input>>>someBoolean', isBoolean: true }],
        ['sessionmode', { rootName: 'simulationsApiRequest', bodyPath: 'session>>>mode' }]]);

    const commanderToApiCustomizationMap = new Map();
    let cmdObj;

    const clientStub = { apiConfiguration: { apiEndpoint: null } };

    const modelInterceptor = {
        operations: new Map([[commandName, { params: [] }]]),
        definitions: new Map()
    };

    beforeEach(() => {
        cmdObj = {
            opts() {
                return { skillId, someNumber, someBoolean, someJson: JSON.stringify(jsonValue), someArray: arrayValueStr };
            },
            _name: commandName
        };
        sinon.stub(AuthorizationController.prototype, '_getAuthClientInstance').returns(
            { config: {} }
        );
        sinon.stub(profileHelper, 'runtimeProfile').returns('test');
        sinon.stub(AppConfig.prototype, '_validateFilePath');
        sinon.stub(AppConfig.prototype, 'read');
        sinon.stub(AppConfig, 'getInstance').returns({
            getToken() {
                return { refresh_token: 'test' };
            }
        });
        clientStub[sdkFunctionName] = sinon.stub().resolves({ ...fakeResponse });
        clientStub[sdkFunctionName].toString = () => 'function (someJson, skillId, '
            + 'someNonPopulatedProperty, someArray, simulationsApiRequest) { return 0};';
        sinon.stub(BeforeSendProcessor.prototype, 'processAll');
        sinon.stub(CustomSmapiClientBuilder.prototype, 'client').returns(clientStub);
    });

    it('| should send smapi command with correct parameter mapping', async () => {
        await smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, cmdObj, modelInterceptor);

        const expectedParams = [jsonValue, skillId, null, arrayValue,
            { input: { someNumber: Number(someNumber), someBoolean: Boolean(someBoolean) } }];
        const calledParams = clientStub[sdkFunctionName].args[0];

        expect(calledParams).eql(expectedParams);
    });

    it('| should read parameter from json file amd send smapi command', async () => {
        const jsonFilePath = 'file:some-file.json';
        sinon.stub(fs, 'readJSONSync').returns(jsonValue);
        cmdObj.opts = () => ({ skillId, someNumber, someBoolean, someJson: jsonFilePath, someArray: arrayValueStr });

        await smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, cmdObj, modelInterceptor);

        const expectedParams = [jsonValue, skillId, null, arrayValue,
            { input: { someNumber: Number(someNumber), someBoolean: Boolean(someBoolean) } }];
        const calledParams = clientStub[sdkFunctionName].args[0];

        expect(calledParams).eql(expectedParams);
    });

    it('| should display debug message when debug flag is passed', async () => {
        const cmdObjDebug = {
            opts() {
                return { debug: true, skillId };
            },
            _name: commandName
        };

        const messengerStub = sinon.stub(Messenger, 'displayMessage');

        await smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, cmdObjDebug, modelInterceptor);

        expect(messengerStub.args[0]).eql(['INFO', 'Operation: someApiOperation']);
        expect(messengerStub.args[1]).eql(['INFO', 'Payload:']);
        expect(messengerStub.args[2])
            .eql(['INFO', `${jsonView.toString({ someJson: null,
                skillId,
                someNonPopulatedProperty: null,
                someArray: null,
                simulationsApiRequest: null })}\n`]);
        expect(messengerStub.args[3]).eql(['INFO', `Status code: ${fakeResponse.statusCode}`]);
        expect(messengerStub.args[4]).eql(['INFO', `Response headers: ${jsonView.toString(fakeResponse.headers)}`]);
        expect(messengerStub.args[5]).eql(['INFO', `Response body: ${jsonView.toString(fakeResponse.body)}`]);
    });

    afterEach(() => {
        sinon.restore();
    });
});
