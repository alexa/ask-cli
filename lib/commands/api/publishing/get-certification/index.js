const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const profileHelper = require('@src/utils/profile-helper');

class GetCertificationCommand extends AbstractCommand {
    name() {
        return 'get-certification';
    }

    description() {
        return 'get certification by certification-id for a skill';
    }

    requiredOptions() {
        return ['skill-id', 'certification-id'];
    }

    optionalOptions() {
        return ['accept-language', 'profile', 'debug'];
    }

    handle(cmd, cb) {
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

        smapiClient.skill.publishing.getCertification(cmd.skillId, cmd.certificationId, cmd.acceptLanguage, (err, response) => {
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
    createCommand: new GetCertificationCommand(optionModel).createCommand()
};
