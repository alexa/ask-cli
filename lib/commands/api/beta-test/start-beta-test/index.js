const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const jsonView = require('@src/view/json-view');

class StartBetaTestCommand extends AbstractCommand {
    name() {
        return 'start-beta-test';
    }

    description() {
        return 'start the beta test for the specified skill ID.';
    }

    requiredOptions() {
        return ['skill-id'];
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

        smapiClient.skill.betaTest.startBetaTest(cmd.skillId, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                return cb(error);
            }
            Messenger.getInstance().info('Beta test started successfully');
            cb();
        });
    }
}

module.exports = {
    createCommand: new StartBetaTestCommand(optionModel).createCommand()
};
