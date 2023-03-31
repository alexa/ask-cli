import {Command} from "commander";
import {ModelIntrospector} from "ask-smapi-sdk";
import {kebabCase, camelCase} from "../../utils/string-utils";
import {CliCustomizationProcessor} from "./cli-customization-processor";
import optionModel from "../option-model.json";
import {OptionModel, OptionModelEntry, validateOptionRules, validateOptionString} from "../option-validator";
import handler from "./smapi-command-handler";
import {apiToCommanderMap} from "./customizations/parameters-map";
import metricClient from "../../utils/metrics";
import aliases from "./customizations/aliases.json";
import {createCommand as uploadCreateCommand} from "./appended-commands/upload-catalog";
import {createCommand as exportPackageCreateCommand} from "./appended-commands/export-package";
import {createCommand as getTaskCreateCommand} from "./appended-commands/get-task";
import {createCommand as searchTaskCreateCommand} from "./appended-commands/search-task";

interface SmapiOption {
  flags: string;
  description: string;
  defaultValue?: string;
  shortName: string;
  longName: string;
}

const defaultOptions: SmapiOption[] = [
  {
    flags: `-${optionModel.profile.alias}, --profile <profile>`,
    description: optionModel.profile.description,
    shortName: optionModel.profile.alias,
    longName: "profile",
  },
  {
    flags: "--full-response",
    description: optionModel["full-response"].description,
    shortName: "",
    longName: "full-response",
  },
  {
    flags: "--debug",
    description: optionModel.debug.description,
    shortName: "",
    longName: "debug",
  },
];

const defaultValues = new Map();
defaultValues.set("stage", "development");

const requiredTemplate = {true: "[REQUIRED]", false: "[OPTIONAL]"};
const jsonTemplate = {
  true:
    "[JSON]: Option value is JSON string, accepts JSON file by using either:" +
    '\n- "$(cat {filePath})", use "type" command to replace "cat" command in Windows.' +
    '\n- "file:{filePath}", file descriptor with either absolute or relative file path.\n',
  false: "",
};

const _makeEnumTemplate = (param: any) => (param.enum ? `[ENUM]: ${param.enum.join()}.\n` : "");
const _makeArrayTemplate = (param: any) => (param.isArray ? "[MULTIPLE]: Values can be separated by comma.\n" : "");

const _makeAlias = (kebabName: keyof typeof aliases) => (aliases[kebabName] ? `-${aliases[kebabName]},` : "");

const _makeOption = (param: any): SmapiOption => {
  const name = apiToCommanderMap.get(param.name) || param.name;
  const defaultValue = defaultValues.get(name);
  const shouldMakeOptional = param.required && defaultValue;
  if (shouldMakeOptional) {
    param.required = false;
  }
  const paramName = kebabCase(name);
  const alias = _makeAlias(paramName);
  const json: keyof typeof jsonTemplate = param.json || "false";
  const enumTemplate = _makeEnumTemplate(param);
  const arrayTemplate = _makeArrayTemplate(param);
  return {
    flags: `${alias}--${paramName} <${paramName}>`,
    description: (
      `${requiredTemplate[param.required as keyof typeof requiredTemplate]} ${(param.description || "").trim()} \n` +
      `${arrayTemplate}` +
      `${jsonTemplate[json]}` +
      `${enumTemplate} `
    ).trim(),
    defaultValue: shouldMakeOptional ? defaultValue : undefined,
    shortName: alias,
    longName: paramName,
  };
};

/**
 * Simple validation for options for which rules have been defined
 * @param options option-value pairs that were specified
 * @param id option id to lookup and validate
 * @throws error if no rules found or input was invalid
 */
const _validateOption = (options: {[key: string]: any}, id: string): void => {
  const model: OptionModel = optionModel as OptionModel;
  const entry: OptionModelEntry = model[id];
  if (!entry) throw `No entry with validation rules for ${id}.`;

  const optionName = camelCase(id);
  try {
    const value = options[optionName];
    if (value) {
      if (entry.stringInput === "REQUIRED") validateOptionString(options, optionName);
      // validate remaining rules
      validateOptionRules(options, optionName, entry.rule);
    }
  } catch (error) {
    throw `Please provide valid input for option: ${entry.name}. ${error}`;
  }
};

/**
 * Initialize metrics for smapi operations
 * @param command the command instance
 * @param optionsList the list of options
 */
const _initializeMetrics = (command: Command, optionsList: SmapiOption[]): void => {
  metricClient.startAction("smapi", command.name());
  const optionsProvided = command.opts();
  optionsList.forEach((option: SmapiOption) => {
    const name = option.longName,
      value = optionsProvided[camelCase(name)];
    if (value === undefined) return; // option was not set

    // metric client requires input validation when storing values
    try {
      _validateOption(optionsProvided, name);
      metricClient.setOption(name, value);
    } catch (error) {
      metricClient.setOption(name, "");
    }
  });
};

/**
 * Creates commander instance for Smapi operations.
 */
export const makeSmapiCommander = () => {
  const customizationProcessor = new CliCustomizationProcessor();
  const modelIntrospector = new ModelIntrospector(null, customizationProcessor);
  const operations = modelIntrospector.getOperations();

  const program = new Command();
  let commanderInstance: Command;

  operations.forEach((operation, commandName) => {
    const commanderToApiCustomizationMap = new Map();
    const {apiOperationName, description} = operation;
    commanderInstance = program.command(commandName).description(description).storeOptionsAsProperties(false);
    const {flatParamsMap} = operation.customizationMetadata;
    const optionsList: SmapiOption[] = [];
    flatParamsMap.forEach((param: any) => {
      const customizationValue = apiToCommanderMap.get(param.name);
      if (customizationValue) {
        commanderToApiCustomizationMap.set(customizationValue, param.name);
      }
      const option = _makeOption(param);
      optionsList.push(option);
      if (param.required) {
        commanderInstance.requiredOption(option.flags, option.description);
      } else {
        commanderInstance.option(option.flags, option.description, option.defaultValue);
      }
    });

    defaultOptions.forEach((option) => {
      commanderInstance.option(option.flags, option.description);
      optionsList.push(option);
    });
    commanderInstance.action((inputCmdObj: Command) => {
      _initializeMetrics(inputCmdObj, optionsList);

      return handler
        .smapiCommandHandler(apiOperationName, flatParamsMap, commanderToApiCustomizationMap, inputCmdObj, modelIntrospector)
        .then((res: any) => metricClient.sendData().then(() => res))
        .catch((err: any) => metricClient.sendData(err).then(() => Promise.reject(err)));
    });
  });

  // register hand-written appended commands
  uploadCreateCommand(program);
  exportPackageCreateCommand(program);
  getTaskCreateCommand(program);
  searchTaskCreateCommand(program);

  program.name("ask smapi");
  program.description(
    "The smapi command provides a number of sub-commands that " +
      "enable you to manage Alexa skills associated with your developer account.",
  );

  program.on("command:*", () => {
    console.error(`Command not recognized. Please run "${program.name}" to check the user instructions.`);
    process.exit(1);
  });

  return program;
};
