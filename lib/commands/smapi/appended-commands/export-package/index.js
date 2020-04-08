const fs = require('fs');
const path = require('path');
const R = require('ramda');

const { AbstractCommand } = require('@src/commands/abstract-command');
const CONSTANTS = require('@src/utils/constants');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const SmapiClient = require('@src/clients/smapi-client/index.js');
const zipUtils = require('@src/utils/zip-utils');

const helper = require('./helper.js');

class ExportPackageCommand extends AbstractCommand {
    name() {
        return 'export-package';
    }

    description() {
        return 'download the skill package to "skill-package" folder in current directory';
    }

    requiredOptions() {
        return ['skill-id', 'stage'];
    }

    optionalOptions() {
        return ['profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            // 0.check if a skill-package file exists
            if (fs.existsSync(CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE)) {
                throw new Error(`A ${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE} fold already exists in the current working directory.`);
            }
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });

        // 1.request to export skill package
        smapiClient.skillPackage.exportPackage(cmd.skillId, cmd.stage, (exportErr, exportResponse) => {
            if (exportErr) {
                Messenger.getInstance().error(exportErr);
                return cb(exportErr);
            }
            if (exportResponse.statusCode >= 300) {
                const error = jsonView.toString(exportResponse.body);
                Messenger.getInstance().error(error);
                return cb(error);
            }
            const exportId = path.basename(R.view(R.lensPath(['headers', 'location']), exportResponse));

            // 2.poll for the skill package export status
            helper.pollExportStatus(smapiClient, exportId, (pollErr, pollResponse) => {
                if (pollErr) {
                    Messenger.getInstance().error(pollErr);
                    return cb(pollErr);
                }
                // 3.download skill package into local file system
                const skillPackageLocation = R.view(R.lensPath(['body', 'skill', 'location']), pollResponse);
                const rootPath = process.cwd();
                const targetPath = path.join(rootPath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE);
                zipUtils.unzipRemoteZipFile(skillPackageLocation, targetPath, false, (unzipErr) => {
                    if (unzipErr) {
                        Messenger.getInstance().error(unzipErr);
                        return cb(unzipErr);
                    }
                    Messenger.getInstance().info(`The skill package had been downloaded into ${targetPath}.`);
                    cb();
                });
            });
        });
    }
}

module.exports = ExportPackageCommand;
module.exports.createCommand = new ExportPackageCommand(optionModel).createCommand();
