const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class ListSkillsForISPCommand extends AbstractCommand {
    name() {
        return 'list-skills-for-isp';
    }

    description() {
        return 'list skills that are associated with an in-skill product.';
    }

    requiredOptions() {
        return ['isp-id', 'stageWithoutCert'];
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
            getSkillList(smapiClient, cmd, stage, (err, listResponse) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResponse));
                cb();
            });
        } else {
            traverseSkillList(smapiClient, cmd.ispId, stage, (err, listResult) => {
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

function getSkillList(smapiClient, cmd, stage, callback) {
    const queryParams = {};
    if (cmd.nextToken) {
        queryParams.nextToken = cmd.nextToken;
    }
    if (cmd.maxResults) {
        queryParams.maxResults = cmd.maxResults;
    }
    smapiClient.isp.listSkillsForIsp(cmd.ispId, stage, queryParams, (err, response) => {
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

function traverseSkillList(smapiClient, ispId, stage, callback) {
    const callApiTrack = ['isp', 'listSkillsForIsp'];
    const callArgv = [ispId, stage];
    const responseAccessor = 'associatedSkillIds';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.associatedSkillIds
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}

module.exports = {
    createCommand: new ListSkillsForISPCommand(optionModel).createCommand()
};
