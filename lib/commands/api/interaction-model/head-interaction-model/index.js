const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class HeadInteractionModelCommand extends AbstractCommand {
    name() {
        return 'head-interaction-model';
    }

    description() {
        return 'get the eTag of the interaction model';
    }

    requiredOptions() {
        return ['skill-id', 'locale'];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'profile', 'debug'];
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
        smapiClient.skill.interactionModel.headInteractionModel(cmd.skillId, stage, cmd.locale, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
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
    }
}

module.exports = {
    createCommand: new HeadInteractionModelCommand(optionModel).createCommand()
};
