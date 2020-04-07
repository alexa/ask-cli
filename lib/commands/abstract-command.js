const os = require('os');
const path = require('path');
const semver = require('semver');

const httpClient = require('@src/clients/http-client');
const {
    validateRequiredOption,
    validateOptionString,
    validateOptionRules,
} = require('@src/commands/option-validator');
const AppConfig = require('@src/model/app-config');
const CONSTANTS = require('@src/utils/constants');
const metricClient = require('@src/utils/metrics');
const Messenger = require('@src/view/messenger');

const packageJson = require('@root/package.json');

/**
 * Base class for ASK CLI command that provides option parsing, commander configuration and option validation at runtime.
 */
class AbstractCommand {
    constructor(optionModel) {
        // eslint-disable-next-line global-require
        this._optionModel = optionModel || require('@src/commands/option-model');
    }

    name() {
        throw new Error('Unimplemented abstract function: name()!');
    }

    description() {
        throw new Error('Unimplemented abstract function: description()!');
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return [];
    }

    handle() {}

    exit(statusCode) {
        Messenger.getInstance().dispose();
        process.exit(statusCode || 0);
    }

    createCommand() {
        new Messenger({});
        return (commander) => {
            try {
                // register command name and description
                const commanderCopy = commander
                    .command(this.name())
                    .description(this.description());

                // register command options
                this._registerOptions(commanderCopy);

                // register command action
                this._registerAction(commanderCopy);
            } catch (err) {
                Messenger.getInstance().fatal(err);
                this.exit(1);
            }
        };
    }

    _registerAction(commander) {
        commander.action((...args) => new Promise((resolve) => {
            // set Messenger debug preferrance
            Messenger.getInstance().doDebug = args[0].debug;

            /**
             * Start metric client
             */
            metricClient.startAction(args[0]._name, 'command');

            /**
             * Check if a new CLI version is released
             */
            this._remindsIfNewVersion(args[0].debug, () => {
                try {
                    this._validateOptions(args[0]);

                    /**
                     * Since this code is ran for every command, we'll just be initiating appConfig here (no files created).
                     * Only `ask configure` command should have the eligibility to create the ASK config file (which is handled
                     * in the configure workflow).
                     */
                    if (args[0]._name !== 'configure') {
                        this._initiateAppConfig();
                    }
                } catch (err) {
                    Messenger.getInstance().error(err);
                    resolve();
                    this.exit(1);
                    return;
                }
                // execute handler logic of each command; quit execution
                this.handle(...args, (error) => {
                    metricClient.sendData(error).then(() => {
                        resolve();
                        this.exit(error ? 1 : 0);
                    });
                });
            });
        }));
    }

    _registerOptions(commander) {
        const requiredOptions = this.requiredOptions();
        if (requiredOptions && requiredOptions.length) {
            for (const optionId of requiredOptions) {
                commander = this._registerOption(commander, optionId, true);
            }
        }

        const optionalOptions = this.optionalOptions();
        if (optionalOptions && optionalOptions.length) {
            for (const optionId of optionalOptions) {
                commander = this._registerOption(commander, optionId, false);
            }
        }

        return commander;
    }

    _registerOption(commander, optionId, required) {
        const optionModel = this._optionModel[optionId];

        // Check if given option name has a model defined. Refer to option-model.json for all available option models
        if (!optionModel) {
            throw new Error(`Unrecognized option ID: ${optionId}`);
        }

        return commander.option(
            AbstractCommand.buildOptionString(optionModel),
            `${required ? '[Required]' : '[Optional]'} ${optionModel.description}`
        );
    }

    _validateOptions(cmd) {
        const requiredOptions = this.requiredOptions();
        if (requiredOptions && requiredOptions.length) {
            for (const optionId of requiredOptions) {
                this._validateOption(cmd, optionId, true);
            }
        }

        const optionalOptions = this.optionalOptions();
        if (optionalOptions && optionalOptions.length) {
            for (const optionId of optionalOptions) {
                this._validateOption(cmd, optionId, false);
            }
        }
    }

    _validateOption(cmd, optionId, required) {
        const optionModel = this._optionModel[optionId];
        const optionKey = AbstractCommand.parseOptionKey(optionModel.name);
        try {
            if (required) {
                validateRequiredOption(cmd, optionKey);
            }

            if (cmd[optionKey]) {
                // Validate string value for options that require string input
                if (optionModel.stringInput === 'REQUIRED') {
                    validateOptionString(cmd, optionKey);
                }

                validateOptionRules(cmd, optionKey, optionModel.rule);
            }
        } catch (err) {
            throw (`Please provide valid input for option: ${optionModel.name}. ${err}`);
        }
    }

    _remindsIfNewVersion(doDebug, callback) {
        httpClient.request({
            url: `${CONSTANTS.NPM_REGISTRY_URL_BASE}/${CONSTANTS.APPLICATION_NAME}/latest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET
        }, 'GET_NPM_REGISTRY', doDebug, (err, response) => {
            if (err) {
                Messenger.getInstance().error(`Failed to get the latest version for ${CONSTANTS.APPLICATION_NAME} from NPM registry.\n${err}\n`);
            } else {
                const latestVersion = JSON.parse(response.body).version;
                if (packageJson.version !== latestVersion) {
                    if (semver.major(packageJson.version) < semver.major(latestVersion)) {
                        Messenger.getInstance().info(`[Info]: \
New major version (v${latestVersion}) of ${CONSTANTS.APPLICATION_NAME} is available now. Current version v${packageJson.version}. Please update!\n`);
                    } else if (
                        semver.major(packageJson.version) === semver.major(latestVersion)
                        && semver.minor(packageJson.version) < semver.minor(latestVersion)
                    ) {
                        Messenger.getInstance().info(`[Info]: \
New minor version (v${latestVersion}) of ${CONSTANTS.APPLICATION_NAME} is available now. Current version v${packageJson.version}.\n`);
                    }
                }
            }
            callback();
        });
    }

    _initiateAppConfig() {
        const configFilePath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER, CONSTANTS.FILE_PATH.ASK.PROFILE_FILE);
        new AppConfig(configFilePath);
    }

    /**
     * Build the usage string for an option
     * @param {Object} optionModel
     */
    static buildOptionString(optionModel) {
        const optionStringArray = [];

        if (optionModel.alias) {
            optionStringArray.push(`-${optionModel.alias},`);
        }

        optionStringArray.push(`--${optionModel.name}`);

        if (optionModel.stringInput === 'REQUIRED') {
            optionStringArray.push(`<${optionModel.name}>`);
        } else if (optionModel.stringInput === 'OPTIONAL') {
            optionStringArray.push(`[${optionModel.name}]`);
        }

        return optionStringArray.join(' ');
    }

    /**
     * convert option name to option key
     * Example: skill-id -> skillId
     * @param name
     */
    static parseOptionKey(name) {
        const arr = name.split('-');

        return arr.slice(1).reduce((end, element) => end + element.charAt(0).toUpperCase() + element.slice(1), arr[0]);
    }
}

module.exports = {
    AbstractCommand
};
