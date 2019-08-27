const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');

class ListVendorsCommand extends AbstractCommand {
    name() {
        return 'list-vendors';
    }

    description() {
        return 'get the vendor ID(s) associated with your developer account';
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
        smapiClient.vendor.listVendors((err, response) => {
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
    createCommand: new ListVendorsCommand(optionModel).createCommand()
};
