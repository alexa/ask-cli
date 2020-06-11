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
        return 'Get the task definition details specified by the taskName and version.';
    }

    requiredOptions() {
        return ['skill-id', 'task-name', 'task-version'];
    }

    optionalOptions() {
        return ['profile', 'debug'];
    }

    handle(cmd, cb) {
        const { skillId, taskName, taskVersion, profile, debug } = cmd;
        const smapiClient = new SmapiClient({
            profile: profileHelper.runtimeProfile(profile),
            doDebug: debug
        });
        smapiClient.task.getTask(skillId, taskName, taskVersion, (err, result) => {
            if (err || result.statusCode >= 400) {
                const error = err || jsonView.toString(result.body);
                Messenger.getInstance().error(error);
                cb(error);
            } else {
                const res = jsonView.toString(JSON.parse(result.body.definition));
                Messenger.getInstance().info(res);
                cb(null, res);
            }
        });
    }
}

module.exports = GetTaskCommand;
module.exports.createCommand = new GetTaskCommand(optionModel).createCommand();
