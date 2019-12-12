const { AbstractCommand } = require('@src/commands/abstract-command');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const SmapiClient = require('@src/clients/smapi-client');

class GetTaskCommand extends AbstractCommand {
    name() {
        return 'get-task';
    }

    description() {
        return 'get details of a task definition';
    }

    requiredOptions() {
        return ['skill-id', 'task-name', 'task-version'];
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

        smapiClient.task.getTask(cmd.skillId, cmd.taskName, cmd.taskVersion, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                cb(error);
            } else {
                Messenger.getInstance().info(jsonView.toString(JSON.parse(response.body.definition)));
                cb();
            }
        });
    }
}

module.exports = {
    createCommand: new GetTaskCommand(optionModel).createCommand()
};
