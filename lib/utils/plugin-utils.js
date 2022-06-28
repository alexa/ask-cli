const fs = require('node:fs');
const path = require('node:path');

const Messenger = require('@src/view/messenger');

/**
 * @typedef CommandResult
 * @type {object}.
 * @property {string} name -- command name
 * @property {string} path - command executable path if any
 *
 * @typedef PluginResults
 * @type {object}.
 * @property {CommandResult[]} subCommands -- command name
 * @property {CommandResult[]} duplicateCommands - command executable path if any
 */

module.exports = {
    findPluginSubcommands: findPluginSubcommands,
    findPluginsInEnvPath: findPluginsInEnvPath,
    addCommands: addCommands,
    reportDuplicateCommands: reportDuplicateCommands
};

/**
 * Searches a directory for all subcommands (identified by naming convention 'parentCommandName-subcommandName')
 * Does not search sub-directories
 * @param {string} parentCommandName -- parent command name
 * @param {string} path -- search path
 * @param {CommandResult[]} existingCommands -- commands that have been previously identified
 * @returns {PluginResults}
 */
function findPluginSubcommands(parentCommandName, currentPath, existingCommands) {

    const subCommands = [];
    const duplicateCommands = [];

    if (fs.existsSync(currentPath)) {
        const stats = fs.lstatSync(currentPath);

        if (stats.isDirectory()) {
            const contents = fs.readdirSync(currentPath, { withFileTypes: true });

            function resolveSubCommand(entry) {
                let fullPath = path.join(currentPath, entry.name);

                if (entry.isFile() || entry.isSymbolicLink()) {
                    const fileName = path.basename(fullPath, path.extname(fullPath));
                    let [commandPrefix, commandName] = fileName.split('-');

                    if (commandPrefix &&
                        commandPrefix == parentCommandName &&
                        commandName) {

                        if (entry.isSymbolicLink()) {
                            let realPath = fs.realpathSync(fullPath);
                            let realPathStat = fs.statSync(realPath, { throwIfNoEntry: false });

                            if (!realPathStat.isFile()) {
                                return;
                            }
                        }

                        let duplicateCommand = existingCommands.find((command) => {
                            return command.name === commandName;
                        });

                        if (!duplicateCommand) {
                            subCommands.push(
                                {
                                    name: commandName,
                                    path: fullPath
                                }
                            );
                        } else {
                            duplicateCommands.push(
                                {
                                    name: commandName,
                                    path: fullPath
                                }
                            );
                        }
                    }
                }
            }

            contents.forEach(resolveSubCommand);

        } else {
            Messenger.getInstance().warn(`'${currentPath}' is not a directory`);
        }
    } else {
        Messenger.getInstance().warn(`directory '${currentPath}' could not be found`);
    }

    return {
        subCommands: subCommands,
        duplicateCommands: duplicateCommands
    };
}

/**
 * Find plugins on user env PATH
 * @param {CommandResult[]} existingCommands -- commands that have been previously identified
 * @returns {PluginResults}
 */
function findPluginsInEnvPath(existingCommands) {

    let pluginResults = {
        subCommands: [],
        duplicateCommands: []
    };

    existingCommands = existingCommands.slice();
    if (process.env.PATH) {
        let paths = process.env.PATH.split(path.delimiter);

        paths.forEach((path) => {
            let results;
            results = findPluginSubcommands('ask', path, existingCommands);

            if (results.subCommands) {
                pluginResults.subCommands = pluginResults.subCommands.concat(results.subCommands);
                existingCommands = existingCommands.concat(results.subCommands);
            }

            if (results.duplicateCommands) {
                pluginResults.duplicateCommands = pluginResults.duplicateCommands.concat(results.duplicateCommands);
            }
        });
    }

    return pluginResults;
}

/**
 *  Adds subcommands to a command
 * @param {*} commander
 * @param {CommandResult[]} subCommands
 */
function addCommands(commander, subCommands) {
    if (subCommands) {
        subCommands.forEach((subCommand) => {
            Messenger.getInstance().info(`Found plugin: ${subCommand.name} plugin, location: ${subCommand.path}`);
            commander.command(subCommand.name, `${subCommand.name} (plugin)`, { executableFile: `${subCommand.path}` });
        });
    }
}

/**
 * Outputs warning of duplcate commands
 * @param {*} commander
 * @param {CommandResult[]} coreCommands
 * @param {CommandResult[]} duplicateCommands
 *
 */
function reportDuplicateCommands(coreCommands, subCommands, duplicateCommands) {
    if (duplicateCommands) {
        duplicateCommands.forEach((duplicateCommand) => {
            let found = coreCommands.find(command => command.name === duplicateCommand.name);

            if (found) { // look in core commands first
                Messenger.getInstance().info(`${duplicateCommand.path} is overshadowed by a core command wth the same name: ${found.name}`);
            } else {
                found = subCommands.find(command => command.name === duplicateCommand.name);
                Messenger.getInstance().info(`${duplicateCommand.path} is overshadowed by a plugin with the same name: ${found.path}`);
            }
        });
    }
}