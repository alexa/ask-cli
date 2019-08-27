const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const profileHelper = require('@src/utils/profile-helper');
const helper = require('./helper');

class WithdrawSkillCommand extends AbstractCommand {
    name() {
        return 'withdraw';
    }

    description() {
        return 'withdraw a skill from the certification process';
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

        helper.collectWithdrawPayload((reason, message) => {
            const smapiClient = new SmapiClient({
                profile,
                doDebug: cmd.debug
            });

            smapiClient.skill.publishing.withdrawSkill(cmd.skillId, reason, message, (err, response) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                if (response.statusCode >= 300) {
                    const error = jsonView.toString(response.body);
                    Messenger.getInstance().error(error);
                    cb(error);
                } else {
                    Messenger.getInstance().info('Skill withdrawn successfully.');
                    cb();
                }
            });
        });
    }
}

module.exports = {
    createCommand: new WithdrawSkillCommand(optionModel).createCommand()
};
