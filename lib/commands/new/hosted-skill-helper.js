const fs = require('fs');
const open = require('open');
const path = require('path');
const portScanner = require('portscanner');
const { URL, URLSearchParams } = require('url');

const CONSTANTS = require('@src/utils/constants');
const LocalHostServer = require('@src/utils/local-host-server');
const stringUtils = require('@src/utils/string-utils');
const Messenger = require('@src/view/messenger');
const SpinnerView = require('@src/view/spinner-view');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');

const permissionStatusMap = new Map();
permissionStatusMap.set(CONSTANTS.HOSTED_SKILL.PERMISSION_CHECK_RESULT.NEW_USER_REGISTRATION_REQUIRED,
    'Failed to validate CAPTCHA. Please try again.');
permissionStatusMap.set(CONSTANTS.HOSTED_SKILL.PERMISSION_CHECK_RESULT.RESOURCE_LIMIT_EXCEEDED,
    'Your hosted skills account is limited to a certain number of new hosted skills per minute. '
                    + 'Please try again later.');
permissionStatusMap.set(CONSTANTS.HOSTED_SKILL.PERMISSION_CHECK_RESULT.ALLOWED, null);

module.exports = {
    validateUserQualification,
    createHostedSkill
};

/**
 * To manage check permission and captcha validation for first time user
 * @param {string} vendorId The vendor ID
 * @param {Object} hostedSkillController The controller containing hosted skill main functionalities
 * @param {callback} callback { error, response }
 */
function validateUserQualification(vendorId, hostedSkillController, callback) {
    _checkPermission(hostedSkillController, vendorId, false, (error, actionUrl) => {
        if (error) {
            return callback(error);
        }
        if (!actionUrl) {
            return callback();
        }
        _solveCaptcha(vendorId, actionUrl, (captchaValidateError) => {
            if (captchaValidateError) {
                return callback(captchaValidateError);
            }
            // confirm captcha has been solved
            _checkPermission(hostedSkillController, vendorId, true, (reCheckPermissionError) => {
                if (reCheckPermissionError) {
                    return callback(reCheckPermissionError);
                }
                Messenger.getInstance().info('CAPTCHA validation was successfully completed. You are able to create a Alexa hosted skill.');
                return callback();
            });
        });
    });
}

/**
 * To create an Alexa hosted skill and clone it into local machine
 * @param {Object} hostedSkillController The controller containing hosted skill main functionalities
 * @param {Object} userInput The user input { deploymentType, language, projectFolderName, skillName }
 * @param {string} vendorId The vendor ID
 * @param {callback} callback { error, response }
 */
function createHostedSkill(hostedSkillController, userInput, vendorId, callback) {
    const rootPath = process.cwd();
    const projectPath = path.join(rootPath, userInput.projectFolderName);
    const { profile, doDebug } = hostedSkillController;
    const skillMetadataController = new SkillMetadataController({ profile, doDebug });
    if (fs.existsSync(projectPath)) {
        return callback(`${projectPath} directory already exists.`);
    }
    const manifest = _updateManifest(userInput);
    const input = {
        vendorId,
        manifest,
        runtime: userInput.language,
        region: userInput.region
    };

    const listenSpinner = new SpinnerView();
    listenSpinner.start('Creating your Alexa hosted skill. It will take about a minute.');
    hostedSkillController.createSkill(input, (createErr, skillId) => {
        listenSpinner.terminate();
        if (createErr) {
            if (!skillId) {
                return callback(createErr);
            }
            hostedSkillController.deleteSkill(skillId, callback(createErr));
        }
        hostedSkillController.clone(skillId, userInput.skillName, projectPath, (cloneErr) => {
            if (cloneErr) {
                return callback(cloneErr);
            }
            skillMetadataController.enableSkill((enableErr) => {
                if (enableErr) {
                    return callback(enableErr);
                }
                const templateUrl = CONSTANTS.HOSTED_SKILL.GIT_HOOKS_TEMPLATES.PRE_PUSH.URL;
                const filePath = `${userInput.projectFolderName}/.git/hooks/pre-push`;
                hostedSkillController.downloadGitHooksTemplate(templateUrl, filePath, (hooksErr) => {
                    if (hooksErr) {
                        return callback(hooksErr);
                    }
                    callback(null, skillId);
                });
            });
        });
    });
}

/**
 * To update hosted skill manifest template with user input
 * and return the manifest object.
 * @param {Object} userInput The skill name
 */
function _updateManifest(userInput) {
    const { skillName, locale } = userInput;
    const manifest = CONSTANTS.HOSTED_SKILL.MANIFEST;

    manifest.publishingInformation.locales[locale] = {};
    manifest.publishingInformation.locales[locale].name = skillName;

    return manifest;
}

/**
 * Check user's permission to access hosted skill and handle error messages
 * @param {Object} hostedSkillController The controller containing hosted skill main functionalities
 * @param {boolean} isReCheck the recheck flag
 * @param {callback} callback { error, response }
 */
function _checkPermission(hostedSkillController, vendorId, isReCheck, callback) {
    hostedSkillController.getHostedSkillPermission(vendorId, CONSTANTS.HOSTED_SKILL.PERMISSION_ENUM.NEW_SKILL,
        (permissionError, permissionRes) => {
            if (permissionError) {
                return callback(permissionError);
            }

            if (!isReCheck
                && permissionRes.status === CONSTANTS.HOSTED_SKILL.PERMISSION_CHECK_RESULT.NEW_USER_REGISTRATION_REQUIRED) {
                Messenger.getInstance().info('CAPTCHA validation is required for a new hosted skill user.');
                return callback(null, permissionRes.actionUrl);
            }

            const errorMessage = permissionStatusMap.get(permissionRes.status);
            if (errorMessage) {
                return callback(errorMessage);
            }
            return callback();
        });
}

/**
 * To navigate user to the captcha validation page
 * @param {string} vendorId The Vendor ID
 * @param {string} captchaUrl The captcha url
 * @param {callback} callback { error, response }
 */
function _solveCaptcha(vendorId, captchaUrl, callback) {
    Messenger.getInstance().info('Go to the CAPTCHA page, confirm that you are signed into the correct developer account, and solve the CAPTCHA.\n'
        + 'If your browser does not open the page, quit this process, paste the following url into your browser, '
        + `and complete the CAPTCHA.\n${captchaUrl}`);

    portScanner.checkPortStatus(CONSTANTS.LOCALHOST_PORT, (err, status) => {
        if (err) {
            callback(err);
        } else {
            if (status === 'closed') {
                _openLoginUrlWithRedirectLink(captchaUrl, vendorId);
                _listenResponseFromCaptchaServer(CONSTANTS.LOCALHOST_PORT, (error) => {
                    callback(error);
                });
            } else {
                callback(`${CONSTANTS.LOCALHOST_PORT} port on localhost has been occupied, `
                    + 'ask-cli cannot start a local server for receiving authorization code.\n'
                    + `Please either abort any processes running on port ${CONSTANTS.LOCALHOST_PORT} `
                    + 'or add `--no-browser` flag to the command as an alternative approach.');
            }
        }
    });
}

/**
 * Build and open the url that navigates user to captcha validation page after login.
 * @param captcha the validation url
 * @param vendorId the vendor Id
 */
function _openLoginUrlWithRedirectLink(captchaUrl, vendorId) {
    const envVarSignInHost = process.env.ASK_LWA_AUTHORIZE_HOST;
    const loginUrl = new URL(envVarSignInHost && stringUtils.isNonBlankString(envVarSignInHost)
        ? envVarSignInHost + CONSTANTS.HOSTED_SKILL.SIGNIN_PATH : CONSTANTS.LWA.SIGNIN_URL);

    loginUrl.search = new URLSearchParams([
        ['openid.ns', 'http://specs.openid.net/auth/2.0'],
        ['openid.mode', 'checkid_setup'],
        ['openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select'],
        ['openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select'],
        ['openid.assoc_handle', 'amzn_dante_us'],
        ['openid.return_to', `${captchaUrl}?vendor_id=${vendorId}&redirect_url=http://127.0.0.1:9090/captcha`],
        ['openid.pape.max_auth_age', 7200]
    ]).toString();
    open(loginUrl.href);
}

/**
 * Start a local server and listen the response from the captcha validation server,
 * then extract validation result from it.
 * @param PORT
 * @param callback with error
 */
function _listenResponseFromCaptchaServer(PORT, callback) {
    const listenSpinner = new SpinnerView();
    const server = new LocalHostServer(PORT);
    server.create(handleServerRequest);
    server.listen(() => {
        listenSpinner.start(` Listening on http://localhost:${PORT}...`);
    });
    server.registerEvent('connection', (socket) => {
        socket.unref();
    });

    function handleServerRequest(request, response) {
        response.on('close', () => {
            request.socket.destroy();
        });
        listenSpinner.terminate();
        server.destroy();
        if (request.url.startsWith('/captcha?success')) {
            response.end('CAPTCHA validation was successful. Please close the browser and return to the command line interface.');
            callback();
        } else if (request.url.startsWith('/captcha?error')) {
            const errorMsg = 'Failed to validate the CAPTCHA with internal service error. Please try again later.';
            response.statusCode = 500;
            response.end(errorMsg);
            callback(errorMsg);
        } else if (request.url.startsWith('/captcha?vendorId')) {
            const errorMsg = 'The Vendor ID in the browser session does not match the one associated with your CLI profile. \n'
                + 'Please sign into the correct developer account in your browser before completing the CAPTCHA.';
            response.statusCode = 400;
            response.end(errorMsg);
            callback(errorMsg);
        } else if (request.url.startsWith('/favicon.ico')) {
            request.socket.destroy();
            response.statusCode = 204;
            response.end();
        } else {
            const errorMsg = 'Failed to validate the CAPTCHA. Please try again.';
            response.statusCode = 404;
            response.end(errorMsg);
            callback(errorMsg);
        }
    }
}
