const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class GetSkillEnablementCommand extends AbstractCommand {
    name() {
        return 'get-skill-enablement';
    }

    description() {
        return 'get enablement information for a skill';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
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
        smapiClient.skill.getSkillEnablement(cmd.skillId, stage, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                cb(error);
            } else {
                Messenger.getInstance().info('The skill is enabled.');
                cb();
            }
        });
    }
}

module.exports = {
    createCommand: new GetSkillEnablementCommand(optionModel).createCommand()
};
