const { kebabCase, standardize } = require('@src/utils/string-utils');
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
        const { type } = parameter;
        let enumOptions = parameter.enum;
        let { description } = parameter;
        if (parameter.items && parameter.items.$ref) {
            const schema = this._getDefinitionSchema(parameter.items.$ref, definitions);
            const enumValue = this._mapEnum(parameter.description, schema);
            enumOptions = enumValue.enumOptions;
            description = enumValue.description;
        }
        customizedParameter = { ...customizedParameter, description, type, enum: enumOptions };
        this._addCustomizedParameter(parentOperation.customizationMetadata, customizedParameter);
    }

    _mapEnum(parentDescription, schema) {
        const description = schema.description || parentDescription;
        const enumOptions = schema.enum;
        return { description, enumOptions };
    }

    _addCustomizedParameter(customizationMetadata, customizedParameter) {
        const customization = customizationMap.get(customizedParameter.name) || {};
        const skip = customization.skip || false;
        if (skip) return;

        const isArray = customizedParameter.type === 'array' && !customizedParameter.json; // the array of object is treated as json type
        const isNumber = ['number', 'integer'].includes(customizedParameter.type);
        const isBoolean = customizedParameter.type === 'boolean';
        const flags = { isArray, isNumber, isBoolean };
        Object.keys(flags).forEach(key => {
            if (flags[key]) {
                customizedParameter[key] = true;
            }
        });
        customizationMetadata.flatParamsMap.set(standardize(customizedParameter.name), customizedParameter);
    }

    _getDefinitionSchema(ref, definitions) {
        const schema = ref.replace('#/definitions/', '');
        return definitions.get(schema);
    }

    _shouldParseAsJson(property, definitions) {
        if (property.type === 'object') return true;
        if (property.type === 'array' && '$ref' in property.items) {
            const schema = this._getDefinitionSchema(property.items.$ref, definitions);
            if (schema.type === 'object') return true;
        }
        return false;
    }

    _isRequired(definition, key, parentRequired) {
        if (definition.required) {
            return definition.required.includes(key);
        }
        return !!parentRequired;
    }

    _appendSecondLevelProperty(customizationMetadata, parentName, rootName, secondLevelDefinition, parentRequired, definitions) {
        let customizedParameter;
        const parentDescription = secondLevelDefinition.description;
        this._ensureNumberOfProperties(rootName, secondLevelDefinition.properties);
        Object.keys(secondLevelDefinition.properties || []).forEach(key => {
            const property = secondLevelDefinition.properties[key];
            let enumOptions = null;
            const { type } = property;
            let description = property.description || parentDescription;
            if (property.$ref) {
                const schema = this._getDefinitionSchema(property.$ref, definitions);
                if (!schema.enum) {
                    throw new CliError('Cannot unwrap more then 2 levels deep. Please use customParameters or '
                    + `set skipUnwrap for parameter ${rootName} in lib/commands/smapi/customizations/parameters.json.`);
                }
                enumOptions = schema.enum;
                description = schema.description || description;
            }
            const json = this._shouldParseAsJson(property, definitions);
            const bodyPath = `${parentName}${BODY_PATH_DELIMITER}${key}`;
            const required = this._isRequired(secondLevelDefinition, key, parentRequired);
            customizedParameter = { name: `${parentName} ${key}`, description, rootName, required, bodyPath, enum: enumOptions, json, type };
            this._addCustomizedParameter(customizationMetadata, customizedParameter);
        });
        if (secondLevelDefinition.enum) {
            const { type } = secondLevelDefinition;
            const { description, enumOptions } = this._mapEnum(parentDescription, secondLevelDefinition);
            customizedParameter = {
                name: parentName,
                description,
                rootName,
                required: parentRequired,
                bodyPath: parentName,
                enum: enumOptions,
                type
            };
            this._addCustomizedParameter(customizationMetadata, customizedParameter);
        }
    }

    _processNestedBodyParam(param, properties, customizationMetadata, rootName, definitions) {
        this._ensureNumberOfProperties(rootName, properties);
        const parentRequired = this._getDefinitionSchema(param.schema.$ref, definitions).required;
        Object.keys(properties).forEach(key => {
            const property = properties[key];
            const isParentRequired = parentRequired && parentRequired.includes(key);
            if (property.$ref) {
                const secondLevelDefinition = this._getDefinitionSchema(property.$ref, definitions);
                const isRequired = this._isRequired(secondLevelDefinition, key, isParentRequired);
                this._appendSecondLevelProperty(customizationMetadata, key, rootName, secondLevelDefinition, isRequired, definitions);
            } else {
                const { description, type } = property;
                const json = this._shouldParseAsJson(property, definitions);
                const parentDefinition = this._getDefinitionSchema(param.schema.$ref, definitions);
                const required = this._isRequired(parentDefinition, key, isParentRequired);
                const customizedParameter = { name: key, description, rootName, required, bodyPath: key, json, type };
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
