const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

const helper = require('./helper');

class SetAccountLinkingCommand extends AbstractCommand {
    name() {
        return 'set-account-linking';
    }

    description() {
        return 'create/update the account linking configuration for the given skill';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'file', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;

        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        helper.prepareAccountLinkingPayload(smapiClient, cmd.skillId, stage, cmd.file, (prepareErr, accountLinkingInfo) => {
            if (prepareErr) {
                Messenger.getInstance().error(prepareErr);
                return cb(prepareErr);
            }
            smapiClient.skill.accountLinking.setAccountLinking(cmd.skillId, stage, accountLinkingInfo, (setErr, response) => {
                if (setErr) {
                    Messenger.getInstance().error(setErr);
                    return cb(setErr);
                }
                if (response.statusCode >= 300) {
                    const error = jsonView.toString(response.body);
                    Messenger.getInstance().error(error);
                    cb(error);
                } else {
                    Messenger.getInstance().info(jsonView.toString(response.body));
                    cb();
                }
            });
        });
    }
}

module.exports = {
    createCommand: new SetAccountLinkingCommand(optionModel).createCommand()
};
