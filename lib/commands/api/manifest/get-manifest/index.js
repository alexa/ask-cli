const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');

class GetManifestCommand extends AbstractCommand {
    name() {
        return 'get-manifest';
    }

    description() {
        return 'get the skill manifest given skill-id';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
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
        smapiClient.skill.manifest.getManifest(cmd.skillId, stage, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode === 303) {
                _handleSeeOtherResponse(response, smapiClient, (error) => {
                    cb(error);
                });
            } else {
                if (response.statusCode >= 300) {
                    const error = jsonView.toString(response.body);
                    Messenger.getInstance().error(error);
                    cb(error);
                } else {
                    Messenger.getInstance().info(jsonView.toString(response.body));
                    cb();
                }
            }
        });
    }
}

function _handleSeeOtherResponse(response, smapiClient, cb) {
    if (!response.body.location) {
        const error = 'The redirect url from get-skill response is empty. Please try run this command with --debug for more details.';
        Messenger.getInstance().error(error);
        return cb(error);
    }
    smapiClient.smapiRedirectRequestWithUrl(response.body.location, (error, redirectResponse) => {
        if (error) {
            Messenger.getInstance().error(error);
            return cb(error);
        }
        if (redirectResponse.statusCode >= 300) {
            const redirectError = jsonView.toString(redirectResponse.body);
            Messenger.getInstance().error(redirectError);
            cb(redirectError);
        } else {
            Messenger.getInstance().info(jsonView.toString(redirectResponse.body));
            cb();
        }
    });
}

module.exports = {
    createCommand: new GetManifestCommand(optionModel).createCommand()
};
