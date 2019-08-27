const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const jsonView = require('@src/view/json-view');

class CreateBetaTestCommand extends AbstractCommand {
    name() {
        return 'create-beta-test';
    }

    description() {
        return 'creates a beta test.';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['feedback-email', 'profile', 'debug'];
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

        smapiClient.skill.betaTest.createBetaTest(cmd.skillId, cmd.feedbackEmail, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                return cb(error);
            }
            Messenger.getInstance().info('Beta test created successfully');
            cb();
        });
    }
}

module.exports = {
    createCommand: new CreateBetaTestCommand(optionModel).createCommand()
};
