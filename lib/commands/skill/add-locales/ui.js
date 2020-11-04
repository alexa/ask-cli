const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');

const Messenger = require('@src/view/messenger');

module.exports = {
    selectLocales,
    displayAddLocalesResult
};

/**
 * Prompt users to select locales
 * @param {Array} localeChoices
 * @param {Function} callback
 */
function selectLocales(localeChoices, callback) {
    inquirer.prompt([{
        message: 'Please select at least one locale to add:',
        type: 'checkbox',
        name: 'localeList',
        choices: localeChoices
    }]).then((answer) => {
        callback(null, answer.localeList);
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Display the result of locales addition
 * @param {Array} selectedLocales selected locales
 * @param {Map} iModelSourceByLocales Map { locale: filePath/remoteURI }
 */
function displayAddLocalesResult(selectedLocales, iModelSourceByLocales) {
    for (const locale of selectedLocales) {
        if (!iModelSourceByLocales.has(locale)) {
            Messenger.getInstance().info(`Locale ${locale}.json already exists`);
        }
    }
    Messenger.getInstance().info('');
    if (iModelSourceByLocales.size === 0) {
        return;
    }

    Messenger.getInstance().info('The following skill locale(s) have been added according to your local project:');
    iModelSourceByLocales.forEach((v, k) => {
        if (fs.existsSync(v)) {
            const sourceLocale = path.basename(v, path.extname(v));
            Messenger.getInstance().info(`  Added locale ${k}.json from ${sourceLocale}'s interactionModel`);
        } else {
            Messenger.getInstance().info(`  Added locale ${k}.json from the template of interactionModel`);
        }
    });
    Messenger.getInstance().info('Please check the added files above, and run "ask deploy" to deploy the changes.');
}
