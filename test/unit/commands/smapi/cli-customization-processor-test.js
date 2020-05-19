const { expect } = require('chai');
const sinon = require('sinon');
const { camelCase, standardize } = require('@src/utils/string-utils');
const CliError = require('@src/exceptions/cli-error');
const { customizationMap } = require('@src/commands/smapi/customizations/parameters-map');
const { CliCustomizationProcessor, BODY_PATH_DELIMITER, MAX_NESTED_PROPERTIES } = require('@src/commands/smapi/cli-customization-processor');


const makeParameter = (options = {}) => {
    const defaultValues = {
        name: 'someId',
        in: 'path',
        description: 'some description',
        required: true,
        type: 'string'
    };

    return { ...defaultValues, ...options };
};

function mapExpectedParams(parentName, bodyPropertyName) {
    const name = `${parentName} ${bodyPropertyName}`;
    const bodyPath = `${parentName}${BODY_PATH_DELIMITER}${bodyPropertyName}`;
    const key = camelCase(name);
    return { name, bodyPath, key };
}

describe('Smapi test - CliCustomizationProcessor class', () => {
    const enumValues = ['a', 'b'];
    const refObjectDescription = 'description for type';
    const enumDescription = 'some enum description';
    const parentDescription = 'some parent description';
    const bodyPropertyOneName = 'propertyOne';
    const bodyPropertyTwoName = 'propertyTwo';
    const nestedPropertyName = 'nestedProperty';
    const nestedEnumPropertyName = 'nestedEnumProperty';
    const bodyProperty = { type: 'number' };
    const bodyPropertyWithSimpleArray = { type: 'array', items: { $ref: '#/definitions/SomeEnumType' } };
    const bodyPropertyWithComplexArray = { type: 'array', items: { $ref: '#/definitions/SomeSimpleObjectType' } };
    const bodyPropertyWithDescription = { description: 'property description', type: 'boolean' };
    const nestedProperty = { $ref: 'SomeObjectType' };
    const nestedEnumProperty = { $ref: 'SomeEnumTypeWithDescription' };
    let processor;
    let parentOperation;
    let definitions;
    const objectWithTooManyProperties = {};
    for (let i = 0; i < MAX_NESTED_PROPERTIES; i++) {
        objectWithTooManyProperties[i] = 'test';
    }


    beforeEach(() => {
        processor = new CliCustomizationProcessor();
        parentOperation = { customizationMetadata: {
            flatParamsMap: new Map()
        } };
        definitions = new Map([
            ['SomeEnumType', { enum: enumValues }],
            ['SomeEnumTypeWithDescription', { enum: enumValues, description: enumDescription }],
            ['SomeTypeWithDescription', { enum: enumValues, description: refObjectDescription }],
            ['SomeSimpleObjectType', { type: 'object', properties: {} }],
            ['SomeObjectType', { description: parentDescription,
                required: ['propertyTwo'],
                properties: { propertyOne: bodyProperty,
                    propertyTwo: bodyPropertyWithDescription,
                    propertyThree: { $ref: 'SomeEnumType' },
                    propertyFour: { $ref: 'SomeEnumTypeWithDescription' },
                    propertyFive: bodyPropertyWithSimpleArray,
                    propertySix: bodyPropertyWithComplexArray,
                    propertySeven: { type: 'object', properties: { } } } }],
            ['SomeNestedType', { required: [nestedPropertyName],
                properties: { nestedProperty } }],
            ['SomeTooManyPropertiesType', { properties: { ...objectWithTooManyProperties } }],
            ['SomeTooNestedType', { properties: { test: { $ref: 'SomeNestedType' } } }],
            ['SomeNestedEnumType', { required: [nestedPropertyName],
                description: refObjectDescription,
                properties: { nestedEnumProperty } }]
        ]);
    });

    describe('# processOperationName', () => {
        it('| should convert to kebab case and strip last 2 characters for version', () => {
            const result = processor.processOperationName('getContentUploadByIdV1');
            expect(result).eql('get-content-upload-by-id');
        });
    });

    describe('# processOperation', () => {
        it('| should create empty flatParamsMap on operator object', () => {
            const operation = { customizationMetadata: {} };
            processor.processOperation('test', operation);
            expect(operation.customizationMetadata.flatParamsMap).eql(new Map());
        });
    });

    describe('# processParameter', () => {
        it('| should add simple non body paramter', () => {
            const parameter = makeParameter();

            processor.processParameter(parameter, parentOperation, definitions);

            const key = camelCase(parameter.name);
            const { flatParamsMap } = parentOperation.customizationMetadata;

            const expected = { ...parameter, enum: undefined };
            expect(flatParamsMap.get(standardize(key))).eql(expected);
        });

        it('| should skip processing of parameter', () => {
            const parameter = makeParameter();
            const skip = true;

            sinon.stub(customizationMap, 'get').returns({ skip });

            processor.processParameter(parameter, parentOperation, definitions);

            expect(parentOperation.customizationMetadata.flatParamsMap.size).eql(0);
        });


        it('| should add simple array of non body paramter', () => {
            const parameter = makeParameter({ type: 'array' });

            processor.processParameter(parameter, parentOperation, definitions);

            const key = camelCase(parameter.name);
            const { flatParamsMap } = parentOperation.customizationMetadata;

            const expected = { ...parameter, enum: undefined, isArray: true };
            expect(flatParamsMap.get(standardize(key))).eql(expected);
        });

        it('| should add reference enum of non body paramter', () => {
            const parameter = makeParameter({ type: 'array', items: { $ref: '#/definitions/SomeEnumType' } });

            processor.processParameter(parameter, parentOperation, definitions);

            const key = camelCase(parameter.name);
            const { flatParamsMap } = parentOperation.customizationMetadata;

            const expected = { ...parameter, enum: enumValues, isArray: true };
            expect(flatParamsMap.get(standardize(key))).eql(expected);
        });

        it('| should add reference items of non body paramter and use reference item description if not defined', () => {
            const parameter = makeParameter({ type: 'array', items: { $ref: '#/definitions/SomeTypeWithDescription' } });

            processor.processParameter(parameter, parentOperation, definitions);

            const key = camelCase(parameter.name);
            const { flatParamsMap } = parentOperation.customizationMetadata;

            const expected = { ...parameter, enum: enumValues, description: refObjectDescription, isArray: true };
            expect(flatParamsMap.get(standardize(key))).eql(expected);
        });

        it('| should add body parameter', () => {
            const parameter = makeParameter({ in: 'body', schema: { $ref: '#/definitions/SomeObjectType' } });

            processor.processParameter(parameter, parentOperation, definitions);

            const rootName = camelCase(parameter.name);
            const { flatParamsMap } = parentOperation.customizationMetadata;

            const expectedOne = { ...bodyProperty,
                description: undefined,
                required: false,
                rootName,
                bodyPath: bodyPropertyOneName,
                name: bodyPropertyOneName,
                json: false,
                isNumber: true };
            expect(flatParamsMap.get(standardize(bodyPropertyOneName))).eql(expectedOne);

            const expectedTwo = { ...bodyPropertyWithDescription,
                required: true,
                rootName,
                bodyPath: bodyPropertyTwoName,
                name: bodyPropertyTwoName,
                json: false,
                isBoolean: true };
            expect(flatParamsMap.get(standardize(bodyPropertyTwoName))).eql(expectedTwo);
        });

        it('| should add customized body parameter', () => {
            sinon.stub(customizationMap, 'get').returns({
                skipUnwrap: true
            });
            const parameter = makeParameter({ in: 'body', schema: { $ref: '#/definitions/SomeObjectType' } });

            processor.processParameter(parameter, parentOperation, definitions);

            const { flatParamsMap } = parentOperation.customizationMetadata;
            const { name, required, description } = parameter;
            const expected = { name, required, description, json: true };
            expect(flatParamsMap.get(standardize(parameter.name))).eql(expected);
        });

        it('| should add customized body parameter with custom properties', () => {
            const name = 'customName';
            const required = true;
            const description = 'custom description';
            sinon.stub(customizationMap, 'get').returns({
                customParameters: [{ name, description, required }]
            });
            const parameter = makeParameter({ in: 'body', schema: { $ref: '#/definitions/SomeObjectType' } });

            processor.processParameter(parameter, parentOperation, definitions);

            const { flatParamsMap } = parentOperation.customizationMetadata;

            const expected = { name, required, description };
            expect(flatParamsMap.get(standardize(name))).eql(expected);
        });

        it('| should add one level deep body parameter', () => {
            const parameter = makeParameter({ in: 'body', schema: { $ref: '#/definitions/SomeNestedType' } });

            processor.processParameter(parameter, parentOperation, definitions);

            const rootName = camelCase(parameter.name);
            const { flatParamsMap } = parentOperation.customizationMetadata;
            let { name, bodyPath, key } = mapExpectedParams(nestedPropertyName, bodyPropertyOneName);

            let expected = { description: parentDescription,
                name,
                rootName,
                bodyPath,
                required: false,
                enum: null,
                json: false,
                isNumber: true,
                type: 'number' };
            expect(flatParamsMap.get(standardize(key))).eql(expected);

            const expectedParams = mapExpectedParams(nestedPropertyName, bodyPropertyTwoName);
            name = expectedParams.name;
            bodyPath = expectedParams.bodyPath;
            key = expectedParams.key;
            expected = { ...bodyPropertyWithDescription, name, rootName, bodyPath, required: true, enum: null, json: false, isBoolean: true };

            expect(flatParamsMap.get(standardize(key))).eql(expected);
        });

        it('| should fail since the body parameter is nested too deep', () => {
            const parameter = makeParameter({ in: 'body', schema: { $ref: '#/definitions/SomeTooNestedType' } });

            const badFn = () => processor.processParameter(parameter, parentOperation, definitions);

            expect(badFn).to.throw(CliError, 'Cannot unwrap more then');
        });

        it('| should fail since the body parameter has too many properties', () => {
            const parameter = makeParameter({ in: 'body', schema: { $ref: '#/definitions/SomeTooManyPropertiesType' } });

            const badFn = () => processor.processParameter(parameter, parentOperation, definitions);

            expect(badFn).to.throw(CliError, 'number of body properties exceeds');
        });

        it('| should add one level deep body enum parameter', () => {
            const parameter = makeParameter({ in: 'body', schema: { $ref: '#/definitions/SomeNestedEnumType' } });

            processor.processParameter(parameter, parentOperation, definitions);

            const rootName = camelCase(parameter.name);
            const { flatParamsMap } = parentOperation.customizationMetadata;
            const name = nestedEnumPropertyName;
            const bodyPath = nestedEnumPropertyName;

            const expected = { ...bodyProperty,
                name,
                rootName,
                bodyPath,
                required: false,
                enum: enumValues,
                description: enumDescription,
                type: undefined };
            expect(flatParamsMap.get(standardize(nestedEnumPropertyName))).eql(expected);
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
