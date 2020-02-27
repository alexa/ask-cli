const fs = require('fs');

const stringUtility = require('@src/utils/string-utils');

const ui = require('./ui');

module.exports = {
    prepareAccountLinkingPayload,
    getManifest
};

/**
 * Get the account linking info to get it ready for the request to SMAPI
 * @param {Object} smapiClient SMAPI client to make request
 * @param {*} skillId skill-id
 * @param {*} stage skill stage
 * @param {*} filePath optional file path if users opt to provide file input
 * @param {*} callback (error, accountLinkingInfo)
 */
function prepareAccountLinkingPayload(smapiClient, skillId, stage, filePath, callback) {
    // get account linking info from file input
    if (stringUtility.isNonBlankString(filePath)) {
        try {
            const accountLinking = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (!accountLinking || !accountLinking.accountLinkingRequest) {
                callback('[Error]: Account linking schema is not in the correct format. Please turn to '
                + 'https://developer.amazon.com/docs/smapi/account-linking-schemas.html#accountlinkingrequest-object for reference.');
            } else {
                callback(null, accountLinking);
            }
        } catch (e) {
            callback(e);
        }
        return;
    }

    // get account linking info from interactive mode
    getManifest(smapiClient, skillId, stage, (getManifestErr, manifest) => {
        if (getManifestErr) {
            return callback(getManifestErr);
        }
        ui.buildQuestionGroups(manifest, (groups) => {
            ui.collectAccountLinkingAnswersByGroups(groups, (accountLinking) => {
                callback(null, accountLinking);
            });
        });
    });
}

function getManifest(smapiClient, skillId, stage, callback) {
    smapiClient.skill.manifest.getManifest(skillId, stage, (getManifestErr, response) => {
        if (getManifestErr) {
            return callback(getManifestErr);
        }
        if (response.statusCode === 303) {
            return callback('[Warn]: The get-manifest request is not ready. Please try again later.');
        }

        if (response.statusCode < 300) {
            callback(null, response.body);
        } else {
            callback(response.body, null);
        }
    });
}
