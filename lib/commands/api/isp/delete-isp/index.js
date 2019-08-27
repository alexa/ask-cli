const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class DeleteISPCommand extends AbstractCommand {
    name() {
        return 'delete-isp';
    }

    description() {
        return 'delete an in-skill product, only development stage is supported';
    }

    requiredOptions() {
        return ['isp-id'];
    }

    optionalOptions() {
        return ['profile', 'stageWithoutCert', 'etag', 'debug'];
    }

    handle(cmd, cb) {
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        if (cmd.stage && cmd.stage !== CONSTANTS.SKILL.STAGE.DEVELOPMENT) {
            const errorMessage = 'Only supported value for stage option is development.';
            Messenger.getInstance().error(errorMessage);
            return cb(errorMessage);
        }
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        smapiClient.isp.deleteIsp(cmd.ispId, stage, cmd.etag, (err, response) => {
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
    createCommand: new DeleteISPCommand(optionModel).createCommand()
};
