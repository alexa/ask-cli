const R = require('ramda');

const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const Messenger = require('@src/view/messenger');

const helper = require('./helper');
const ui = require('./ui');

class AddLocalesCommand extends AbstractCommand {
    name() {
        return 'add-locales';
    }

    description() {
        return 'add new locale(s) from existing locale or from the template';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            helper.initiateModels(profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        ui.selectLocales(R.keys(CONSTANTS.ALEXA.LANGUAGES), (selectErr, selectedLocales) => {
            if (selectErr) {
                Messenger.getInstance().error(selectErr);
                return cb(selectErr);
            }
            helper.addLocales(selectedLocales, profile, cmd.debug, (addErr, iModelSourceByLocales) => {
                if (addErr) {
                    Messenger.getInstance().error(addErr);
                    return cb(addErr);
                }
                ui.displayAddLocalesResult(selectedLocales, iModelSourceByLocales);
                cb();
            });
        });
    }
}

module.exports = AddLocalesCommand;
module.exports.createCommand = new AddLocalesCommand(optionModel).createCommand();
