const commander = require('commander');
const { ModelIntrospector } = require('ask-smapi-sdk');
const { kebabCase } = require('@src/utils/string-utils');
const { CliCustomizationProcessor } = require('@src/commands/smapi/cli-customization-processor');
const smapiCommandHandler = require('@src/commands/smapi/smapi-command-handler');
const aliases = require('@src/commands/smapi/customizations/aliases.json');
const { apiToCommanderMap } = require('@src/commands/smapi/customizations/parameters-map');


const defaultOptions = ['profile', 'debug'];
const requiredTemplate = { true: '[REQUIRED]', false: '[OPTIONAL]' };
const jsonTemplate = { true: '[JSON]\n', false: '' };

const _makeEnumTemplate = (param) => (param.enum ? `[ENUM]: ${param.enum.join()}.\n` : '');
const _makeArrayTemplate = (param) => (param.isArray ? '[MULTIPLE]: Values can be separated by comma.\n' : '');

const _makeAlias = (kebabName) => (aliases[kebabName] ? `-${aliases[kebabName]},` : '');

const _makeOption = (param) => {
    const name = apiToCommanderMap.get(param.name) || param.name;
    const paramName = kebabCase(name);
    const alias = _makeAlias(paramName);
    const json = param.json || false;
    const enumTemplate = _makeEnumTemplate(param);
    const arrayTemplate = _makeArrayTemplate(param);
    return {
        name: `${alias}--${paramName} <${paramName}>`,
        description:
        (`${requiredTemplate[param.required]} ${(param.description || '').trim()} \n`
        + `${arrayTemplate}`
        + `${jsonTemplate[json]}`
        + `${enumTemplate} `).trim()
    };
};
/**
 * Creates commander instance for Smapi operations.
 */
const makeSmapiCommander = () => {
    const customizationProcessor = new CliCustomizationProcessor();
    const modelIntrospector = new ModelIntrospector(null, customizationProcessor);
    const operations = modelIntrospector.getOperations();

    const program = new commander.Command();

    let commanderInstance;

    operations.forEach((operation, commandName) => {
        const commanderToApiCustomizationMap = new Map();
        const { apiOperationName, description } = operation;
        commanderInstance = program
            .command(commandName)
            .description(description)
            .storeOptionsAsProperties(false);
        const { flatParamsMap } = operation.customizationMetadata;
        flatParamsMap.forEach(param => {
            const customizationValue = apiToCommanderMap.get(param.name);
            if (customizationValue) {
                commanderToApiCustomizationMap.set(customizationValue, param.name);
            }
            const option = _makeOption(param);
            if (param.required) {
                commanderInstance.requiredOption(option.name, option.description);
            } else {
                commanderInstance.option(option.name, option.description);
            }
        });

        defaultOptions.forEach(optionName => {
            commanderInstance.option(`--${optionName} <${optionName}>`, '');
        });
        commanderInstance.action((inputCmdObj) => smapiCommandHandler(
            apiOperationName,
            operation.params,
            flatParamsMap,
            commanderToApiCustomizationMap,
            inputCmdObj
        ));
    });

    program._name = 'askx smapi';
    program
        .description('The smapi command provides a number of sub-commands that '
        + 'enable you to manage Alexa skills associated with your developer account.');

    program.on('command:*', () => {
        console.error(`Command not recognized. Please run "${program._name}" to check the user instructions.`);
        process.exit(1);
    });

    return program;
};

module.exports = { makeSmapiCommander };
