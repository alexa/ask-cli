const path = require('path');

const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const compiler = require('@src/alexa-ask-compiler/dist');
const ResourcesConfig = require('@src/model/resources-config');
const CONSTANTS = require('@src/utils/constants');
const CliError = require('@src/exceptions/cli-error');
const CliFileNotFoundError = require('@src/exceptions/cli-file-not-found-error');
const CliWarn = require('@src/exceptions/cli-warn');
const profileHelper = require('@src/utils/profile-helper');

/**
 * ASK Project compile command.
 * Compiles the project into raw artifacts.
 * Current scope: Alexa Conversations artifacts.
 */
class CompileCommand extends AbstractCommand {
    name() {
        return 'compile';
    }

    description() {
        return 'compile the skill-package (alexa conversations only).';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['profile'];
    }

    handle(cmd, cb) {
        try {
            const askCompiler = new compiler.Compiler();
            const profile = profileHelper.runtimeProfile(cmd.profile);

            if (!ResourcesConfig.getInstance()) {
                new ResourcesConfig(
                    path.join(
                        process.cwd(),
                        CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG
                    )
                );
            }

            // Skill package source path
            const skillPackageRootPath = path.join(
                process.cwd(),
                CONSTANTS.COMPILER.ROOTDIR
            );

            // Compiler's output path within Skill Package
            const compilerOutputPath = path.join(
                skillPackageRootPath,
                CONSTANTS.COMPILER.SKILL_PACKAGE.OUTDIR
            );

            askCompiler
                .compile({
                    rootDir: skillPackageRootPath,
                    outDir: compilerOutputPath,
                })
                .then((output) => {
                    cb();
                });
        } catch (err) {
            if (err instanceof CliWarn) {
                Messenger.getInstance().warn(err.message);
            } else if (err instanceof CliFileNotFoundError) {
                Messenger.getInstance().warn(err.message);
            } else if (err instanceof CliError) {
                Messenger.getInstance().error(err.message);
            } else {
                Messenger.getInstance().error(err);
            }
            return cb(err);
        }
    }
}

module.exports = CompileCommand;
module.exports.createCommand = new CompileCommand(optionModel).createCommand();
