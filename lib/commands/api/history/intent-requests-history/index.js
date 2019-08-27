const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const helper = require('./helper');

class BuildIntentRequestsHistory extends AbstractCommand {
    name() {
        return 'intent-requests-history';
    }

    description() {
        return 'get utterance transcripts for a skill';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['filters', 'max-results', 'sort-direction', 'sort-field', 'next-token', 'profile', 'debug'];
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

        if (cmd.maxResults || cmd.nextToken || cmd.sortDirection || cmd.sortField || cmd.filters) {
            helper.getIntentRequestsHistoryList(smapiClient, cmd, (err, listResponse) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResponse));
                cb();
            });
        } else {
            helper.traverseIntentRequestsHistoryList(smapiClient, cmd, (err, listResult) => {
                if (err) {
                    Messenger.getInstance().error(jsonView.toString(err));
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResult));
                cb();
            });
        }
    }
}

module.exports = {
    createCommand: new BuildIntentRequestsHistory(optionModel).createCommand()
};
