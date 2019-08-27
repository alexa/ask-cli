const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class GetAccountLinkingCommand extends AbstractCommand {
    name() {
        return 'get-account-linking';
    }

    description() {
        return 'get account linking configuration for a skill';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['stage', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }

        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        smapiClient.skill.accountLinking.getAccountLinking(cmd.skillId, stage, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                return cb(error);
            }

            Messenger.getInstance().info(jsonView.toString(response.body));
            cb();
        });
    }
}

module.exports = {
    createCommand: new GetAccountLinkingCommand(optionModel).createCommand()
};
