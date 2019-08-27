const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class ListISPForSkillCommand extends AbstractCommand {
    name() {
        return 'list-isp-for-skill';
    }

    description() {
        return 'list in-skill products that are associated with a skill.';
    }

    requiredOptions() {
        return ['skill-id', 'stageWithoutCert'];
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
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        if (cmd.maxResults || cmd.nextToken) {
            getIspList(smapiClient, cmd, stage, (err, listResponse) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResponse));
                cb();
            });
        } else {
            traverseIspList(smapiClient, cmd.skillId, stage, (err, listResult) => {
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

function getIspList(smapiClient, cmd, stage, callback) {
    const queryParams = {};
    if (cmd.nextToken) {
        queryParams.nextToken = cmd.nextToken;
    }
    if (cmd.maxResults) {
        queryParams.maxResults = cmd.maxResults;
    }
    smapiClient.skill.listIspForSkill(cmd.skillId, stage, queryParams, (err, response) => {
        if (err) {
            return callback(err);
        }
        if (response.statusCode >= 300) {
            callback(jsonView.toString(response.body), null);
            return;
        }
        callback(null, response.body);
    });
}

function traverseIspList(smapiClient, skillId, stage, callback) {
    const callApiTrack = ['skill', 'listIspForSkill'];
    const callArgv = [skillId, stage];
    const responseAccessor = 'inSkillProductSummaryList';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.inSkillProductSummaryList
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}

module.exports = {
    createCommand: new ListISPForSkillCommand(optionModel).createCommand()
};
