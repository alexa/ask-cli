const semver = require('semver');

const httpClient = require('@src/clients/http-client');
const {
    validateRequiredOption,
    validateOptionString,
    validateOptionRules,
} = require('@src/commands/option-validator');
const AppConfig = require('@src/model/app-config');
const CONSTANTS = require('@src/utils/constants');
const Messenger = require('@src/view/messenger');
const metricClient = require('@src/utils/metrics');

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
        // the result commander's parse, args, contains a Commander object (args[0]), and an array of unrecognized user inputs (args[1])
        commander.action((...args) => new Promise((resolve) => {
            const commandInstance = args[0];
            const remaining = args[1];

            // set Messenger debug preferrance
            Messenger.getInstance().doDebug = commandInstance.debug;

            // Start metric client
            metricClient.startAction(commandInstance._name, '');
            const isCredentialHelperCmd = commandInstance._name === 'git-credentials-helper';

            // Check if a new CLI version is released
            this._remindsIfNewVersion(commandInstance.debug, isCredentialHelperCmd || process.env.ASK_SKIP_NEW_VERSION_REMINDER, () => {
                try {
                    this._validateOptions(commandInstance);

                    /**
                     * Since this code is ran for every command, we'll just be initiating appConfig here (no files created).
                     * Only `ask configure` command should have the eligibility to create the ASK config file (which is handled
                     * in the configure workflow).
                     */
                    if (commandInstance._name !== 'configure') {
                        new AppConfig();
                    }
                } catch (err) {
                    Messenger.getInstance().error(err);
                    resolve();
                    this.exit(1);
                    return;
                }
                // execute handler logic of each command; quit execution
                this.handle(commandInstance, (error) => {
                    metricClient.sendData(error).then(() => {
                        resolve();
                        this.exit(error ? 1 : 0);
                    });
                }, remaining);
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
            `${required ? '[REQUIRED]' : '[OPTIONAL]'} ${optionModel.description}`
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

    _remindsIfNewVersion(doDebug, skip, callback) {
        if (skip) return callback();

        httpClient.request({
            url: `${CONSTANTS.NPM_REGISTRY_URL_BASE}/${CONSTANTS.APPLICATION_NAME}/latest`,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET
        }, 'GET_NPM_REGISTRY', doDebug, (err, response) => {
            if (err || response.statusCode > 300) {
                const error = err || `Http Status Code: ${response.statusCode}.`;
                Messenger.getInstance().error(`Failed to get the latest version for ${CONSTANTS.APPLICATION_NAME} from NPM registry.\n${error}\n`);
            } else {
                const latestVersion = JSON.parse(response.body).version;
                if (packageJson.version !== latestVersion) {
                    if (semver.major(packageJson.version) < semver.major(latestVersion)) {
                        Messenger.getInstance().warn(`\
New MAJOR version (v${latestVersion}) of ${CONSTANTS.APPLICATION_NAME} is available now. Current version v${packageJson.version}.
It is recommended to use the latest version. Please update using "npm upgrade -g ${CONSTANTS.APPLICATION_NAME}".
\n`);
                    } else if (
                        semver.major(packageJson.version) === semver.major(latestVersion)
                        && semver.minor(packageJson.version) < semver.minor(latestVersion)
                    ) {
                        Messenger.getInstance().warn(`\
New MINOR version (v${latestVersion}) of ${CONSTANTS.APPLICATION_NAME} is available now. Current version v${packageJson.version}.
It is recommended to use the latest version. Please update using "npm upgrade -g ${CONSTANTS.APPLICATION_NAME}".
\n`);
                    }
                }
            }
            callback();
        });
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
