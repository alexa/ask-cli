const { AbstractCommand } = require('@src/commands/abstract-command');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const SmapiClient = require('@src/clients/smapi-client');
const stringUtils = require('@src/utils/string-utils');

class SearchTaskCommand extends AbstractCommand {
    name() {
        return 'search-task';
    }

    description() {
        return 'search for task definitions';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['keywords', 'provider-skill-id', 'max-results', 'next-token', 'profile', 'debug'];
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
        const keywords = cmd.keywords ? stringUtils
            .splitStringFilterAndMapTo(cmd.keywords, ',', null, keyword => keyword.trim().replace(/\s/g, '%20')).toString() : cmd.keywords;

        if (cmd.maxResults || cmd.nextToken) {
            getTaskSummaryList(smapiClient, cmd.skillId, keywords, cmd.providerSkillId, cmd, (err, listResult) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResult));
                cb();
            });
        } else {
            traverseTaskSummaryList(smapiClient, cmd.skillId, keywords, cmd.providerSkillId, (err, listResult) => {
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

function getTaskSummaryList(smapiClient, skillId, keywords, providerSkillId, cmd, callback) {
    const queryParams = {};
    if (cmd.nextToken) {
        queryParams.nextToken = cmd.nextToken;
    }
    if (cmd.maxResults) {
        queryParams.maxResults = cmd.maxResults;
    }
    smapiClient.task.searchTask(skillId, keywords, providerSkillId, queryParams, (err, response) => {
        if (err) {
            return callback(err);
        }
        if (response.statusCode >= 300) {
            return callback(jsonView.toString(response.body), null);
        }
        callback(null, response.body);
    });
}


function traverseTaskSummaryList(smapiClient, skillId, keywords, providerSkillId, callback) {
    const callApiTrack = ['task', 'searchTask'];
    const callArgv = [skillId, keywords, providerSkillId];
    const responseAccessor = 'taskSummaryList';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.taskSummaryList
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}

module.exports = {
    createCommand: new SearchTaskCommand(optionModel).createCommand()
};
