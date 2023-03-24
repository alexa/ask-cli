import fs from "fs";
import open from "open";
import path from "path";
import {URL, URLSearchParams} from "url";
import {HOSTED_SKILL, LOCALHOST_PORT, LWA} from "../../utils/constants";
import LocalHostServer from "../../utils/local-host-server";
import stringUtils from "../../utils/string-utils";
import Messenger from "../../view/messenger";
import SpinnerView from "../../view/spinner-view";
import SkillMetadataController from "../../controllers/skill-metadata-controller";
import HostedSkillController from "../../controllers/hosted-skill-controller";
import {callbackError, uiCallback} from "../../model/callback";
import {Socket} from "node:net";
import {IncomingMessage, ServerResponse} from "http";
import portScanner, {Status} from "portscanner";
import {NewSkillUserInput} from ".";

const permissionStatusMap = new Map<string, Error | undefined>();
permissionStatusMap.set(
  HOSTED_SKILL.PERMISSION_CHECK_RESULT.NEW_USER_REGISTRATION_REQUIRED,
  new Error("Failed to validate CAPTCHA. Please try again."),
);
permissionStatusMap.set(
  HOSTED_SKILL.PERMISSION_CHECK_RESULT.RESOURCE_LIMIT_EXCEEDED,
  new Error("Your hosted skills account is limited to a certain number of new hosted skills per minute. Please try again later."),
);
permissionStatusMap.set(HOSTED_SKILL.PERMISSION_CHECK_RESULT.ALLOWED, undefined);

/**
 * To manage check permission and captcha validation for first time user
 * @param {string} vendorId The vendor ID
 * @param {Object} hostedSkillController The controller containing hosted skill main functionalities
 * @param {callback} callback { error, response }
 */
export function validateUserQualification(vendorId: string, hostedSkillController: HostedSkillController, callback: uiCallback): void {
  _checkPermission(hostedSkillController, vendorId, false, (error: callbackError, actionUrl: string) => {
    if (error) {
      callback(error);
    } else {
      !actionUrl
        ? callback(null)
        : _solveCaptcha(vendorId, actionUrl, (captchaValidateError) => {
            captchaValidateError
              ? callback(captchaValidateError)
              : _checkPermission(hostedSkillController, vendorId, true, (reCheckPermissionError: callbackError) => {
                  if (reCheckPermissionError) {
                    callback(reCheckPermissionError);
                  } else {
                    Messenger.getInstance().info(
                      "CAPTCHA validation was successfully completed. You are able to create a Alexa hosted skill.",
                    );
                    callback(null);
                  }
                });
          });
    }
  });
}

/**
 * To create an Alexa hosted skill and clone it into local machine
 * @param {Object} hostedSkillController The controller containing hosted skill main functionalities
 * @param {NewSkillUserInput} userInput The user input { deploymentType, language, projectFolderName, skillName }
 * @param {string} vendorId The vendor ID
 * @param {callback} callback { error, response }
 */
export function createHostedSkill(
  hostedSkillController: HostedSkillController,
  userInput: NewSkillUserInput,
  vendorId: string,
  callback: uiCallback,
): void {
  const rootPath = process.cwd();
  const projectPath = path.join(rootPath, userInput.projectFolderName!);
  if (fs.existsSync(projectPath)) {
    callback(new Error(`${projectPath} directory already exists.`));
  } else {
    const {profile, doDebug} = hostedSkillController;
    const skillMetadataController = new SkillMetadataController({profile, doDebug});
    const manifest = _updateManifest(userInput);
    const input = {
      vendorId,
      manifest,
      runtime: userInput.language,
      region: userInput.region,
    };
    const listenSpinner = new SpinnerView();
    listenSpinner.start("Creating your Alexa hosted skill. It will take about a minute.");
    hostedSkillController.createSkill(input, (createErr: callbackError, skillId: string) => {
      listenSpinner.terminate();
      if (createErr) {
        !skillId ? callback(createErr) : hostedSkillController.deleteSkill(skillId, callback(createErr));
      } else {
        hostedSkillController.updateAskSystemScripts((scriptErr: callbackError) => {
          scriptErr
            ? callback(scriptErr)
            : hostedSkillController.clone(skillId, userInput.skillName!, projectPath, (cloneErr: callbackError) => {
                cloneErr
                  ? callback(cloneErr)
                  : skillMetadataController.enableSkill((enableErr: callbackError) => {
                      enableErr
                        ? callback(enableErr)
                        : hostedSkillController.updateSkillPrePushScript(userInput.projectFolderName!, (hooksErr: callbackError) => {
                            hooksErr ? callback(hooksErr) : callback(null, skillId);
                          });
                    });
              });
        });
      }
    });
  }
}

/**
 * To update hosted skill manifest template with user input
 * and return the manifest object.
 * @param {Object} userInput object containing skillName
 * @returns {Manifest} an updated manifest including default apis and updated publishingInformation
 */
function _updateManifest(userInput: NewSkillUserInput): {publishingInformation: any; apis: any} {
  const skillName = userInput.skillName;
  const locale: string = userInput.locale || HOSTED_SKILL.DEFAULT_LOCALE;
  const manifest: {publishingInformation: any; apis: any} = HOSTED_SKILL.MANIFEST;

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
function _checkPermission(hostedSkillController: HostedSkillController, vendorId: string, isReCheck: boolean, callback: uiCallback): void {
  hostedSkillController.getHostedSkillPermission(
    vendorId,
    HOSTED_SKILL.PERMISSION_ENUM.NEW_SKILL,
    (permissionError: callbackError, permissionRes: any) => {
      if (permissionError) {
        callback(permissionError);
      } else if (!isReCheck && permissionRes.status === HOSTED_SKILL.PERMISSION_CHECK_RESULT.NEW_USER_REGISTRATION_REQUIRED) {
        Messenger.getInstance().info("CAPTCHA validation is required for a new hosted skill user.");
        callback(null, permissionRes.actionUrl);
      } else {
        callback(permissionStatusMap.get(permissionRes.status) || null);
      }
    },
  );
}

/**
 * To navigate user to the captcha validation page
 * @param {string} vendorId The Vendor ID
 * @param {string} captchaUrl The captcha url
 * @param {callback} callback { error, response }
 */
function _solveCaptcha(vendorId: string, captchaUrl: string, callback: uiCallback): void {
  Messenger.getInstance().info(
    "Go to the CAPTCHA page, confirm that you are signed into the correct developer account, and solve the CAPTCHA.\n" +
      "If your browser does not open the page, quit this process, paste the following url into your browser, " +
      `and complete the CAPTCHA.\n${captchaUrl}`,
  );

  portScanner.checkPortStatus(Number.parseInt(LOCALHOST_PORT), (err: Error | null, status: Status) => {
    if (err) {
      callback(err);
    } else {
      if (status === "closed") {
        _openLoginUrlWithRedirectLink(captchaUrl, vendorId);
        _listenResponseFromCaptchaServer(LOCALHOST_PORT, (error: callbackError) => {
          callback(error);
        });
      } else {
        callback(
          new Error(
            `${LOCALHOST_PORT} port on localhost has been occupied, ` +
              "ask-cli cannot start a local server for receiving authorization code.\n" +
              `Please either abort any processes running on port ${LOCALHOST_PORT} ` +
              "or add `--no-browser` flag to the command as an alternative approach.",
          ),
        );
      }
    }
  });
}

/**
 * Build and open the url that navigates user to captcha validation page after login.
 * @param captcha the validation url
 * @param vendorId the vendor Id
 */
function _openLoginUrlWithRedirectLink(captchaUrl: string, vendorId: string): void {
  const envVarSignInHost = process.env.ASK_LWA_AUTHORIZE_HOST;
  const loginUrl = new URL(
    envVarSignInHost && stringUtils.isNonBlankString(envVarSignInHost) ? envVarSignInHost + HOSTED_SKILL.SIGNIN_PATH : LWA.SIGNIN_URL,
  );

  loginUrl.search = new URLSearchParams([
    ["openid.ns", "http://specs.openid.net/auth/2.0"],
    ["openid.mode", "checkid_setup"],
    ["openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select"],
    ["openid.identity", "http://specs.openid.net/auth/2.0/identifier_select"],
    ["openid.assoc_handle", "amzn_dante_us"],
    ["openid.return_to", `${captchaUrl}?vendor_id=${vendorId}&redirect_url=http://127.0.0.1:9090/captcha`],
    ["openid.pape.max_auth_age", "7200"],
  ]).toString();
  open(loginUrl.href);
}

/**
 * Start a local server and listen the response from the captcha validation server,
 * then extract validation result from it.
 * @param PORT
 * @param callback with error
 */
function _listenResponseFromCaptchaServer(PORT: string, callback: uiCallback): void {
  const listenSpinner = new SpinnerView();
  const server = new LocalHostServer(PORT);
  server.create(handleServerRequest);
  server.listen(() => {
    listenSpinner.start(` Listening on http://localhost:${PORT}...`);
  });
  server.registerEvent("connection", (socket: Socket) => {
    socket.unref();
  });

  function handleServerRequest(request: IncomingMessage, response: ServerResponse) {
    response.on("close", () => {
      request.socket.destroy();
    });
    listenSpinner.terminate();
    server.destroy();

    if (request.url?.startsWith("/captcha?success")) {
      response.end("CAPTCHA validation was successful. Please close the browser and return to the command line interface.");
      callback(null);
    } else if (request.url?.startsWith("/captcha?error")) {
      const errorMsg = "Failed to validate the CAPTCHA with internal service error. Please try again later.";
      response.statusCode = 500;
      response.end(errorMsg);
      callback(new Error(errorMsg));
    } else if (request.url?.startsWith("/captcha?vendorId")) {
      const errorMsg =
        "The Vendor ID in the browser session does not match the one associated with your CLI profile. \n" +
        "Please sign into the correct developer account in your browser before completing the CAPTCHA.";
      response.statusCode = 400;
      response.end(errorMsg);
      callback(new Error(errorMsg));
    } else if (request.url?.startsWith("/favicon.ico")) {
      request.socket.destroy();
      response.statusCode = 204;
      response.end();
    } else {
      const errorMsg = "Failed to validate the CAPTCHA. Please try again.";
      response.statusCode = 404;
      response.end(errorMsg);
      callback(new Error(errorMsg));
    }
  }
}
