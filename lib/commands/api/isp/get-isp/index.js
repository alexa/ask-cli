const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class GetISPCommand extends AbstractCommand {
    name() {
        return 'get-isp';
    }

    description() {
        return 'get the definition or summary for an in-skill product';
    }

    requiredOptions() {
        return ['isp-id', 'stageWithoutCert'];
    }

    optionalOptions() {
        return ['profile', 'summary', 'debug'];
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
        if (cmd.summary) {
            smapiClient.isp.getIspSummary(cmd.ispId, stage, (err, response) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                if (response.statusCode >= 300) {
                    const error = jsonView.toString(response.body);
                    Messenger.getInstance().error(error);
                    return cb(error);
                }

                Messenger.getInstance().warn(`Etag: ${response.headers.etag}`);
                Messenger.getInstance().info(jsonView.toString(response.body.inSkillProductSummary));
                return cb();
            });
        } else {
            smapiClient.isp.getIsp(cmd.ispId, stage, (err, response) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                if (response.statusCode >= 300) {
                    const error = jsonView.toString(response.body);
                    Messenger.getInstance().error(error);
                    return cb(error);
                }

                Messenger.getInstance().warn(`Etag: ${response.headers.etag}`);
                Messenger.getInstance().info(jsonView.toString(response.body.inSkillProductDefinition));
                cb();
            });
        }
    }
}

module.exports = {
    createCommand: new GetISPCommand(optionModel).createCommand()
};
