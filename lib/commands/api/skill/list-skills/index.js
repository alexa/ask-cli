const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class ListSkillsCommand extends AbstractCommand {
    name() {
        return 'list-skills';
    }

    description() {
        return 'list skills for a profile';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['max-results', 'next-token', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile, vendorId;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            vendorId = profileHelper.resolveVendorId(profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }

        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        if (cmd.maxResults || cmd.nextToken) {
            getSkillList(smapiClient, cmd, vendorId, (err, listResponse) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResponse));
                cb();
            });
        } else {
            traverseSkillList(smapiClient, vendorId, (err, listResult) => {
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

function getSkillList(smapiClient, cmd, vendorId, callback) {
    const queryParams = {
        nextToken: cmd.nextToken,
        maxResults: cmd.maxResults
    };
    smapiClient.skill.listSkills(vendorId, queryParams, (err, response) => {
        if (err) {
            return callback(err);
        }
        if (response.statusCode >= 300) {
            return callback(jsonView.toString(response.body), null);
        }
        callback(null, response.body);
    });
}

function traverseSkillList(smapiClient, vendorId, callback) {
    const callApiTrack = ['skill', 'listSkills'];
    const callArgv = [vendorId];
    const responseAccessor = 'skills';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.skills
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}

module.exports = {
    createCommand: new ListSkillsCommand(optionModel).createCommand()
};
