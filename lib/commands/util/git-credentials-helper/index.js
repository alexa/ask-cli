const path = require('path');

const SmapiClient = require('@src/clients/smapi-client');
const { AbstractCommand } = require('@src/commands/abstract-command');
const optionModel = require('@src/commands/option-model');
const ResourcesConfig = require('@src/model/resources-config');
const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');


class GitCredentialsHelperCommand extends AbstractCommand {
    name() {
        return 'git-credentials-helper';
    }

    description() {
        return 'gets git credentials for hosted skill repository';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['profile', 'debug'];
    }

    handle(cmd, cb, remaining) {
        if (remaining && !['get', 'store', 'erase'].includes(remaining[0])) {
            const NON_GET_OPERATION_ERR = `The ask-cli git credentials helper doesn't support operation "${remaining[0]}".`;
            Messenger.getInstance().error(NON_GET_OPERATION_ERR);
            return cb(NON_GET_OPERATION_ERR);
        }
        if (remaining && (remaining[0] === 'store' || remaining[0] === 'erase')) {
            // TODO: add "erase" enhancement to clean through the entire providerchain: oskeychain, sys, local
            return cb();
        }

        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }

        const skillId = ResourcesConfig.getInstance().getSkillId(profile);
        const { repository } = ResourcesConfig.getInstance().getSkillInfraDeployState(profile);
        if (!repository) {
            const REPOSITORY_ERR_MSG = 'Failed to get the git repository from ask-cli project. '
            + 'Please verify the completeness of your skill project.';
            Messenger.getInstance().error(REPOSITORY_ERR_MSG);
            return cb(REPOSITORY_ERR_MSG);
        }

        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        smapiClient.skill.alexaHosted.getGitCredentials(skillId, repository.url, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return cb(err);
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                return cb(error);
            }
            const { repositoryCredentials } = response.body;
            const output = `username=${repositoryCredentials.username}
password=${repositoryCredentials.password}`;
            Messenger.getInstance().info(output);
            cb();
        });
    }
}

module.exports = GitCredentialsHelperCommand;
module.exports.createCommand = new GitCredentialsHelperCommand(optionModel).createCommand();
