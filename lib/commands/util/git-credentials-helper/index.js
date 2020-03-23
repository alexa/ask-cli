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

    handle(cmd) {
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
        } catch (err) {
            Messenger.getInstance().error(err);
            return;
        }

        const skillId = ResourcesConfig.getInstance().getSkillId(profile);
        const { repository } = ResourcesConfig.getInstance().getSkillInfraDeployState(profile);
        if (!repository) {
            Messenger.getInstance().error('Failed to get the git repository from ask-cli project. '
            + 'Please verify the completeness of your skill project.');
            return;
        }

        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        // TODO: to use git-credential-cache - Helper to temporarily store passwords in memory
        smapiClient.skill.alexaHosted.getGitCredentials(skillId, repository.url, (err, response) => {
            if (err) {
                Messenger.getInstance().error(err);
                return;
            }
            if (response.statusCode >= 300) {
                const error = jsonView.toString(response.body);
                Messenger.getInstance().error(error);
                return;
            }
            const { repositoryCredentials } = response.body;
            const output = `username=${repositoryCredentials.username}
password=${repositoryCredentials.password}`;
            Messenger.getInstance().info(output);
        });
    }
}

module.exports = GitCredentialsHelperCommand;
module.exports.createCommand = new GitCredentialsHelperCommand(optionModel).createCommand();
