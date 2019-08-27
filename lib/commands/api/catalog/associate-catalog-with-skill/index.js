const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');

class AssociateCatalogWithSkillCommand extends AbstractCommand {
    name() {
        return 'associate-catalog-with-skill';
    }

    description() {
        return 'associate a catalog with a skill';
    }

    requiredOptions() {
        return ['skill-id', 'catalog-id'];
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
        smapiClient.catalog.associateCatalogWithSkill(cmd.skillId, cmd.catalogId, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                cb(error);
            } else {
                Messenger.getInstance().info('Catalog associated with the skill successfully.');
                cb();
            }
        });
    }
}

module.exports = {
    createCommand: new AssociateCatalogWithSkillCommand(optionModel).createCommand()
};
