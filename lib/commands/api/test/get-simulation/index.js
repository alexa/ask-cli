const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class GetSimulationCommand extends AbstractCommand {
    name() {
        return 'get-simulation';
    }

    description() {
        return 'Each time the simulate-skill command is run, a simulation ID results.';
    }

    requiredOptions() {
        return ['simulation-id', 'skill-id'];
    }

    optionalOptions() {
        return ['profile', 'stageWithoutCert', 'debug'];
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

        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        smapiClient.skill.test.getSimulation(cmd.skillId, cmd.simulationId, stage, (err, response) => {
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
    createCommand: new GetSimulationCommand(optionModel).createCommand()
};
