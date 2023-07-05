const open = require("open");
const portscanner = require("portscanner");
const url = require("url");

const LWAAuthCodeClient = require("../../clients/lwa-auth-code-client");
const AppConfig = require("../../model/app-config");
const CONSTANTS = require("../../utils/constants");
const LocalHostServer = require("../../utils/local-host-server");
const stringUtils = require("../../utils/string-utils");
const Messenger = require("../../view/messenger");
const SpinnerView = require("../../view/spinner-view");

const messages = require("./messages");
const ui = require("./ui");

module.exports = class AuthorizationController {
  /**
   * Constructor for AuthorizationController.
   * @param {Object} config | contains default scopes, default state, auth_client_type (LWA),
   * redirectUri, askProfile config file path, needBrowser, debug information. For more details,
   * see ../../../commands/configure/helper.js
   */
  constructor(config) {
    this.authConfig = config;
    this.oauthClient = this._getAuthClientInstance();
  }

  /**
   * Generates Authorization URL.
   */
  getAuthorizeUrl() {
    return this.oauthClient.generateAuthorizeUrl();
  }

  /**
   * Retrieves access token.
   * @param {String} authCode | authorization code.
   * @param {Function} callback
   */
  getAccessTokenUsingAuthCode(authCode, callback) {
    return this.oauthClient.getAccessTokenUsingAuthCode(authCode, (err, accessToken) => callback(err, err == null ? accessToken : err));
  }

  /**
   * Refreshes token and sets up authorization param.
   * @param {String} profile | current profile in use.
   * @param {Function} callback
   */
  tokenRefreshAndRead(profile, callback) {
    if (profile === CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
      const askRefreshToken = process.env.ASK_REFRESH_TOKEN;
      const askAccessToken = process.env.ASK_ACCESS_TOKEN;

      // '!== undefined' check is required because environment variables return values as strings instead of objects.
      const isNonBlankRefreshToken = stringUtils.isNonBlankString(askRefreshToken) && askRefreshToken !== "undefined";
      const isNonBlankAccessToken = stringUtils.isNonBlankString(askAccessToken) && askAccessToken !== "undefined";
      if (!isNonBlankRefreshToken && !isNonBlankAccessToken) {
        return callback(messages.ASK_ENV_VARIABLES_ERROR_MESSAGE);
      }
      if (isNonBlankRefreshToken) {
        this.oauthClient.refreshToken({refresh_token: askRefreshToken}, (err, token) => {
          if (err) {
            return callback(err);
          }
          callback(null, token.access_token);
        });
      } else if (isNonBlankAccessToken) {
        return callback(null, askAccessToken);
      }
    } else if (this.oauthClient.isValidToken(AppConfig.getInstance().getToken(profile))) {
      callback(null, AppConfig.getInstance().getToken(profile).access_token);
    } else {
      this._getRefreshTokenAndUpdateConfig(profile, AppConfig.getInstance().getToken(profile), (err, token) =>
        callback(err, err === null ? token : err),
      );
    }
  }

  /**
   * @param {String} profile | profile in use currently.
   * @param {String} configFilePath | path for the config file.
   * @param {Function} callback
   * @private
   */
  _getRefreshTokenAndUpdateConfig(profile, token, callback) {
    this.oauthClient.refreshToken(token, (err, refreshedAccessToken) => {
      if (err) {
        return callback(err);
      }
      AppConfig.getInstance().setToken(profile, refreshedAccessToken);
      AppConfig.getInstance().write();
      callback(null, refreshedAccessToken.access_token);
    });
  }

  /**
   * Helper method to keep listening to LWA response.
   * @param {Function} callback
   */
  getTokensByListeningOnPort(callback) {
    const PORT = CONSTANTS.LWA.LOCAL_PORT;
    this.oauthClient.config.redirectUri = `http://127.0.0.1:${PORT}/cb`;
    portscanner.checkPortStatus(PORT, (err, currentStatus) => {
      if (err) {
        return callback(err);
      }
      if (currentStatus !== "closed") {
        return callback(messages.PORT_OCCUPIED_WARN_MESSAGE);
      }
      Messenger.getInstance().info(messages.AUTH_MESSAGE);

      setTimeout(() => {
        open(this.oauthClient.generateAuthorizeUrl());
      }, CONSTANTS.CONFIGURATION.OPEN_BROWSER_DELAY);

      this._listenResponseFromLWA(PORT, (error, authCode) => {
        if (error) {
          return callback(error);
        }
        this.oauthClient.getAccessTokenUsingAuthCode(authCode, (accessTokenError, accessToken) =>
          callback(accessTokenError, accessTokenError == null ? accessToken : accessTokenError),
        );
      });
    });
  }

  /**
   * Helper method to facilitate spinner view and handle clean up process.
   * @param {String} PORT | port to be listened on.
   * @param {Function} callback
   * @private
   */
  _listenResponseFromLWA(PORT, callback) {
    const listenSpinner = new SpinnerView();
    const server = new LocalHostServer(PORT);
    server.create(serverCallback);
    server.listen(() => {
      listenSpinner.start(` Listening on http://localhost:${PORT}...`);
    });
    server.registerEvent("connection", (socket) => {
      socket.unref();
    });

    function serverCallback(request, response) {
      response.on("close", () => {
        request.socket.destroy();
      });
      listenSpinner.terminate();
      const requestUrl = request.url;
      const requestQuery = url.parse(requestUrl, true).query;

      // Response from the browser with authentication code
      if (requestUrl.startsWith("/cb?code")) {
        response.end(messages.ASK_SIGN_IN_SUCCESS_MESSAGE);
        ui.confirmAllowSignIn((error, confirmSignInChoice) => {
          // Closing the socket port with server.destroy() only after confirmation question.
          // See https://github.com/alexa/ask-cli/issues/476
          server.destroy();

          if (error) {
            return callback(error);
          }

          if (!confirmSignInChoice) {
            return callback(messages.STOP_UNCONFIRMED_BROWSER_SIGNIN);
          }

          callback(null, requestQuery.code);
        });
        return;
      }

      if (requestUrl.startsWith("/cb?error")) {
        const errorMessage = `Error: ${requestQuery.error}\nReason: ${requestQuery.error_description}`.split("\n").join(". ");
        response.end(messages.ASK_SIGN_IN_FAILURE_MESSAGE(errorMessage));
        ui.informReceivedError((error, _) => {
          // Closing the socket port with server.destroy() only after informing of error.
          // See https://github.com/alexa/ask-cli/issues/476
          server.destroy();
          response.statusCode = 403;
          callback(errorMessage);
        }, errorMessage);
      }
    }
  }

  /**
   * Factory method to facilitate substitution of other OAuth2 clients.
   * @returns LWA client object.
   * @private
   */
  _getAuthClientInstance() {
    if (this.authConfig.auth_client_type === "LWA") {
      const {clientId, clientConfirmation, authorizeHost, tokenHost, scope, state, doDebug, redirectUri} = this.authConfig;
      return new LWAAuthCodeClient({clientId, clientConfirmation, authorizeHost, tokenHost, scope, state, doDebug, redirectUri});
    }
  }
};
