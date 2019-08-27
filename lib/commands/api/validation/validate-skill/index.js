const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');
const helper = require('./helper');

class ValidateSkillCommand extends AbstractCommand {
    name() {
        return 'validate-skill';
    }

    description() {
        return 'validate a skill';
    }

    requiredOptions() {
        return ['skill-id'];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'locales', 'quick', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        const locales = cmd.locales || process.env.ASK_DEFAULT_DEVICE_LOCALE;

        if (!stringUtils.isNonBlankString(locales)) {
            const err = new Error(
                'Please provide valid input for option: locales. Specify locale via '
                + 'command line parameter <-l|--locales> or environment variable ASK_DEFAULT_DEVICE_LOCALE.'
            );
            Messenger.getInstance().error(err);
            return cb(err);
        }

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
        smapiClient.skill.validateSkill(cmd.skillId, stage, locales, (err, response) => {
            const quickMode = cmd.quick;
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                cb(error);
            } else {
                const responseBody = response.body;
                if (responseBody) {
                    const validationId = responseBody.id;
                    Messenger.getInstance().info(`Validation created for validation id: ${validationId}`);
                    if (quickMode) {
                        Messenger.getInstance().info('Please use the ask api get-validation command to get the status of the validation');
                        return cb();
                    }
                    helper.pollingSkillValidationResult(smapiClient, cmd.skillId, validationId, stage, (pollError, pollResponse) => {
                        if (pollError) {
                            Messenger.getInstance().error(pollError);
                            return cb(pollError);
                        }
                        Messenger.getInstance().info(pollResponse);
                        return cb();
                    });
                } else {
                    const error = new Error('No response body from service request.');
                    Messenger.getInstance().error(error);
                    return cb(error);
                }
                return cb();
            }
        });
    }
}

module.exports = {
    createCommand: new ValidateSkillCommand(optionModel).createCommand()
};
