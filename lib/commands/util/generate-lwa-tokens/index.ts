import {OptionModel} from "../../option-validator";

import {AbstractCommand} from "../../abstract-command";
import configureUi from "../../configure/ui";
import optionModel from "../../option-model.json";
import AuthorizationController from "../../../controllers/authorization-controller";
import CONSTANTS from "../../../utils/constants";
import jsonView from "../../../view/json-view";
import Messenger from "../../../view/messenger";

export default class GenerateLwaTokensCommand extends AbstractCommand {
  name() {
    return "generate-lwa-tokens";
  }

  description() {
    return "generate Login with Amazon tokens from any LWA client";
  }

  requiredOptions() {
    return [];
  }

  optionalOptions() {
    return ["client-id", "client-confirmation", "scopes", "no-browser", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    const authConfig = {
      auth_client_type: "LWA",
      clientId: cmd.clientId,
      clientConfirmation: cmd.clientConfirmation,
      scope: cmd.scopes || CONSTANTS.LWA.DEFAULT_PUBLIC_SCOPES,
      doDebug: cmd.debug,
    }; // redirect_url must be pre-set depending on the CLI mode and with the trusted domain

    if (cmd.browser === false) {
      const lwaController = new AuthorizationController({...authConfig, redirectUri: CONSTANTS.LWA.S3_RESPONSE_PARSER_URL});
      const authorizeUrl = lwaController.getAuthorizeUrl();
      Messenger.getInstance().info(`Paste the following url to your browser:\n    ${authorizeUrl}`);
      return new Promise((resolve, reject) => {
        configureUi.getAuthCode((uiErr: any, authCode: string) => {
          if (uiErr) {
            Messenger.getInstance().error(uiErr);
            return reject(uiErr);
          }
          lwaController.getAccessTokenUsingAuthCode(authCode, (getTokenErr: any, accessToken: string) => {
            if (getTokenErr) {
              Messenger.getInstance().error(getTokenErr);
              return reject(getTokenErr);
            }
            Messenger.getInstance().info("\nThe LWA tokens result:");
            Messenger.getInstance().info(jsonView.toString(accessToken));
            return resolve();
          });
        });
      });
    } else {
      const lwaController = new AuthorizationController({...authConfig, redirectUri: `http://127.0.0.1:${CONSTANTS.LWA.LOCAL_PORT}/cb`});
      return new Promise((resolve, reject) => {
        lwaController.getTokensByListeningOnPort((browserGetTokenErr: any, accessToken: string) => {
          if (browserGetTokenErr) {
            Messenger.getInstance().error(browserGetTokenErr);
            return reject(browserGetTokenErr);
          }
          Messenger.getInstance().info("The LWA tokens result:");
          Messenger.getInstance().info(jsonView.toString(accessToken));
          resolve();
        });
      });
    }
  }
}

export const createCommand = new GenerateLwaTokensCommand(optionModel as OptionModel).createCommand();
