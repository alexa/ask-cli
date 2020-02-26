const R = require('ramda');

module.exports = {
    validateDialogArgs
};

/**
 * Validates if a skill is enabled for simulation. Calls Skill Management apis (SMAPI) to achieve this.
 * @param {*} dialogMode encapsulates configuration required validate skill information
 * @param {*} callback
 */
function validateDialogArgs(dialogMode, callback) {
    const { smapiClient, skillId, stage, locale } = dialogMode;

    smapiClient.skill.manifest.getManifest(skillId, stage, (err, response) => {
        if (err) {
            return callback(err);
        }
        if (response.statusCode !== 200) {
            return callback(smapiErrorMsg('get-manifest', response));
        }
        const apis = R.view(R.lensPath(['body', 'manifest', 'apis']), response);
        if (!apis) {
            return callback('Ensure "manifest.apis" object exists in the skill manifest.');
        }

        const apisKeys = Object.keys(apis);
        if (!apisKeys || apisKeys.length !== 1) {
            return callback('Dialog command only supports custom skill type.');
        }

        if (apisKeys[0] !== 'custom') {
            return callback(`Dialog command only supports custom skill type, but current skill is a "${apisKeys[0]}" type.`);
        }

        const locales = R.view(R.lensPath(['body', 'manifest', 'publishingInformation', 'locales']), response);
        if (!locales) {
            return callback('Ensure the "manifest.publishingInformation.locales" exists in the skill manifest before simulating your skill.');
        }

        if (!R.view(R.lensProp(locale), locales)) {
            return callback(
                `Locale ${locale} was not found for your skill. `
                + 'Ensure the locale you want to simulate exists in your publishingInformation.'
            );
        }

        smapiClient.skill.getSkillEnablement(skillId, stage, (enableErr, enableResponse) => {
            if (enableErr) {
                return callback(enableErr);
            }
            if (enableResponse.statusCode > 300) {
                return callback(smapiErrorMsg('get-skill-enablement', enableResponse));
            }
            callback();
        });
    });
}

function smapiErrorMsg(operation, res) {
    return `SMAPI ${operation} request error: ${res.statusCode} - ${res.body.message}`;
}
