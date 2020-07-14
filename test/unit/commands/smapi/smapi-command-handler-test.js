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
const { smapiCommandHandler, parseSmapiResponse } = require('@src/commands/smapi/smapi-command-handler');

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
        clientStub[sdkFunctionName] = sinon.stub();
        clientStub[sdkFunctionName].resolves({ ...fakeResponse });
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

    it('| should return command executed successfully when no response body', async () => {
        const { headers, statusCode } = fakeResponse;
        clientStub[sdkFunctionName].resolves({ headers, statusCode });

        const result = await smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, cmdObj, modelInterceptor);

        expect(result).eql('Command executed successfully!');
    });

    it('| should read parameter from json file amd send smapi command', async () => {
        const jsonFilePath = 'file:some-file.json';
        sinon.stub(fs, 'readFileSync').returns(JSON.stringify(jsonValue));
        cmdObj.opts = () => ({ skillId, someNumber, someBoolean, someJson: jsonFilePath, someArray: arrayValueStr });

        await smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, cmdObj, modelInterceptor);

        const expectedParams = [jsonValue, skillId, null, arrayValue,
            { input: { someNumber: Number(someNumber), someBoolean: Boolean(someBoolean) } }];
        const calledParams = clientStub[sdkFunctionName].args[0];

        expect(calledParams).eql(expectedParams);
    });

    it('| should read parameter from text file amd send smapi command', async () => {
        const textFilePath = 'file:some-file.txt';
        const textValue = 'some text';
        sinon.stub(fs, 'readFileSync').returns(textValue);
        cmdObj.opts = () => ({ skillId, someNumber, someBoolean, someJson: textFilePath, someArray: arrayValueStr });

        await smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, cmdObj, modelInterceptor);

        const expectedParams = [textValue, skillId, null, arrayValue,
            { input: { someNumber: Number(someNumber), someBoolean: Boolean(someBoolean) } }];
        const calledParams = clientStub[sdkFunctionName].args[0];

        expect(calledParams).eql(expectedParams);
    });

    it('| should parse parameter as text if not able to parse to json amd send smapi command', async () => {
        const textValue = 'some text';
        sinon.stub(fs, 'readFileSync').returns(textValue);
        cmdObj.opts = () => ({ skillId, someNumber, someBoolean, someJson: textValue, someArray: arrayValueStr });

        await smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, cmdObj, modelInterceptor);

        const expectedParams = [textValue, skillId, null, arrayValue,
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
        expect(messengerStub.args[3]).eql(['INFO', 'Response:']);
        expect(messengerStub.args[4]).eql(['INFO', jsonView.toString(fakeResponse)]);
    });

    it('| should display body, headers and status code when full response flag is passed', async () => {
        const cmdObjDebug = {
            opts() {
                return { fullResponse: true, skillId };
            },
            _name: commandName
        };

        const result = await smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, cmdObjDebug, modelInterceptor);

        expect(result).eql(jsonView.toString(fakeResponse));
    });

    afterEach(() => {
        sinon.restore();
    });
});

describe('Smapi test - parseSmapiResponse function', () => {
    let warnStub;
    beforeEach(() => {
        warnStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({
            warn: warnStub
        });
    });
    it('| should parse text/csv response', () => {
        const content = 'foo bar\n foo';
        const response = { headers: [{ key: 'content-type', value: 'text/csv' }], body: content };

        const result = parseSmapiResponse(response);

        expect(result).eql(content);
    });

    it('| should parse application/json response', () => {
        const content = { foo: 'bar' };
        const response = { headers: [{ key: 'content-type', value: 'application/json' }], body: content };

        const result = parseSmapiResponse(response);

        expect(result).eql(jsonView.toString(content));
    });

    it('| should return command executed successfully if not response body', () => {
        const response = { headers: [] };

        const result = parseSmapiResponse(response);

        expect(result).eql('Command executed successfully!');
    });

    it('| should show warning with status hint command when able to find one', () => {
        const skillId = 'someSkillId';
        const resource = 'someResource';
        const profile = 'test';
        const url = `/v1/skills/${skillId}/status?resource=${resource}`;
        const response = { headers: [{ key: 'location', value: url }], statusCode: 202 };

        parseSmapiResponse(response, profile);
        expect(warnStub.firstCall.lastArg).eql('This is an asynchronous operation. Check the progress '
        + `using the following command: ask smapi get-skill-status --skill-id ${skillId} --resource ${resource} --profile ${profile}`);
    });

    it('| should show warning with status hint for customized parameters', () => {
        const skillId = 'someSkillId';
        const resource = 'someResource';
        const vendorId = 'someVendorId';
        sinon.stub(Map.prototype, 'get')
            .withArgs('vendorId')
            .returns({ skip: true })
            .withArgs('resource')
            .returns('someCustomName');

        const url = `/v1/skills/${skillId}/status?resource=${resource}&vendorId=${vendorId}`;
        const response = { headers: [{ key: 'location', value: url }], statusCode: 202 };

        parseSmapiResponse(response);
        expect(warnStub.firstCall.lastArg).eql('This is an asynchronous operation. Check the progress '
        + `using the following command: ask smapi get-skill-status --skill-id ${skillId} --some-custom-name ${resource}`);
    });

    it('| should not show warning with status hint command when not able to find one', () => {
        const url = '/some-random-non-smapi-url';
        const response = { headers: [{ key: 'location', value: url }], statusCode: 202 };

        parseSmapiResponse(response);

        expect(warnStub.firstCall.lastArg).eql('This is an asynchronous operation. Check the progress '
        + `using the following url: ${url}`);
    });
    afterEach(() => {
        sinon.restore();
    });
});
