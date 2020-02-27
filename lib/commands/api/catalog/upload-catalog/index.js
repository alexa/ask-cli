const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const SmapiClient = require('@src/clients/smapi-client');
const S3Client = require('@src/clients/aws-client/s3-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');

const helper = require('./helper');

class UploadCatalogCommand extends AbstractCommand {
    name() {
        return 'upload-catalog';
    }

    description() {
        return 'upload a file for the catalog';
    }

    requiredOptions() {
        return ['catalog-id', 'file'];
    }

    optionalOptions() {
        return ['profile', 'debug'];
    }

    handle(cmd, cb) {
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
        _multiPartUploadCatalog(cmd.catalogId, cmd.file, smapiClient, (err) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            Messenger.getInstance().info('Catalog uploaded successfully.');
        });
    }
}

function _multiPartUploadCatalog(catalogId, filePath, smapiClient, callback) {
    const { totalSize, calculatedPartSize, calculatedPartsNumber } = helper._resolvePartSize(filePath);
    if (totalSize === 0 || calculatedPartSize === 0 || calculatedPartsNumber === 0) {
        return callback('[Error]: The file to be uploaded cannot be empty.');
    }

    helper._confirmOrOverwritePartSize(totalSize, calculatedPartSize, calculatedPartsNumber, (partSize, partsNumber) => {
        smapiClient.catalog.createCatalogUpload(catalogId, partsNumber, (createCatalogUploadError, createResponse) => {
            if (createCatalogUploadError) {
                callback(createCatalogUploadError);
                return;
            }
            if (!createResponse.body) {
                return process.nextTick(() => {
                    callback('[Error]: The response from create-catalog-upload should not be empty.');
                });
            }
            const uploadId = createResponse.body.id;
            if (!uploadId || !createResponse.body.presignedUploadParts) {
                return callback('[Error]: The response of create-catalog-upload is not valid.');
            }
            const uploadPartsMap = helper._transformUploadArrayToMap(createResponse.body.presignedUploadParts);
            if (!uploadPartsMap) {
                return callback('[Error]: The response from create-catalog-upload is empty.');
            }

            Messenger.getInstance().info(`Upload (upload-id: ${uploadId}) created successfully. Upload starts...`);
            S3Client.multipartsUploadToPresignedUrls(uploadPartsMap, filePath, totalSize, partSize, partsNumber, (err, partETagsList) => {
                if (err) {
                    return callback(err);
                }
                smapiClient.catalog.completeCatalogUpload(catalogId, uploadId, partETagsList, (completeCatalogUploadError) => {
                    callback(completeCatalogUploadError);
                });
            });
        });
    });
}

module.exports = {
    createCommand: new UploadCatalogCommand(optionModel).createCommand()
};
