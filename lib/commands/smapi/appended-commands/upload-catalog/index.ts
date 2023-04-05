import {AbstractCommand} from "../../../abstract-command";
import Messenger from "../../../../view/messenger";
import SmapiClient, {ISmapiClient} from "../../../../clients/smapi-client";
import optionModel from "../../../option-model.json";
import profileHelper from "../../../../utils/profile-helper";
import helper from "./helper";
import {OptionModel} from "../../../option-validator";

export default class UploadCatalogCommand extends AbstractCommand {
  name() {
    return "upload-catalog";
  }

  description() {
    return "upload a file for the catalog";
  }

  requiredOptions() {
    return ["catalog-id", "file"];
  }

  optionalOptions() {
    return ["profile", "debug"];
  }

  async handle(cmd: Record<string, any>): Promise<void> {
    let profile;
    try {
      profile = profileHelper.runtimeProfile(cmd.profile);
    } catch (err) {
      Messenger.getInstance().error(err);
      throw err;
    }
    const smapiClient = new SmapiClient({
      profile,
      doDebug: cmd.debug,
    });
    try {
      await _multiPartUploadCatalog(cmd.catalogId, cmd.file, smapiClient);
      Messenger.getInstance().info("Catalog uploaded successfully.");
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

async function _multiPartUploadCatalog(catalogId: string, filePath: string, smapiClient: ISmapiClient): Promise<void> {
  const {totalSize, calculatedPartSize, calculatedPartsNumber} = helper._resolvePartSize(filePath);
  if (totalSize === 0 || calculatedPartSize === 0 || calculatedPartsNumber === 0) {
    throw "[Error]: The file to be uploaded cannot be empty.";
  }

  return new Promise((resolve, reject) => {
    helper._confirmOrOverwritePartSize(totalSize, calculatedPartSize, calculatedPartsNumber, (partSize: number, partsNumber: number) => {
      smapiClient.catalog.createCatalogUpload(catalogId, partsNumber, (createCatalogUploadError: string, createResponse: any) => {
        if (createCatalogUploadError) {
          return reject(createCatalogUploadError);
        }
        if (!createResponse.body) {
          return process.nextTick(() => {
            reject("[Error]: The response from create-catalog-upload should not be empty.");
          });
        }
        const uploadId = createResponse.body.id;
        if (!uploadId || !createResponse.body.presignedUploadParts) {
          return reject("[Error]: The response of create-catalog-upload is not valid.");
        }
        const uploadPartsMap = helper._transformUploadArrayToMap(createResponse.body.presignedUploadParts);
        if (!uploadPartsMap) {
          return reject("[Error]: The response from create-catalog-upload is empty.");
        }

        Messenger.getInstance().info(`Upload (upload-id: ${uploadId}) created successfully. Upload starts...`);
        helper._multipartsUploadToPresignedUrls(
          uploadPartsMap,
          filePath,
          totalSize,
          partSize,
          partsNumber,
          (err: any, partETagsList: any) => {
            if (err) {
              return reject(err);
            }
            smapiClient.catalog.completeCatalogUpload(catalogId, uploadId, partETagsList, (completeCatalogUploadError: any) => {
              if (completeCatalogUploadError) {
                return reject(completeCatalogUploadError);
              }
              resolve();
            });
          },
        );
      });
    });
  });
}

export const createCommand = new UploadCatalogCommand(optionModel as OptionModel).createCommand();
