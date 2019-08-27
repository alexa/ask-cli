const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const jsonView = require('@src/view/json-view');

class ListBetaTestersCommand extends AbstractCommand {
    name() {
        return 'list-beta-testers';
    }

    description() {
        return 'list all associated testers with a beta test.';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['max-results', 'next-token', 'profile', 'debug'];
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

        if (cmd.maxResults || cmd.nextToken) {
            getBetsTestersList(smapiClient, cmd, (err, listResponse) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResponse));
                cb();
            });
        } else {
            traverseBetaTestersList(smapiClient, cmd, (err, listResult) => {
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

function getBetsTestersList(smapiClient, cmd, callback) {
    const queryParams = {};
    if (cmd.nextToken) {
        queryParams.nextToken = cmd.nextToken;
    }
    if (cmd.maxResults) {
        queryParams.maxResults = cmd.maxResults;
    }

    smapiClient.skill.betaTest.listBetaTesters(cmd.skillId, queryParams, (err, response) => {
        if (err) {
            return callback(err);
        }
        if (response.statusCode >= 300) {
            return callback(jsonView.toString(response.body), null);
        }
        callback(null, response.body);
    });
}

function traverseBetaTestersList(smapiClient, cmd, callback) {
    const callApiTrack = ['skill', 'betaTest', 'listBetaTesters'];
    const callArgv = [cmd.skillId];
    const responseAccessor = 'testers';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.testers
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}

module.exports = {
    createCommand: new ListBetaTestersCommand(optionModel).createCommand()
};
