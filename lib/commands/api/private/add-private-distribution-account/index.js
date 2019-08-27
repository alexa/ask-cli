const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class AddPrivateDistributionAccountCommand extends AbstractCommand {
    name() {
        return 'add-private-distribution-account';
    }

    description() {
        return 'adds an account to the private distribution list for a specified skill.';
    }

    requiredOptions() {
        return ['skill-id', 'account-id'];
    }

    optionalOptions() {
        return ['stage', 'profile', 'debug'];
    }

    additionalOptionsValidations(cmd) {
        if (cmd.stage && cmd.stage !== CONSTANTS.SKILL.STAGE.LIVE) {
            throw new Error('Only supported value for stage option is live.');
        }
    }

    handle(cmd, cb) {
        let profile;
        try {
            this.additionalOptionsValidations(cmd);
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        cmd.stage = cmd.stage || CONSTANTS.SKILL.STAGE.LIVE;
        smapiClient.skill.privateSkill.addPrivateDistributionAccount(cmd.skillId, cmd.stage, cmd.accountId, (err, response) => {
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
    createCommand: new AddPrivateDistributionAccountCommand(optionModel).createCommand()
};
