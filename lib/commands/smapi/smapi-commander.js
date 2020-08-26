const commander = require('commander');
const { ModelIntrospector } = require('ask-smapi-sdk');
const { kebabCase } = require('@src/utils/string-utils');
const { CliCustomizationProcessor } = require('@src/commands/smapi/cli-customization-processor');
const optionModel = require('@src/commands/option-model.json');
const handler = require('@src/commands/smapi/smapi-command-handler');
const aliases = require('@src/commands/smapi/customizations/aliases.json');
const { apiToCommanderMap } = require('@src/commands/smapi/customizations/parameters-map');
const metricClient = require('@src/utils/metrics');

const uploadCatalog = require('./appended-commands/upload-catalog');
const exportPackage = require('./appended-commands/export-package');
const getTask = require('./appended-commands/get-task');
const searchTask = require('./appended-commands/search-task');

const defaultOptions = [
    {
        flags: `-${optionModel.profile.alias}, --profile <profile>`,
        description: optionModel.profile.description
    },
    {
        flags: '--full-response',
        description: optionModel['full-response'].description
    },
    {
        flags: '--debug',
        description: optionModel.debug.description
    }
];

const defaultValues = new Map();
defaultValues.set('stage', 'development');

const requiredTemplate = { true: '[REQUIRED]', false: '[OPTIONAL]' };
const jsonTemplate = { true: '[JSON]: Option value is JSON string, accepts JSON file by using either:'
+ '\n- "$(cat {filePath})", use "type" command to replace "cat" command in Windows.'
+ '\n- "file:{filePath}", file descriptor with either absolute or relative file path.\n',
false: '' };

const _makeEnumTemplate = (param) => (param.enum ? `[ENUM]: ${param.enum.join()}.\n` : '');
const _makeArrayTemplate = (param) => (param.isArray ? '[MULTIPLE]: Values can be separated by comma.\n' : '');

const _makeAlias = (kebabName) => (aliases[kebabName] ? `-${aliases[kebabName]},` : '');

const _makeOption = (param) => {
    const name = apiToCommanderMap.get(param.name) || param.name;
    const defaultValue = defaultValues.get(name);
    const shouldMakeOptional = param.required && defaultValue;
    if (shouldMakeOptional) {
        param.required = false;
    }
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
        + `${enumTemplate} `).trim(),
        defaultValue: shouldMakeOptional ? defaultValue : undefined
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
                commanderInstance.option(option.name, option.description, option.defaultValue);
            }
        });

        defaultOptions.forEach(option => {
            commanderInstance.option(option.flags, option.description);
        });
        commanderInstance.action((inputCmdObj) => {
            metricClient.startAction('smapi', inputCmdObj.name());
            return handler.smapiCommandHandler(
                apiOperationName,
                flatParamsMap,
                commanderToApiCustomizationMap,
                inputCmdObj,
                modelIntrospector
            ).then(res => metricClient.sendData().then(() => res))
                .catch(err => metricClient.sendData(err).then(() => Promise.reject(err)));
        });
    });

    // register hand-written appended commands
    uploadCatalog.createCommand(program);
    exportPackage.createCommand(program);
    getTask.createCommand(program);
    searchTask.createCommand(program);

    program._name = 'ask smapi';
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
