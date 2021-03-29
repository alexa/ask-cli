const path = require('path');

const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const compiler = require('@src/alexa-ask-compiler/dist');
const CONSTANTS = require('@src/utils/constants');
const CliError = require('@src/exceptions/cli-error');
const CliFileNotFoundError = require('@src/exceptions/cli-file-not-found-error');
const CliWarn = require('@src/exceptions/cli-warn');
const profileHelper = require('@src/utils/profile-helper');

/**
 * ASK Project decompile command.
 * Deompiles the project into acdl files.
 * Current scope: Alexa Conversations artifacts.
 */
class DecompileCommand extends AbstractCommand {
    name() {
        return 'decompile';
    }

    description() {
        return 'decompile the skill-package (alexa conversations only).';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['profile'];
    }

    handle(cmd, cb) {
        try {
            const askCompiler = new compiler.Decompiler();
            const profile = profileHelper.runtimeProfile(cmd.profile);

            // Skill package source path
            const skillPackageRootPath = path.join(
                process.cwd(),
                CONSTANTS.DECOMPILER.ROOTDIR
            );

            // Decompiler's output path within Skill Package
            const decompilerOutputPath = path.join(
                skillPackageRootPath,
                CONSTANTS.DECOMPILER.SKILL_PACKAGE.OUTDIR
            );

            askCompiler
                .decompile({
                    rootDir: skillPackageRootPath,
                    outDir: decompilerOutputPath,
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

module.exports = DecompileCommand;
module.exports.createCommand = new DecompileCommand(optionModel).createCommand();
