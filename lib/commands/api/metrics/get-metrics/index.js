const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');

class GetMetricsCommand extends AbstractCommand {
    name() {
        return 'get-metrics';
    }

    description() {
        return 'get calculated metrics, insights, and advanced analytics reporting for skills usage.';
    }

    requiredOptions() {
        return ['skill-id', 'start-time', 'end-time', 'period', 'metric', 'stage', 'skill-type'];
    }

    optionalOptions() {
        return ['intent', 'locale', 'max-results', 'next-token', 'profile', 'debug'];
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
        smapiClient.skill.getMetrics(cmd.skillId, cmd.startTime, cmd.endTime, cmd.period, cmd.metric,
            cmd.stage, cmd.skillType, cmd.intent, cmd.locale, cmd.nextToken, cmd.maxResults, (err, response) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                if (response.statusCode >= 300) {
                    const error = jsonView.toString(response.body);
                    Messenger.getInstance().error(error);
                    cb(error);
                } else {
                    Messenger.getInstance().info(jsonView.toString(response.body));
                    cb();
                }
            });
    }
}

module.exports = {
    createCommand: new GetMetricsCommand(optionModel).createCommand()
};
