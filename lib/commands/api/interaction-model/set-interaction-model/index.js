const fs = require('fs');

const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class SetInteractionModel extends AbstractCommand {
    name() {
        return 'set-interaction-model';
    }

    description() {
        return 'create/update interaction model for skill';
    }

    requiredOptions() {
        return ['skill-id', 'locale', 'file'];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'etag', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile, modelSchema;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            modelSchema = JSON.parse(fs.readFileSync(cmd.file, 'utf-8'));
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;

        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        smapiClient.skill.interactionModel.setInteractionModel(cmd.skillId, stage, cmd.locale, modelSchema, cmd.etag, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                cb(error);
            } else {
                Messenger.getInstance().info('Interaction model request submitted successfully.');
                cb();
            }
        });
    }
}

module.exports = {
    createCommand: new SetInteractionModel(optionModel).createCommand()
};
