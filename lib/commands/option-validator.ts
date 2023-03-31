const R = require("ramda");
const fs = require("fs");
const urlUtils = require("../utils/url-utils");
import Messenger from "../view/messenger";
import path from "path";

export {validateRequiredOption, validateOptionString, validateOptionRules};

export interface OptionModelEntry {
  name: string;
  description: string;
  alias?: string | null;
  stringInput: string;
  rule?: OptionModelRule[];
}

export interface Enum {
  type: "ENUM";
  values: string[];
}

export interface Regex {
  type: "REGEX";
  regex: string | RegExp;
}

export interface FilePath {
  type: "FILE_PATH";
  extension?: string;
}

export type OptionModelRule =
  | Enum
  | Regex
  | FilePath
  | {
      type: "NUMBER" | "INTEGER" | "URL";
    };

export type OptionModel = Record<string, OptionModelEntry>;

export type OptionRuleValidatorMap = {
  [key in OptionModelRule["type"]]: <T extends {type: key}>(options: any, key: any, rule?: T) => void;
};

export const optionRuleValidatorMap: OptionRuleValidatorMap = {
  ENUM: (options, key, ruleModel) => {
    assertNotNullForRuleModel<Enum>(ruleModel, "values");
    const possibleValues = ruleModel.values;
    if (!possibleValues.includes(options[key])) {
      throw `Value must be in (${possibleValues.join(", ")}).`;
    }
  },
  REGEX(options, key, ruleModel) {
    assertNotNullForRuleModel<Regex>(ruleModel, "regex");
    const regex = new RegExp(ruleModel.regex);
    if (!regex.test(options[key])) {
      throw `Input value (${options[key]}) doesn't match REGEX rule ${ruleModel.regex}.`;
    }
  },
  FILE_PATH(options, key, ruleModel?: FilePath) {
    try {
      fs.accessSync(options[key], fs.constants.R_OK);
    } catch (e) {
      if ((e as any).code === "ENOENT") {
        throw "File does not exist with the given path.";
      } else {
        throw "The provided file must have read permission.";
      }
    }

    if (ruleModel && (<FilePath>ruleModel).extension) {
      if (!(<FilePath>ruleModel).extension?.includes(path.extname(options[key]))) {
        throw `File extension is not of type ${(<FilePath>ruleModel).extension}.`;
      }
    }
  },
  NUMBER(options, key) {
    const num = Number(options[key]);

    if (Number.isNaN(num)) {
      throw "Input should be a number.";
    }
  },
  INTEGER(options, key) {
    optionRuleValidatorMap.NUMBER(options, key);

    const num = Number(options[key]);

    if (!Number.isInteger(num)) {
      throw "Input number should be an integer.";
    }
  },
  URL(options, key) {
    if (!urlUtils.isValidUrl(options[key])) {
      throw "Input should be a URL.";
    }
  },
};

function assertNotNullForRuleModel<T extends OptionModelRule>(obj: Partial<T> | undefined, key: keyof T): asserts obj is T {
  // TODO add unit test after logger integration
  if (!obj || !(obj as any)[key]) {
    obj && Messenger.getInstance().fatal(new Error(`Option rule model of type "${obj.type}" requires field "${String(key)}" to be set!`));
    Messenger.getInstance().dispose();
    process.exit(1);
  }
}

/**
 * Validate that option value has been set
 * @param options
 * @param key
 */
function validateRequiredOption(options: Record<string, any>, key: string) {
  if (!options[key]) {
    throw "Field is required and must be set.";
  }
}

/**
 * Validate that option value is valid non-empty string
 * @param options
 * @param key
 */
function validateOptionString(options: Record<string, any>, key: string) {
  if (!R.is(String, options[key])) {
    throw "Must be a string.";
  }
  if (R.isEmpty(options[key].trim())) {
    throw "Value must not be empty.";
  }
}

/**
 * Validate option value against specific rules
 * @param options
 * @param key
 * @param rules
 */
function validateOptionRules(options: Record<string, any>, key: string, rules: OptionModelRule[] | undefined) {
  // if no rule is associated with current option key, fallback to no-op
  if (rules && rules.length) {
    for (const rule of rules) {
      const ruleValidator = optionRuleValidatorMap[rule.type] as any;

      // check if there is a validator for given rule type. If not, fallback to no-op
      if (ruleValidator) {
        ruleValidator(options, key, rule);
      }
    }
  }
}
