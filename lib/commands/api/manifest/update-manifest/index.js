const fs = require('fs');

const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class UpdateManifestCommand extends AbstractCommand {
    name() {
        return 'update-manifest';
    }

    description() {
        return 'update the skill manifest given skill-id';
    }

    requiredOptions() {
        return ['skill-id', 'file'];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'etag', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile, manifestFile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            manifestFile = JSON.parse(fs.readFileSync(cmd.file, 'utf-8'));
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;

        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        smapiClient.skill.manifest.updateManifest(cmd.skillId, stage, manifestFile, cmd.etag, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                cb(error);
            } else {
                Messenger.getInstance().info('Update manifest request submitted successfully.');
                cb();
            }
        });
    }
}

module.exports = {
    createCommand: new UpdateManifestCommand(optionModel).createCommand()
};
