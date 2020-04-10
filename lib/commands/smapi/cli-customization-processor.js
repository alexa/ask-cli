
const { kebabCase, camelCase } = require('@src/utils/string-utils');
const CliError = require('@src/exceptions/cli-error');
const { customizationMap } = require('@src/commands/smapi/customizations/parameters-map');

const BODY_PATH_DELIMITER = '>>>';
const ARRAY_SPLIT_DELIMITER = ',';
const MAX_NESTED_PROPERTIES = 10;

class CliCustomizationProcessor {
    /**
     * Processes each operation name.
     * @param {string} operationName Operation name.
     */
    processOperationName(operationName) {
        return kebabCase(operationName.substring(0, operationName.length - 2));
    }

    /**
     * Processes each operation.
     * @param {string} operationName Operation name.
     * @param {Object} operation Operation object.
     */
    processOperation(operationName, operation) {
        operation.customizationMetadata.flatParamsMap = new Map();
    }

    /**
     * Processes each parameter.
     * @param {Object} parameter Parameter object.
     * @param {Object} parentOperation Parent object of the parameter.
     * @param {Map} definitions Map with all Swagger definitions.
     */
    processParameter(parameter, parentOperation, definitions) {
        const customization = customizationMap.get(parameter.name) || {};
        parameter.skip = customization.skip || false;
        if (parameter.skip) return;

        if (parameter.in === 'body') {
            this._processBodyParameter(parameter, parentOperation, definitions);
        } else {
            this._processNonBodyParameter(parameter, parentOperation, definitions);
        }
    }

    _processBodyParameter(parameter, parentOperation, definitions) {
        const rootName = parameter.name;
        const { description, required } = parameter;
        const { properties } = this._getDefinitionSchema(parameter.schema.$ref, definitions);
        const customization = customizationMap.get(parameter.name);
        if (!properties || (customization && customization.skipUnwrap)) {
            const customizedParameter = { name: parameter.name, description, required, json: true };
            this._addCustomizedParameter(parentOperation.customizationMetadata, customizedParameter);
        } else if (customization && customization.customParameters) {
            customization.customParameters.forEach(customParameter => {
                this._addCustomizedParameter(parentOperation.customizationMetadata, customParameter);
            });
        } else {
            this._processNestedBodyParam(parameter, properties, parentOperation.customizationMetadata, rootName, definitions);
        }
    }

    _processNonBodyParameter(parameter, parentOperation, definitions) {
        let customizedParameter = { ...parameter };
        const isArray = parameter.type === 'array';
        let enumOptions = parameter.enum;
        let { description } = parameter;
        if (parameter.items && parameter.items.$ref) {
            const schema = this._getDefinitionSchema(parameter.items.$ref, definitions);
            const enumValue = this._mapEnum(parameter.description, schema);
            enumOptions = enumValue.enumOptions;
            description = enumValue.description;
        }
        customizedParameter = { ...customizedParameter, description, isArray, enum: enumOptions };
        this._addCustomizedParameter(parentOperation.customizationMetadata, customizedParameter);
    }

    _mapEnum(parentDescription, schema) {
        const description = schema.description || parentDescription;
        const enumOptions = schema.enum;
        return { description, enumOptions };
    }

    _addCustomizedParameter(customizationMetadata, customizedParameter) {
        customizationMetadata.flatParamsMap.set(camelCase(customizedParameter.name), customizedParameter);
    }

    _getDefinitionSchema(ref, definitions) {
        const schema = ref.replace('#/definitions/', '');
        return definitions.get(schema);
    }

    _shouldParseAsJson(property) {
        return property.type === 'object' || (property.type === 'array' && '$ref' in property.items);
    }

    _appendSecondLevelProperty(customizationMetadata, parentName, rootName, secondLevelDefinition, required, definitions) {
        let customizedParameter;
        const parentDescription = secondLevelDefinition.description;
        this._ensureNumberOfProperties(rootName, secondLevelDefinition.properties);
        Object.keys(secondLevelDefinition.properties || []).forEach(key => {
            const property = secondLevelDefinition.properties[key];
            let enumOptions = null;
            let description = property.description || parentDescription;
            if (property.$ref) {
                const schema = this._getDefinitionSchema(property.$ref, definitions);
                if (!schema.enum) {
                    throw new CliError('Cannot unwrap more then 2 levels deep. Please use customParameters or set skipUnwrap.');
                }
                enumOptions = schema.enum;
                description = schema.description || description;
            }
            const json = this._shouldParseAsJson(property);
            const bodyPath = `${parentName}${BODY_PATH_DELIMITER}${key}`;
            customizedParameter = { name: `${parentName} ${key}`, description, rootName, required, bodyPath, enum: enumOptions, json };
            this._addCustomizedParameter(customizationMetadata, customizedParameter);
        });
        if (secondLevelDefinition.enum) {
            const { description, enumOptions } = this._mapEnum(parentDescription, secondLevelDefinition);
            customizedParameter = { name: parentName, description, rootName, required, bodyPath: parentName, enum: enumOptions };
            this._addCustomizedParameter(customizationMetadata, customizedParameter);
        }
    }

    _processNestedBodyParam(param, properties, customizationMetadata, rootName, definitions) {
        const required = this._getDefinitionSchema(param.schema.$ref, definitions).required || [];

        this._ensureNumberOfProperties(rootName, properties);
        Object.keys(properties).forEach(key => {
            const property = properties[key];
            if (property.$ref) {
                const secondLevelDefinition = this._getDefinitionSchema(property.$ref, definitions);
                const isRequired = required.includes(key);
                this._appendSecondLevelProperty(customizationMetadata, key, rootName, secondLevelDefinition, isRequired, definitions);
            } else {
                const { description } = property;
                const json = this._shouldParseAsJson(property);
                // required inherited from parent param
                const customizedParameter = { name: key, description, rootName, required: param.required, bodyPath: key, json };
                this._addCustomizedParameter(customizationMetadata, customizedParameter);
            }
        });
    }

    _ensureNumberOfProperties(parameterName, properties) {
        if (properties && Object.keys(properties).length >= MAX_NESTED_PROPERTIES) {
            throw new CliError(`${parameterName} - number of body properties `
                + `exceeds ${MAX_NESTED_PROPERTIES}. Please use customParameters.`);
        }
    }
}

module.exports = { CliCustomizationProcessor, BODY_PATH_DELIMITER, ARRAY_SPLIT_DELIMITER, MAX_NESTED_PROPERTIES };
