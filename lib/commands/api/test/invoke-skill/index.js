const fs = require('fs');
const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class InvokeSkillCommand extends AbstractCommand {
    name() {
        return 'invoke-skill';
    }

    description() {
        return 'Invokes the specified skill. Before this command can be used, the skill must first be enabled.';
    }

    requiredOptions() {
        return ['skill-id', 'endpoint-region'];
    }

    optionalOptions() {
        return ['profile', 'debug', 'stageWithoutCert', 'file', 'json'];
    }

    additionalOptionsValidations(cmd) {
        if (!cmd.file && !cmd.json) {
            throw new Error('Please input required parameter: file | json.');
        }
        if (cmd.file && cmd.json) {
            throw new Error('Both file and text parameters are specified. Please enter file | json.');
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

        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        const requestPayload = cmd.file ? JSON.stringify(JSON.parse(fs.readFileSync(cmd.file, 'utf-8'))) : cmd.json;

        smapiClient.skill.test.invokeSkill(cmd.skillId, stage, requestPayload, cmd.endpointRegion, (err, response) => {
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
            return cb();
        });
    }
}

module.exports = {
    createCommand: new InvokeSkillCommand(optionModel).createCommand()
};
