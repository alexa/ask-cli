const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');

class CreateCatalogCommand extends AbstractCommand {
    name() {
        return 'create-catalog';
    }

    description() {
        return 'create a catalog';
    }

    requiredOptions() {
        return ['catalog-type', 'catalog-title', 'catalog-usage'];
    }

    optionalOptions() {
        return ['profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile, vendorId;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            vendorId = profileHelper.resolveVendorId(profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });

        smapiClient.catalog.createCatalog(cmd.catalogTitle, cmd.catalogType, cmd.catalogUsage, vendorId, (err, response) => {
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
    createCommand: new CreateCatalogCommand(optionModel).createCommand()
};
