const R = require('ramda');
const fs = require('fs');
const Messenger = require('@src/view/messenger');
const path = require('path');

module.exports = {
    validateRequiredOption,
    validateOptionString,
    validateOptionRules,
};

const optionRuleValidatorMap = {
    ENUM(options, key, ruleModel) {
        assertNotNullForRuleModel(ruleModel, 'values');
        const possibleValues = ruleModel.values;
        if (!possibleValues.includes(options[key])) {
            throw (`Value must be in (${possibleValues.join(', ')}).`);
        }
    },
    REGEX(options, key, ruleModel) {
        assertNotNullForRuleModel(ruleModel, 'regex');
        const regex = new RegExp(ruleModel.regex);
        if (!regex.test(options[key])) {
            throw (`Input value (${options[key]}) doesn't match REGEX rule ${ruleModel.regex}.`);
        }
    },
    FILE_PATH(options, key, ruleModel) {
        try {
            fs.accessSync(options[key], fs.constants.R_OK);
        } catch (e) {
            if (e.code === 'ENOENT') {
                throw 'File does not exist with the given path.';
            } else {
                throw 'The provided file must have read permission.';
            }
        }

        if (ruleModel.extension) {
            if (!ruleModel.extension.includes(path.extname(options[key]))) {
                throw `File extension is not of type ${ruleModel.extension}.`;
            }
        }
    },
    NUMBER(options, key) {
        const num = Number(options[key]);

        if (Number.isNaN(num)) {
            throw 'Input should be a number.';
        }
    },
    INTEGER(options, key) {
        optionRuleValidatorMap.NUMBER(options, key);

        const num = Number(options[key]);

        if (!Number.isInteger(num)) {
            throw 'Input number should be an integer.';
        }
    }
};

function assertNotNullForRuleModel(obj, key) {
    // TODO add unit test after logger integration
    if (obj[key] == null) {
        Messenger.getInstance().fatal(new Error(`Option rule model of type "${obj.type}" requires field "${key}" to be set!`));
        Messenger.getInstance().dispose();
        process.exit(1);
    }
}

/**
 * Validate that option value has been set
 * @param options
 * @param key
 */
function validateRequiredOption(options, key) {
    if (R.isNil(options[key])) {
        throw ('Field is required and must be set.');
    }
}

/**
 * Validate that option value is valid non-empty string
 * @param options
 * @param key
 */
function validateOptionString(options, key) {
    if (!R.is(String, options[key])) {
        throw ('Must be a string.');
    }
    if (R.isEmpty(options[key].trim())) {
        throw ('Value must not be empty.');
    }
}

/**
 * Validate option value against specific rules
 * @param options
 * @param key
 * @param rules
 */
function validateOptionRules(options, key, rules) {
    // if no rule is associated with current option key, fallback to no-op
    if (rules && rules.length) {
        for (const rule of rules) {
            const ruleValidator = optionRuleValidatorMap[rule.type];

            // check if there is a validator for given rule type. If not, fallback to no-op
            if (ruleValidator) {
                ruleValidator(options, key, rule);
            }
        }
    }
}
