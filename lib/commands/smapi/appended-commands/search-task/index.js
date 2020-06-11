const R = require('ramda');

const { AbstractCommand } = require('@src/commands/abstract-command');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const SmapiClient = require('@src/clients/smapi-client');

class SearchTaskCommand extends AbstractCommand {
    name() {
        return 'search-task';
    }

    description() {
        return 'List the tasks summary information based on keywords or provider skillId. '
        + 'If both keywords and provider skillId are not specified, will list all the tasks '
        + 'summary information accessible by the skillId.';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['next-token', 'max-results', 'provider-skill-id', 'keywords', 'profile', 'debug'];
    }

    static encodeSpaces(keywords) {
        return keywords ? keywords.replace(/\s/g, '%20') : keywords;
    }

    handle(cmd, cb) {
        const { skillId, providerSkillId, maxResults, nextToken, profile, debug } = cmd;
        const keywords = SearchTaskCommand.encodeSpaces(cmd.keywords);
        const queryParams = R.reject(R.isNil, { maxResults, nextToken });

        const smapiClient = new SmapiClient({
            profile: profileHelper.runtimeProfile(profile),
            doDebug: debug
        });

        smapiClient.task.searchTask(skillId, keywords, providerSkillId, queryParams, (err, result) => {
            if (err || result.statusCode >= 400) {
                const error = err || jsonView.toString(result.body);
                Messenger.getInstance().error(error);
                cb(error);
            } else {
                const res = jsonView.toString(result.body);
                Messenger.getInstance().info(res);
                cb(null, res);
            }
        });
    }
}

module.exports = SearchTaskCommand;
module.exports.createCommand = new SearchTaskCommand(optionModel).createCommand();
