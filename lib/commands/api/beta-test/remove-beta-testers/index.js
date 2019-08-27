const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const jsonView = require('@src/view/json-view');
const stringUtils = require('@src/utils/string-utils');

const fs = require('fs');

class RemoveBetaTestersCommand extends AbstractCommand {
    name() {
        return 'remove-beta-testers';
    }

    description() {
        return 'removes testers from an existing beta test.';
    }

    requiredOptions() {
        return ['skill-id', 'csvFile'];
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
        const testers = stringUtils.splitStringFilterAndMapTo(fs.readFileSync(cmd.file, 'utf-8').toString(), '\n', values => stringUtils.isNonBlankString(values), line => line.trim().split(','))
            .map(values => ({ emailId: values[0].trim() }))
            .splice(1,);

        smapiClient.skill.betaTest.removeBetaTesters(cmd.skillId, testers, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                return cb(error);
            }
            Messenger.getInstance().info('Beta testers removed successfully.');
            cb();
        });
    }
}

module.exports = {
    createCommand: new RemoveBetaTestersCommand(optionModel).createCommand()
};