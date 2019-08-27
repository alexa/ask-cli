const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');

class DisAssociateISPCommand extends AbstractCommand {
    name() {
        return 'disassociate-isp';
    }

    description() {
        return 'disassociate an in-skill product from a skill';
    }

    requiredOptions() {
        return ['isp-id', 'skill-id'];
    }

    optionalOptions() {
        return ['profile', 'debug'];
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
        smapiClient.isp.disassociateIsp(cmd.ispId, cmd.skillId, (err, response) => {
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
    createCommand: new DisAssociateISPCommand(optionModel).createCommand()
};
