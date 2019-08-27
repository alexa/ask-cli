const fs = require('fs');

const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class UpdateISPCommand extends AbstractCommand {
    name() {
        return 'update-isp';
    }

    description() {
        return 'update an in-skill product, only development stage supported';
    }

    requiredOptions() {
        return ['isp-id', 'file'];
    }

    optionalOptions() {
        return ['profile', 'stageWithoutCert', 'etag', 'debug'];
    }

    handle(cmd, cb) {
        let profile, ispDefinition;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            ispDefinition = JSON.parse(fs.readFileSync(cmd.file, 'utf-8'));
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
        smapiClient.isp.updateIsp(cmd.ispId, stage, ispDefinition, cmd.etag, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                return cb(error);
            }

            Messenger.getInstance().info(`Succeeded to update in-skill product ${cmd.ispId}`);
            cb();
        });
    }
}

module.exports = {
    createCommand: new UpdateISPCommand(optionModel).createCommand()
};
