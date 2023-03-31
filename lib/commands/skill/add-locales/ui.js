const inquirer = require("inquirer");
const path = require("path");
const acUtil = require("../../../utils/ac-util");

const Messenger = require("../../../view/messenger");

module.exports = {
  selectLocales,
  displayAddLocalesResult,
};

/**
 * Prompt users to select locales
 * @param {Array} localeChoices
 * @param {Function} callback
 */
function selectLocales(localeChoices, callback) {
  inquirer
    .prompt([
      {
        message: "Please select at least one locale to add:",
        type: "checkbox",
        name: "localeList",
        choices: localeChoices,
      },
    ])
    .then((answer) => {
      callback(null, answer.localeList);
    })
    .catch((error) => {
      callback(error);
    });
}

/**
 * Display the result of locales addition
 * @param {Array} selectedLocales selected locales
 * @param {Map} iModelSourceByLocales Map { locale: { uri, canCopy} }
 */
function displayAddLocalesResult(selectedLocales, iModelSourceByLocales, profile) {
  for (const locale of selectedLocales) {
    if (!iModelSourceByLocales.has(locale)) {
      Messenger.getInstance().info(`Locale ${locale}.json already exists`);
    }
  }
  Messenger.getInstance().info("");
  if (iModelSourceByLocales.size === 0) {
    return;
  }

  Messenger.getInstance().info("The following skill locale(s) have been added according to your local project:");
  iModelSourceByLocales.forEach((v, k) => {
    if (v.canCopy) {
      const sourceLocale = path.basename(v.uri, path.extname(v.uri));
      Messenger.getInstance().info(`  Added locale ${k}.json from ${sourceLocale}'s interactionModel`);
    } else {
      Messenger.getInstance().info(`  Added locale ${k}.json from the template of interactionModel`);
    }
  });
  acUtil.isAcSkill(profile)
    ? Messenger.getInstance().info(
        'Please check the added files above, compile your Alexa Conversation skill and run "ask deploy" to deploy the changes.',
      )
    : Messenger.getInstance().info('Please check the added files above, and run "ask deploy" to deploy the changes.');
}
