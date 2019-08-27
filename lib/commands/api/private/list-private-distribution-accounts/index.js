const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class ListPrivateDistributionAccountsCommand extends AbstractCommand {
    name() {
        return 'list-private-distribution-accounts';
    }

    description() {
        return 'lists the accounts on a private distribution list for the specified skill.';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['stage', 'profile', 'debug', 'max-results', 'next-token'];
    }

    additionalOptionsValidations(cmd) {
        if (cmd.stage && cmd.stage !== CONSTANTS.SKILL.STAGE.LIVE) {
            throw new Error('Only supported value for stage option is live.');
        }
    }

    handle(cmd, cb) {
        let profile;
        try {
            this.additionalOptionsValidations(cmd);
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        cmd.stage = cmd.stage || CONSTANTS.SKILL.STAGE.LIVE;
        if (cmd.maxResults || cmd.nextToken) {
            getPrivateDistributionAccountsList(smapiClient, cmd, (err, listResponse) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResponse));
                cb();
            });
        } else {
            traversePrivateDistributionAccountsList(smapiClient, cmd, (err, listResult) => {
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

function getPrivateDistributionAccountsList(smapiClient, cmd, callback) {
    const queryParams = {
        nextToken: cmd.nextToken,
        maxResults: cmd.maxResults
    };
    smapiClient.skill.privateSkill.listPrivateDistributionAccounts(cmd.skillId, cmd.stage, queryParams, (err, response) => {
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

function traversePrivateDistributionAccountsList(smapiClient, cmd, callback) {
    const callApiTrack = ['skill', 'privateSkill', 'listPrivateDistributionAccounts'];
    const callArgv = [cmd.skillId, cmd.stage];
    const responseAccessor = 'accounts';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.accounts
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}

module.exports = {
    createCommand: new ListPrivateDistributionAccountsCommand(optionModel).createCommand()
};
